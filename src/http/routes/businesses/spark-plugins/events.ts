import * as SparkPlugins from "#src/models/spark-plugins";
import { http, services, utils } from "@varius.io/framework";
import axios from "axios";

const crypto = require("crypto").webcrypto;

export default async function(event: http.lambda.LambdaEvent) {
	const pg = await services.pg.connectForEvent(event);
	const { businessId, pluginId } = event.pathParameters;
	const plugin = await SparkPlugins.get(pg, pluginId);

	const utf8 = new TextEncoder();
	const bodyStr = JSON.stringify(event.body);
	const sigAlg = { name: "HMAC", hash: "SHA-256" };

	const sigKey = await crypto.subtle.importKey(
		"raw",
		utf8.encode(plugin.commSecret),
		sigAlg,
		false, // not exportable
		["sign"],
	);

	const sigTs = Date.now();
	const sigBuf = await crypto.subtle.sign(sigAlg, sigKey, utf8.encode(sigTs + ":" + bodyStr));
	const sig = Buffer.from(sigBuf).toString("base64");

	if (plugin.commUrl.includes("://example.com")) {
		utils.logger.debug("mock sent event to plugin server %s %j", plugin.commUrl, event.body);
		return;
	}

	const { data, status } = await axios.post(plugin.commUrl + "/events", bodyStr, {
		headers: {
			"content-type": "application/json; charset=utf-8",
			"x-signature-sha256": sig,
			"x-signature-timestamp": sigTs.toString(),
		},
	});

	utils.logger.debug("sent event to plugin server %s %j", plugin.commUrl, event.body);
	return http.responses.ok(data);
}
