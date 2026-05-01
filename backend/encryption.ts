import {
	createCipheriv,
	createDecipheriv,
	randomBytes,
	scryptSync,
} from "node:crypto";

const ALGORITHM = "aes-256-gcm";

function getKey(): Buffer {
	const secret = process.env.AUTH_SECRET;
	if (!secret) throw new Error("AUTH_SECRET is not set");
	// FIX #7: Salt dari environment variable
	const salt = process.env.ENCRYPTION_SALT || "ultramaxo-salt";
	return scryptSync(secret, salt, 32);
}

export function encryptData(plainText: string): string {
	const key = getKey();
	const iv = randomBytes(16);
	const cipher = createCipheriv(ALGORITHM, key, iv);
	let encrypted = cipher.update(plainText, "utf8", "hex");
	encrypted += cipher.final("hex");
	const authTag = cipher.getAuthTag().toString("hex");
	return `${iv.toString("hex")}:${authTag}:${encrypted}`;
}

export function decryptData(encryptedText: string): string {
	const key = getKey();
	const [ivHex, authTagHex, encrypted] = encryptedText.split(":");
	if (!ivHex || !authTagHex || !encrypted) {
		throw new Error("Invalid encrypted data format");
	}
	const iv = Buffer.from(ivHex, "hex");
	const authTag = Buffer.from(authTagHex, "hex");
	const decipher = createDecipheriv(ALGORITHM, key, iv);
	decipher.setAuthTag(authTag);
	let decrypted = decipher.update(encrypted, "hex", "utf8");
	decrypted += decipher.final("utf8");
	return decrypted;
}

export function maskKey(key: string): string {
	if (key.length <= 8) return "****";
	return `${key.substring(0, 6)}...${key.substring(key.length - 4)}`;
}
