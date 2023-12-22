import { Express } from "express";

import * as bodyParser from "body-parser";
import logMiddleware from "./log";

const cors = require("cors");

export function addPreMiddlewares(app: Express) {
	// Sentry says that these must be the first middlewares on the app.

	app.use(cors());

	app.use(bodyParser.json({ limit: "1mb" }));
	app.use(bodyParser.urlencoded({ extended: false }));

	app.use(logMiddleware);
}

export function addPostMiddlewares(app: Express) {

}

export { default as authorize } from "./authorize";

