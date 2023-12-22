import * as dotenv from "dotenv";
import { readFileSync, writeFileSync } from "fs";
import * as path from "path";
import Pg from "pg";
import { SequelizeStorage, Umzug } from "umzug";
import { fileURLToPath } from "url";

const fatal = (str, ...args) => {
	console.error("error: " + str, ...args);
	process.exit(1);
};

dotenv.config();

const parse = (name, sql) => {
	let up = "";
	let down = "";
	let state;

	for (const line of sql.split("\n")) {
		if (line.match(/--(\W)*BEGIN UP/)) {
			if (state) fatal("BEGIN UP: unexpected state: %s", state);
			else state = "in-up";
		} else if (line.match(/--(\W)*END UP/)) {
			if (state !== "in-up") fatal("END UP: unexpected state: %s", state);
			else state = "after-up";
		} else if (line.match(/--(\W)*BEGIN DOWN/)) {
			if (state !== "after-up") fatal("BEGIN DOWN: unexpected state: %s", state);
			else state = "in-down";
		} else if (line.match(/--(\W)*END DOWN/)) {
			if (state !== "in-down") fatal("END DOWN: unexpected state: %s", state);
			else state = "after-down";
		} else if (state === "in-up") {
			up += line + "\n";
		} else if (state === "in-down") {
			down += line + "\n";
		}
	}

	if (state !== "after-down") fatal("mig/%s: malformed?", name);
	
	// remove final "\n"
	if (up.length > 0) up = up.slice(0, -1);
	if (down.length > 0) down = down.slice(0, -1);

	return { up, down };
};

class PgStorage {
	constructor(pg) {
		this.pg = pg;
	}

	async logMigration(name) {
		await this.pg.query("INSERT INTO \"Migrations\" (name) VALUES ($1)", [name]);
	}

	async unlogMigration(name) {
		await this.pg.query("DELETE FROM \"Migrations\" WHERE name = $1", [name]);
	}

	async executed() {
		const res = await this.pg.query("SELECT name FROM \"Migrations\" ORDER BY name ASC");
		return res.rows.map($ => $.name);
	}
}

async function setup() {
	if (!process.env.PGCONN) fatal("PGCONN=?");
	const pg = new Pg.Client(process.env.PGCONN, { native: true });
	await pg.connect();

	const umzug = new Umzug({
		storage: new PgStorage(pg),
		logger: console,
		migrations: {
			glob: "mig/*.sql",
			resolve: ({ name, path: fpath }) => {
				const sql = readFileSync(fpath).toString();
				if (!sql) fatal("%s: could not read file", name);
				const { up, down } = parse(name, sql);

				return {
					name: path.basename(name, ".sql"), // remove file ext
					up: async () => await pg.query(up),
					down: async () => await pg.query(down),
				};
			},
		},
	});

	return { umzug, pg };
}

const usage = () => {
	console.error("usage: gen | up | down");
	process.exit(1);
};

async function main() {
	if (process.argv.length < 3) usage();
	const action = process.argv[2];

	if (action === "gen") {
		const now = new Date();
		const fname = [
			now.getUTCFullYear(),
			now.getUTCMonth() + 1,
			now.getUTCDate(),
			now.getUTCHours(),
			now.getUTCMinutes(),
			now.getUTCSeconds()
		].map($ => $.toString().padStart(2, "0")).join("") + ".sql";
		const fpath = path.join("mig", fname);
		writeFileSync(fpath, "-- BEGIN UP\n-- END UP\n\n-- BEGIN DOWN\n-- END DOWN\n");
		console.log(fpath);
	} else if (action === "up") {
		const { umzug, pg } = await setup();
		const migs = await umzug.up();
		for (const $ of migs) console.log($.name);
		await pg.end();
	} else if (action === "down") {
		const { umzug, pg } = await setup();
		const migs = await umzug.up();
		for (const $ of migs) console.log($.name);
		await pg.end();
	} else usage();
}

main();
