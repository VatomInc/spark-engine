import { Users } from "#src/models";
import { http, services } from "@varius.io/framework";

export default async function (event: http.lambda.LambdaEvent) {
	const {} = event.pathParameters;
	const pg = await services.pg.connectForEvent(event);
	const users = await Users.list(pg);
	return http.responses.okItems(users);
}
