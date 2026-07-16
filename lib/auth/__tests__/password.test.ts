import { describe, it, expect } from "vitest";
import { hashPassword, verifyPassword } from "../password";

describe("lib/auth/password", () => {
  it("hashPassword returns a string in salt:derivedKey hex format", async () => {
    const hash = await hashPassword("senhaSegura123");

    expect(hash).toContain(":");
    const [salt, key] = hash.split(":");
    // salt = 16 bytes = 32 hex chars
    expect(salt).toHaveLength(32);
    // key = 64 bytes = 128 hex chars
    expect(key).toHaveLength(128);
    // both should be valid hex
    expect(salt).toMatch(/^[0-9a-f]+$/);
    expect(key).toMatch(/^[0-9a-f]+$/);
  });

  it("hashPassword never returns the plaintext password", async () => {
    const password = "minhasenha123";
    const hash = await hashPassword(password);

    expect(hash).not.toBe(password);
    expect(hash).not.toContain(password);
  });

  it("hashPassword produces unique hashes for the same password (random salt)", async () => {
    const password = "mesmasenha12";
    const hash1 = await hashPassword(password);
    const hash2 = await hashPassword(password);

    expect(hash1).not.toBe(hash2);
  });

  it("verifyPassword returns true for correct password", async () => {
    const password = "senhaCorreta1";
    const hash = await hashPassword(password);

    const result = await verifyPassword(password, hash);
    expect(result).toBe(true);
  });

  it("verifyPassword returns false for incorrect password", async () => {
    const password = "senhaCorreta1";
    const hash = await hashPassword(password);

    const result = await verifyPassword("senhaErrada1", hash);
    expect(result).toBe(false);
  });

  it("verifyPassword returns false for malformed hash (no colon)", async () => {
    const result = await verifyPassword("qualquersenha", "invalidhash");
    expect(result).toBe(false);
  });

  it("verifyPassword returns false for empty hash parts", async () => {
    const result = await verifyPassword("qualquersenha", ":");
    expect(result).toBe(false);
  });
});
