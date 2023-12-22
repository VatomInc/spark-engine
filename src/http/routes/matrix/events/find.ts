import { http, services, utils } from "@varius.io/framework";
import axios from "axios";

const { MATRIX_API_BASE } = process.env;

// TODO: move to DB?
const APP_SERVICE_TOKEN = 'REPLACE';

const ax = axios.create({
    baseURL: MATRIX_API_BASE,
    headers: {
      Authorization: `Bearer ${APP_SERVICE_TOKEN}`
    }
});


export default async function (event: http.lambda.LambdaEvent) {

    const { roomId } = event.pathParameters;
    
    const { filter } = event.queryParameters;
    
    //TODO: Determine businessId for room and check that token scope includes businessId
    
    utils.logger.info("Matrix findEvent:", roomId, filter);
    
    const { data } = await ax.get(`/_matrix/client/v3/rooms/${roomId}/messages?filter=${encodeURIComponent(filter)}`, {
        validateStatus: null
    });

    return http.responses.ok(data);
}
