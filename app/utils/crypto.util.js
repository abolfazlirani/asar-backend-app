// utils/crypto.util.js
import crypto from "crypto";

const algorithm = "aes-256-cbc";
const secretKey = process.env.ENCRYPTION_SECRET_KEY; // 32 bytes
const ivLength = 16;

export function encryptPhoneNumber(phone) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    let encrypted = cipher.update(phone, "utf8", "hex");
    encrypted += cipher.final("hex");
    return iv.toString("hex") + ":" + encrypted;
}

export function decryptPhoneNumber(encrypted) {
    const [ivHex, content] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    let decrypted = decipher.update(content, "hex", "utf8");
    decrypted += decipher.final("utf8");
    return decrypted;
}
export function encryptText(text) {
    if (!text || typeof text !== "string") return null;

    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);

    let encrypted = cipher.update(text, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
}

// 🔓 رمزگشایی عمومی
export function decryptText(encrypted) {
    if (!encrypted || typeof encrypted !== "string") return null;

    const [ivHex, content] = encrypted.split(":");
    const iv = Buffer.from(ivHex, "hex");

    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);

    let decrypted = decipher.update(content, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
}
export function hashPhoneNumber(phone) {
    return crypto.createHash("sha256").update(phone).digest("hex");
}
export function hashText(text) {
    return crypto.createHash("sha256").update(text).digest("hex");
}
export function encryptBuffer(buffer) {
    const iv = crypto.randomBytes(ivLength);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(secretKey), iv);
    const encrypted = Buffer.concat([cipher.update(buffer), cipher.final()]);
    return {
        iv: iv.toString("hex"),
        data: encrypted,
    };
}

export function decryptBuffer(encryptedBuffer, ivHex) {
    const iv = Buffer.from(ivHex, "hex");
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(secretKey), iv);
    const decrypted = Buffer.concat([
        decipher.update(encryptedBuffer),
        decipher.final(),
    ]);
    return decrypted;
}