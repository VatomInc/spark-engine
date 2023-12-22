/**
 * NOTE: This file is an example.
 */

import { services } from "@varius.io/framework";

export interface User {
	id: string;
	name: string;
}

export async function getById(id: string, pg: services.pg): Promise<User | undefined> {
	const { rows } = await pg.select("user", { id });

	if (rows.length === 0) {
		return undefined;
	}

	const [row] = rows;

	return {
		id: row.id,
		name: row.name,
	};
}

export async function list(pg: services.pg): Promise<User[]> {
	const query = `
		SELECT
			*
		FROM
			user
	`;

	const res = await pg.runQuery(query, []);

	const items = res.rows.map((row) => ({
		id: row.id,
		name: row.name,
	}));

	return items;
}
