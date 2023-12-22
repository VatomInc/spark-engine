import { Pool, PoolClient, QueryResult, QueryConfig } from "pg";
import { strict as assert } from "assert";
import { EmitterEventType, GenericLambdaEvent } from "@varius.io/framework/build/integrations/lambda";
import { utils } from "@varius.io/framework";

if ((global as any).mxpool === undefined) {
	(global as any).mxpool = new Pool({
		user: process.env.MATRIX_PGUSER,
		database: process.env.MATRIX_PGDATABASE,
		password: process.env.MATRIX_PGPASSWORD,
		port: Number.parseInt(process.env.MATRIX_PGPORT ?? "") || 5432,
		host: process.env.MATRIX_PGHOST,
		native: true,
		max: Number.parseInt(process.env.MATRIX_PGPOOLMAX ?? "") || 5,
	} as any);
}

interface OnConflict {
	target?: string;
	action: string;
}

export class PgQueryError extends Error {
	constructor(public query: string, values: string, error: Error) {
		super(`Matrix DB query error: ${error.message}\nFailed query:\n${query}\nValues:\n${values}`);
	}
}

// note: the client will automatically read in standard PostgreSQL connection environment variables...
// these are set in the `serverless.yml` file
// ref: https://www.postgresql.org/docs/9.3/static/libpq-envars.html

/**
 * Handles postgres database connection and disconnection.
 */
export default class MatrixDB {
	private client?: PoolClient;

	/**
	 * Easily initialize and connect to a database instance.
	 */
	static async withConnection<T>(callback: (pg: MatrixDB) => Promise<T>): Promise<T> {
		const pg = new MatrixDB();
		await pg.connect();

		try {
			const res = await callback(pg);
			return res;
		} catch (e) {
			throw e;
		} finally {
			pg.disconnect();
		}
	}

	/**
	 * Attaches the database to the lambda event to ensure disconnection.
	 * @param event The event.
	 */
	static async connectForEvent(event: GenericLambdaEvent): Promise<MatrixDB> {
		const db = new MatrixDB();

		// disconnect from the database before the aws lambda callback is finished
		
		event.emitter.on(EmitterEventType.PostResponseCleanup, async () => {
			if (db.isConnected) {
				db.disconnect();
			}
		});
		
		event.emitter.on(EmitterEventType.UncaughtHandlerError, async () => {
			if (db.isConnected) {
				db.disconnect();
			}
		});

		return db;
	}

	get isConnected(): boolean {
		return this.client !== undefined;
	}

	/**
	 * Connect to the database.
	 */
	public async connect(): Promise<void> {
		if (this.isConnected === false) {
			this.client = await (global as any).mxpool.connect();
		}
	}

	/**
	 * Disconnect from the database.
	 */
	public async disconnect(): Promise<void> {
		utils.logger.debug("disconnect");
		if (this.isConnected) {
			this.client!.release();
			this.client = undefined;
		}
	}

	public async runQuery(
		queryTextOrConfig: string | QueryConfig,
		values?: any[]
	): Promise<QueryResult> {
		if (this.isConnected === false) {
			await this.connect();
		}
		
		try {
			const now = new Date();
			const res = await this.client!.query(queryTextOrConfig, values);
			const duration = (new Date().getTime()) - now.getTime();
			utils.logger.debug(`pg: ran query:\n${queryTextOrConfig}`, "values", values, JSON.stringify({ ms: duration, rowCount: res.rowCount }));
			
			return res;
		}
		catch (e) {
			if (e instanceof Error)
				throw new PgQueryError(typeof queryTextOrConfig === "string" ? queryTextOrConfig : JSON.stringify(queryTextOrConfig), JSON.stringify(values), e);
			else	
				throw e
		}	
	}

	/**
	 * Select entries from the database using a condition.
	 * @param tableName The name of the table to select from.
	 * @param conditions The conditions which must pass for each row.
	 * @param columns The columns to receive back (all by default)
	 */
	public async select(
		tableName: string,
		conditions: { [key: string]: any },
		columns?: string[]
	): Promise<QueryResult> {
		let conditionsStr: string = "";
		let index = 0;

		if (Object.keys(conditions).length > 0) {
			conditionsStr = `WHERE ${Object.keys(conditions)
				.map(key => {
					const condition = conditions[key];

					// support multiple values for a condition by wrapping in parenthesis and joining with OR
					if (Array.isArray(condition)) {
						return `(${condition.map(() => `${key} = $${++index}`).join(" OR ")})`;
					}

					return `${key} = $${++index}`;
				})
				.join(" AND ")}`;
		}

		const query: string = `
			SELECT
				${columns === undefined ? " *" : columns.join(", ")}
			FROM
				${tableName}
			${conditionsStr}
		`;

		const flatConditions = [].concat(...Object.values(conditions));

		return this.runQuery(query, flatConditions);
	}
	
	/**
	 * Select a single row from the database using a condition.
	 * @param tableName The name of the table to select from.
	 * @param conditions The conditions which must pass for each row.
	 * @param columns The columns to receive back (all by default)
	 */
	public async selectOne(
		tableName: string,
		conditions: { [key: string]: any },
		columns?: string[]
	): Promise<any> {
		const res = await this.select(tableName, conditions, columns);
		assert.equal(res.rowCount, 1, `pg: selectOne should result in exactly 1 row: ${tableName} ${JSON.stringify(conditions)} ${JSON.stringify(columns)}`);
		const row = res.rows[0];
		return row;
	}

	/**
	 * Insert an entry into the database.
	 * @param tableName The name of the table to insert into.
	 * @param columns The column values to insert.
	 */
	public async insert(tableName: string, columns: { [key: string]: any }): Promise<void> {
		const query: string = `
			INSERT INTO ${tableName} (
				${Object.keys(columns).join(",")}
			)
			VALUES (
				${Object.values(columns)
					.map((_, i) => `$${i + 1}`)
					.join(",")}
			)
		`;

		await this.runQuery(query, Object.values(columns));
	}

	/**
	 * Upsert an entry into the database.
	 * @param tableName The name of the table to insert into.
	 * @param columns The column values to insert.
	 * @param onConflict What action to take on conflict
	 */
	public async upsert(
		tableName: string,
		columns: { [key: string]: any },
		{ target, action }: OnConflict = {
			target: "",
			action: "NOTHING",
		}
	): Promise<void> {
		const query: string = `
			INSERT INTO ${tableName} (
				${Object.keys(columns).join(",")}
			)
			VALUES (
				${Object.values(columns)
					.map((_, i) => `$${i + 1}`)
					.join(",")}
			)
			ON CONFLICT ${target}
			DO ${action}
		`;

		await this.runQuery(query, Object.values(columns));
	}

	/**
	 * Insert an entry into the database.
	 * @param tableName The name of the table to insert into.
	 * @param columns The column values to insert.
	 */
	public async update(
		tableName: string,
		conditions: { [key: string]: any },
		updatedColumns: { [key: string]: any }
	): Promise<QueryResult> {
		const query: string = `
			UPDATE ${tableName} SET
				${Object.keys(updatedColumns)
					.map((c, i) => `${c} = $${i + 1}`)
					.join(",")}
			
			WHERE
				${Object.keys(conditions)
					.map((key, i) => `${key} = $${Object.keys(updatedColumns).length + 1 + i}`)
					.join(" AND ")}
		`;

		return this.runQuery(query, [...Object.values(updatedColumns), ...Object.values(conditions)]);
	}

	/**
	 * Deletes entries from the database using a condition.
	 * @param tableName The name of the table to select from.
	 * @param conditions The conditions which must pass for each row.
	 */
	public async delete(tableName: string, conditions: { [key: string]: any }): Promise<QueryResult> {
		const query: string = `
			DELETE FROM
				${tableName}
			WHERE
				${Object.keys(conditions)
					.map((key, i) => `${key} = $${i + 1}`)
					.join(" AND ")}
		`;

		return this.runQuery(query, Object.values(conditions));
	}

	public async beginTransaction(): Promise<void> {
		await this.runQuery("BEGIN");
	}

	public async commitTransaction(): Promise<void> {
		await this.runQuery("COMMIT");
	}

	public async rollbackTransaction(): Promise<void> {
		await this.runQuery("ROLLBACK");
	}

	public async transact<T>(func: () => Promise<T>): Promise<T> {
		await this.beginTransaction();

		let res: T;

		try {
			res = await func();
			await this.commitTransaction();
			return res;
		} catch (e) {
			await this.rollbackTransaction();
			throw e;
		}
	}
}
