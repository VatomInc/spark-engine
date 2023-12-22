import { http, services } from "@varius.io/framework";

export default async function (event: http.lambda.LambdaEvent) {
    return http.responses.ok();
}
