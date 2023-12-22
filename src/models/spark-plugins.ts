import { services } from "@varius.io/framework";

type SparkPlugin = {
	id: string;
	name: string;
	description: string;
	commUrl: string;
	commSecret: string;
}

function rowToObj(row): SparkPlugin {
	if (!row) return row;
	return {
		id: row.id,
		name: row.name,
		description: row.description,
		commUrl: row.comm_url,
		commSecret: row.comm_secret,
	};
}

export async function list(pg: services.pg, businessId: string): Promise<SparkPlugin[]> {
	const res = await pg.runQuery(`
		SELECT * FROM spark_plugin
		WHERE id IN (
			SELECT plugin_id
			FROM business_spark_plugin
			WHERE business_id = $1
		)
	`, [businessId]);

	return res.rows.map($ => rowToObj($));
}

export async function get(pg: services.pg, pluginId: string): Promise<SparkPlugin> {
	const res = await pg.runQuery(`
		SELECT * FROM spark_plugin WHERE id = $1
	`, [pluginId]);

	return rowToObj(res.rows[0]);
}
