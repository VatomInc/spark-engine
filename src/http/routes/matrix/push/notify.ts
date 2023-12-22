import { http, services, utils } from "@varius.io/framework";
import axios from "axios";

const ONESIGNAL_API_KEY="REPLACE"
const ONESIGNAL_API_SECRET="REPLACE"

const ax = axios.create({
    baseURL: "https://onesignal.com/api",
    headers: {
      Authorization: `Basic ${ONESIGNAL_API_SECRET}`
    }
});


export const replaceHtmlEntites = (function() {
    var translate_re = /&(nbsp|amp|quot|lt|gt);/g;
    var translate = {
      "nbsp": " ",
      "amp" : "&",
      "quot": "\"",
      "lt"  : "<",
      "gt"  : ">"
    };
    return function(s) {
      return ( s.replace(translate_re, function(match, entity) {
        return translate[entity];
      }) );
    }
  })();

export default async function (lambdaEvent: http.lambda.LambdaEvent) {
    try {
        //TODO: Determine businessId for room and check that token scope includes businessId
        utils.logger.info("Matrix notify:", JSON.stringify(lambdaEvent.body));

        const { content, devices, room_name, room_id, sender } = lambdaEvent.body.notification
        let { sender_display_name } = lambdaEvent.body.notification

        const matrixOrVatomUserId = devices[0].pushkey
        const userId = matrixOrVatomUserId.split(':')[0].replace('@', '')

        if (!sender) {
            utils.logger.warn("No sender in notification:", JSON.stringify(lambdaEvent.body));
            return http.responses.ok({
                rejected: []
            });
        }
        const senderMatrixToken = await services.matrix.getMatrixToken(sender.split(':')[0].replace('@', ''));
        const [ alias ] = await services.matrix.getRoomAliases(senderMatrixToken, room_id)
        const businessId = alias.split(':')[0].split('.')[0].replace('#', '')
        // const spaceId = alias.split(':')[0].split('.')[1]
        // const space = await services.spaces.get(businessId, spaceId);
        // const communityId = space.communityId || space.businessId
        // const businesses = await services.businesses.get(businessId);
        // const url = `https://wallet.vatom.com/b/${businessId}/c/${communityId}/room/${encodeURIComponent(room_id)}`
        const url = `https://wallet.vatom.com/b/${businessId}`
        utils.logger.info("Deep link:", url);

        if (sender.includes(sender_display_name)) {
            const profile = await services.user.getPublicProfile(sender_display_name)
            sender_display_name = profile?.name || sender_display_name
        }

        if (content.body) {
            const msg = replaceHtmlEntites(content.body.length > 60 ? `${content.body.substring(0, 50)}...` : content.body).trim()
            const notification = {
                app_id: ONESIGNAL_API_KEY,
                include_external_user_ids: [userId],
                channel_for_external_user_ids: "push",
                
                // The sender
                headings: {
                    en: sender_display_name
                },

                // The room
                subtitle: {
                    en: room_name
                },

                // The message first line?
                contents: {
                    en: msg
                },

                // The deep link to the room
                app_url: url
            }

            // const shouldSend = businesses && businesses.matrixSpaceId && userId === '5b5f8234750f272b79321c71'
            utils.logger.info("Sending notification:", JSON.stringify(notification));
            
            // if (shouldSend) {
            ax.post(`/v1/notifications`, notification)
            // }
        }
        
        return http.responses.ok({
            rejected: []
        });
    } catch (err) {
        utils.logger.error("Error sending notification:", err, JSON.stringify(lambdaEvent.body));
        throw err
    }
}
