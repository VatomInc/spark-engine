import { utils } from "@varius.io/framework";

export default async function logMiddleware(req, res, next) {
	await next();
	utils.logger.debug("http req", req.method, req.url, "->", res.statusCode);
}
