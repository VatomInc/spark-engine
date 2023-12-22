import * as assert from "assert";

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("dotenv").config();

interface Env {
	ISS: string;
	NODE_ENV: string;
	PORT: string;
	STAGE: string;
	STUDIO_API_BASE: string;
}

const required: Array<keyof Env> = [
	"ISS",
	"NODE_ENV",
	"PORT",
	"STAGE",
	"STUDIO_API_BASE"
];

const defaults: { [key in keyof NodeJS.ProcessEnv]?: string } = {
	NODE_ENV: "development",
	PORT: "3000",
};

// set defaults and ensure required

for (const name of required) {
	process.env[name] = process.env[name] ?? defaults[name];
	assert.notStrictEqual(
		process.env[name],
		undefined,
		`env var named ${JSON.stringify(name)} must be set`
	);
}

declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace NodeJS {
		// eslint-disable-next-line @typescript-eslint/no-empty-interface
		interface ProcessEnv extends Env {}
	}
}

// export as object for back-compat
export default process.env;
