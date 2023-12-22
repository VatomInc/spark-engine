import { utils, http } from "@varius.io/framework";
import * as express from "express";
import { strict as assert } from "assert";
import cache from "./middleware/cache";
import addMiddlewares, { authorize } from "./middleware";
import routes from "./routes";

const { PORT } = process.env;

export interface Route {
	file: string;
	path: string;
	method: string;
	public?: boolean;
}

const port = Number.parseInt(PORT, 10);

const app = express();

export function validateRoute(route: any): asserts route is Route {
	const { public: isPublic = false, file, path: httpPath, method } = route;

	assert.equal(typeof isPublic, "boolean");
	assert.equal(typeof file, "string");
	assert.equal(typeof httpPath, "string");
	assert.equal(typeof method, "string");
}

export function addRoute(route: Route) {
	const { public: isPublic = false, file, path: httpPath, method } = route;

	// eslint-disable-next-line @typescript-eslint/no-var-requires
	const required = require(file);
	const hasDefault = required.default !== undefined;

	const handler = hasDefault
		? http.express.wrap(required.default, { requestBodySchema: required.requestBodySchema })
		: required.expressHandler;

	assert.equal(typeof handler, "function");

	if (isPublic) {
		app[method](httpPath, cache(route), handler);
	} else {
		app[method](httpPath, cache(route), authorize, handler);
	}

	utils.logger.debug("loaded http route", method, httpPath);
}

export function start() {
	app.disable("x-powered-by");
	addMiddlewares(app);

	for (const route of routes) {
		try {
			validateRoute(route);
			addRoute(route);
		} catch (e) {
			utils.logger.error(`error loading route: ${JSON.stringify(route)} ${e}`);
			throw e;
		}
	}

	app.listen(port);
	utils.logger.info(`Listening on port ${port}...`);
}
