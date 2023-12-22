import { utils } from "@varius.io/framework";
const NodeCache = require("node-cache");
const nodeCache = new NodeCache({ stdTTL: 300, checkperiod: 20 });

interface CachedResponse {
	contentType: string;
	body: any;
}

function getResolvedCacheKey(req, route) {
	const {
		path,
		method,
		cacheKeys,
	} = route;

	if (!cacheKeys || cacheKeys.length === 0) {
		return undefined;
	}

	const resolvedCacheKeys = [];
	for (const cacheKey of cacheKeys) {
		if (cacheKey.startsWith("request.path")) {
			// resolve path parameter
			const pathParamName = cacheKey.split(".")[2];
			resolvedCacheKeys.push(req.params[pathParamName]);
		}
		if (cacheKey.startsWith("request.querystring")) {
			// resolve query parameter
			const queryParamName = cacheKey.split(".")[2];
			resolvedCacheKeys.push(req.query[queryParamName]);
		}
	}
	return `${method}.${path}.${resolvedCacheKeys.join(".")}`;
}

export default function cache(route) {
	return (req, res, next) => {
		const resolvedCacheKey = getResolvedCacheKey(req, route);
		const { cacheTTL } = route;
		if (resolvedCacheKey !== undefined) {
			const cachedResponse: CachedResponse = nodeCache.get(resolvedCacheKey);

			if (!cachedResponse) {
				utils.logger.debug("cache miss key=%s", resolvedCacheKey);
				const oldSend = res.send.bind(res);
				res.send = (body) => {
					if (res.statusCode >= 200 && res.statusCode < 300) {
						nodeCache.set(resolvedCacheKey, {
							contentType: res.get("Content-Type") || "text/plain",
							body,
						}, cacheTTL || 300);
						res.set("x-api-cache", "Miss")
					}
					oldSend(body);
				}
				next();
			} else {
				utils.logger.debug("cache hit key=%s", resolvedCacheKey);
				res.set("Content-Type", cachedResponse.contentType);
				res.set("x-api-cache", "Hit")
				res.send(cachedResponse.body)
			}
		} else {
			next();
		}
	}
}
