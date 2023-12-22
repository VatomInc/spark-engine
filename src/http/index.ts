import { utils, http, services } from "@varius.io/framework";
import express from "express";
import { strict as assert } from "assert";
import cache from "./middleware/cache";
import { authorize, addPreMiddlewares, addPostMiddlewares } from "./middleware";
import * as path from "path";
import routes from "./routes";
import { srcDir } from "..";

export interface Route {
	file: string;
	path: string;
	method: string;
	public?: boolean;
}

const port = Number.parseInt(process.env.PORT ?? "3000", 10);

// The "router" handles everything except the health check, which is added to
// "app" directly to avoid tracing it in Sentry.
const app = express();
export const router = express();

export function validateRoute(route: any): asserts route is Route {
	const {
		public: isPublic = false,
		file,
		path: httpPath,
		method,
	} = route;

	assert.equal(typeof isPublic, "boolean");
	assert.equal(typeof file, "string");
	assert.equal(typeof httpPath, "string");
	assert.equal(typeof method, "string");
}

export function addRoute(route: Route) {
	const {
		public: isPublic = false,
		file,
		path: httpPath,
		method,
	} = route;
	
	const required = require(path.join(srcDir, file));
	
	const handler = http.express.wrap(required.default, {
		requestBodySchema: required.requestBodySchema,
		async: required.async,
	});
	
	assert.equal(typeof handler, "function");

	router._router.stack.forEach(function(middleware){
		if(middleware.route && middleware.route.path === httpPath && middleware.route.methods[method] === true) { 
			console.log("Warning, route already registered: ", method, httpPath )
		}
	});

	if (isPublic) {
		router[method](httpPath, cache(route), handler);
	}
	else {
		router[method](httpPath, cache(route), authorize, handler);
	}
}

export function start() {
	addPreMiddlewares(router);

	for (const route of routes) {
		try {
			validateRoute(route);
			addRoute(route);
		}
		catch (e) {
			utils.logger.error(`error loading route: ${JSON.stringify(route)} ${e}`);
			throw e;
		}
	}

	addPostMiddlewares(router);
	app.use(router);

	app.listen(port);
	utils.logger.info(`Listening on port ${port}...`);
}

