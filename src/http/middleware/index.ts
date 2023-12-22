import { Express } from "express";

import * as bodyParser from "body-parser";
import logMiddleware from "./log";
import authorize from "./authorize";

export default function addMiddlewares(app: Express) {
	app.use(bodyParser.json());
	app.use(bodyParser.urlencoded({ extended: false }));
	app.use(logMiddleware);
}

export { authorize };
