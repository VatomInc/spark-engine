// VatomInc-Module-Identifier: oidc-authz variant=express
//
// NOTE: Before making a change to this file, please use the above line to
// perform a code search across all VatomInc repositories:
//
// https://github.com/search?q=VatomInc-Module-Identifier%3A+oidc%3Aauthz
//
// The above allows us to compare different implementations of this module
// across all of our products. When possible, try to make your changes as
// generalized and consistent across the products, and think deliberately before
// adding new dependencies (ie. imports of npm packages).

// OAuth 2.0 Bearer Token Usage: https://www.rfc-editor.org/rfc/rfc6750.txt

import { strict as assert } from "assert";
import axios from "axios";
import { Request, Response, NextFunction } from "express";
import * as jose from "jose";
import * as NodeCache from "node-cache";

const { ISS, STUDIO_API_BASE: studioBase } = process.env;
assert(ISS, "missing ISS env var");
assert(studioBase, "missing STUDIO_API_BASE env var");

const azCache = new NodeCache({ stdTTL: 5 * 60 /* 5 mins */, checkperiod: 20 });
export const keysCache = new NodeCache({ stdTTL: 5 * 60 /* 5 mins */ });

export const memo = async (c: NodeCache, key: string, f: () => Promise<any>) => {
	const cached = c.get(key);
	if (cached) return cached;
	const val = await f();
	c.set(key, val);
	return val;
};

interface Permission {
	action: string; // "*" (wildcard) or "read"
	subject: string; // http path (with optional wildcards for matching)
}

const scopeToPermission = (s: string): Permission | null => {
	const m = s.match(/^http:(read|\*):(.+)$/);
	if (!m) return null;
	return { action: m[1], subject: m[2] };
};

/** Return http path without trailing slash. */
const normalizePath = (p: string) => (p.endsWith("/") ? p.substring(0, p.length - 2) : p);

const checkPermission = (method: string, path: string, perm: Permission): boolean => {
	const WILDCARD = "*"; // Indicates anything matches this path part.

	if (perm.action === "read" && method.toLowerCase() !== "get") return false;

	const subjParts = perm.subject.split("/");
	const pathParts = path.split("/");

	for (let i = 0; i < subjParts.length; i++) {
		if (subjParts[i] === WILDCARD) return true;
		else if (subjParts[i] !== pathParts[i]) return false;
	}

	return true;
};

async function checkAuth(method: string, path: string, tok: string) {
	if (!tok) return [401, "invalid_request", "token missing or invalid"];

	let keys: any[] = [];
	for (const iss of ISS.split(",")) {
		const k = await memo(keysCache, iss, async () => {
			try {
				const { data } = await axios.get(`${iss}/.well-known/openid-configuration`);
				return (await axios.get(data.jwks_uri)).data.keys;
			} catch (e) {
				console.error("error: could not get oidc config for issuer: %s - %s", iss, e);
				return [];
			}
		});
		keys = [...keys, ...k];
	}

	const keyStore = new jose.JWKS.KeyStore(keys.map($ => jose.JWK.asKey($)));
	let dec: any;

	try {
		dec = jose.JWT.verify(tok, keyStore, { issuer: ISS.split(","), algorithms: ["RS256"] });
	} catch (e) {
		if (e instanceof jose.errors.JWTExpired) return [401, "invalid_token", "token expired"];
		else if (e instanceof jose.errors.JWTMalformed) return [401, "invalid_token", "token malformed"];
		else if (e instanceof jose.errors.JOSEAlgNotWhitelisted) return [401, "invalid_token", "bad alg"];
		else if (e instanceof jose.errors.JWKSNoMatchingKey) return [401, "invalid_token", "no matching key"];
		throw e;
	}

	if (!dec) return [401, "invalid_token", "token undecodable"];

	const azKey = `${dec.sub}|${method}|${path}`;
	const isAuz = await memo(azCache, azKey, async () => {
		const scopes: string[] = dec.scope?.split?.(" ") ?? [];
		if (!dec.sub && scopes)
			return scopes.map(scopeToPermission).filter($ => $ !== null).some($ => checkPermission(method, path, $));

		const { data } = await axios.get<Permission[]>(`${studioBase}/u/me/permissions`, {
			headers: { authorization: `Bearer ${tok}` },
		});

		return data.some(($) => checkPermission(method, path, $));
	});

	if (isAuz) return [];
	else return [403, "insufficient_scope", "request not permitted"];
}

export async function isAuz(method: string, path: string, tok: string) {
	const [status] = await checkAuth(method, path, tok);
	return !status;
}

export default async function authorize(req: Request, res: Response, next: NextFunction) {
	try {
		const method = req.method;
		const path = normalizePath(req.path);
		const tok = req.header("authorization")?.match?.(/^Bearer (\S+)$/i)?.[1];

		const [status, error, desc] = await checkAuth(method, path, tok);

		if (status) {
			res.status(status as number);
			res.set("WWW-Authenticate", `Bearer error="${error}", error_description="${desc}"`);
			res.send({ error, error_description: desc });
		}
		else return next();
	}
	catch (e) {
		next(e); // NOTE: Express 5+ lets you just throw instead of this.
	}
}