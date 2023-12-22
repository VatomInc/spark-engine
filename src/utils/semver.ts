/**
 * NOTE: This is an example util.
 */

export interface SemverObject {
	major: number;
	minor: number;
	patch: number;
}

export function stringify(obj: SemverObject): string {
	return [obj.major, obj.minor, obj.patch].join(".");
}
