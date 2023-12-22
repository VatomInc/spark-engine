import { http, services, utils } from "@varius.io/framework";
import axios from "axios";

const { MATRIX_API_BASE } = process.env;

// TODO: move to DB?
const APP_SERVICE_TOKEN = '30c05ae90a248a4188e620216fa72e349803310ec83e2a77b34fe90be6081f46';

const ax = axios.create({
    baseURL: MATRIX_API_BASE,
    headers: {
      Authorization: `Bearer ${APP_SERVICE_TOKEN}`
    }
});


export default async function (lambdaEvent: http.lambda.LambdaEvent) {

    const { roomId, eventType } = lambdaEvent.pathParameters;
    
    //TODO: Determine businessId for room and check that token scope includes businessId
    
    utils.logger.info("Matrix sendEvent:", roomId, eventType, lambdaEvent.body);
    
    let response = await ax.post(`/_matrix/client/v3/rooms/${roomId}/send/${eventType}`, lambdaEvent.body, {
        validateStatus: null
    });

    const { data, status } = response;

    if (status === 403 && data.errcode === "M_FORBIDDEN") {
        // Join room
        await ax.post(`/_matrix/client/v3/join/${roomId}`, {});
        response = await ax.post(`/_matrix/client/v3/rooms/${roomId}/send/${eventType}`, lambdaEvent.body)
    }
	
	return http.responses.ok(response.data);
}
