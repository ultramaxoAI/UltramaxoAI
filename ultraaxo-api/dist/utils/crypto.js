"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.encryptToken = encryptToken;
exports.decryptToken = decryptToken;
const crypto_1 = __importDefault(require("crypto"));
const ALGORITHM = 'aes-256-gcm';
const IV_LENGTH = 12; // 96-bit IV
// Retrieve and validate encryption key (must be 32 bytes represented as 64 hex characters)
function getEncryptionKey() {
    const hexKey = process.env.DB_ENCRYPTION_KEY;
    if (!hexKey) {
        throw new Error('DB_ENCRYPTION_KEY environment variable is not defined.');
    }
    if (hexKey.length !== 64) {
        // If not 64 hex characters, hash it to ensure we get a valid 32-byte key
        return crypto_1.default.createHash('sha256').update(hexKey).digest();
    }
    return Buffer.from(hexKey, 'hex');
}
/**
 * Encrypts a string using AES-256-GCM
 * @param text The plain text to encrypt
 * @returns The encrypted string formatted as "iv:ciphertext:tag" in hex
 */
function encryptToken(text) {
    if (!text)
        return '';
    const key = getEncryptionKey();
    const iv = crypto_1.default.randomBytes(IV_LENGTH);
    const cipher = crypto_1.default.createCipheriv(ALGORITHM, key, iv);
    let encrypted = cipher.update(text, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const tag = cipher.getAuthTag();
    // Format: iv:ciphertext:tag
    return `${iv.toString('hex')}:${encrypted}:${tag.toString('hex')}`;
}
/**
 * Decrypts an AES-256-GCM encrypted string
 * @param encryptedData The encrypted string formatted as "iv:ciphertext:tag"
 * @returns The decrypted plain text
 */
function decryptToken(encryptedData) {
    if (!encryptedData)
        return '';
    const parts = encryptedData.split(':');
    if (parts.length !== 3) {
        throw new Error('Invalid encrypted token format. Expected "iv:ciphertext:tag".');
    }
    const [ivHex, encryptedHex, tagHex] = parts;
    const key = getEncryptionKey();
    const iv = Buffer.from(ivHex, 'hex');
    const tag = Buffer.from(tagHex, 'hex');
    const encrypted = Buffer.from(encryptedHex, 'hex');
    const decipher = crypto_1.default.createDecipheriv(ALGORITHM, key, iv);
    decipher.setAuthTag(tag);
    let decrypted = decipher.update(encrypted);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString('utf8');
}
