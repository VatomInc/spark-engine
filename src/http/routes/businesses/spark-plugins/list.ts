import * as SparkPlugins from "#src/models/spark-plugins";
import { http, services } from "@varius.io/framework";
import axios from "axios";

export default async function(event: http.lambda.LambdaEvent) {
	const pg = await services.pg.connectForEvent(event);
	const { businessId } = event.pathParameters;
	let items = await SparkPlugins.list(pg, businessId);

	// If no plugins, return the system plugin.
	// TODO: when merging is enabled, we should merge with the system plugin.
	if (items.length === 0) items = await SparkPlugins.list(pg, "system");

	await Promise.all(items.map(async item => {
		const res = await axios.get(item.commUrl + "/plugin.json");
		(item as any).descriptor = res.data;
	}));

	for (const $ of items) delete $.commSecret;
	return http.responses.ok(items);
}
