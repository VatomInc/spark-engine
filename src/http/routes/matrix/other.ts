import { http, utils } from "@varius.io/framework";

export default async function (event: http.lambda.LambdaEvent) {
    utils.logger.info("Unknown Matrix event:", event);
	
	return http.responses.ok({});
}
