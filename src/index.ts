// enable project-wide source-maps during runtime
import "source-map-support/register";
import "./env";

import { utils } from "@varius.io/framework";

import * as http from "./http";

// note: this must come before the rest of the code in this file
export const srcDir = __dirname;

if (require.main === module) {
	utils.logger.debug("starting...");
	http.start();
	utils.logger.info("started");
}
