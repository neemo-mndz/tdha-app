import { randomBytes, scrypt, timingSafeEqual } from "crypto";
import { promisify } from "util";

const scryptAsync = promisify(scrypt);

const SALT_LENGTH = 16; // 16 bytes = 32 hex chars
const KEY_LENGTH = 64; // 64 bytes = 128 hex chars

/**
 * Gera um hash seguro da senha usando scrypt com salt aleatório.
 * Formato de saída: `salt:derivedKey` (ambos em hex).
 */
export async function hashPassword(plaintext: string): Promise<string> {
  const salt = randomBytes(SALT_LENGTH);
  const derivedKey = (await scryptAsync(plaintext, salt, KEY_LENGTH)) as Buffer;
  return `${salt.toString("hex")}:${derivedKey.toString("hex")}`;
}

/**
 * Verifica se a senha fornecida corresponde ao hash armazenado.
 * Usa comparação em tempo constante para prevenir timing attacks.
 */
export async function verifyPassword(
  plaintext: string,
  hash: string
): Promise<boolean> {
  const [saltHex, keyHex] = hash.split(":");

  if (!saltHex || !keyHex) {
    return false;
  }

  const salt = Buffer.from(saltHex, "hex");
  const storedKey = Buffer.from(keyHex, "hex");
  const derivedKey = (await scryptAsync(plaintext, salt, KEY_LENGTH)) as Buffer;

  return timingSafeEqual(storedKey, derivedKey);
}
