import { createHash } from "node:crypto";

export function hashPlatformApiKey(key: string): string {
	return createHash("sha256").update(key).digest("hex");
}

export function maskPlatformApiKey(storedKey: string): string {
	if (storedKey.startsWith("ux_sk_")) {
		return `${storedKey.slice(0, 8)}${"*".repeat(24)}${storedKey.slice(-4)}`;
	}

	return `ux_sk_${"*".repeat(28)}`;
}
