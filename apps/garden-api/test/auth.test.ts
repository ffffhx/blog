import { describe, expect, it } from "vitest";
import { appendTokenToUrl, sanitizeReturnTo } from "../src/auth.js";
import { resolveAuthSecret } from "../src/config.js";

describe("login return destinations", () => {
  it.each([
    "https://api.garden.example.attacker.invalid/collect",
    "https://attacker.invalid/api.garden.example",
    "//attacker.invalid", "/\\attacker.invalid", "/\n/attacker.invalid",
    "javascript:alert(1)", "https://user:pass@api.garden.example/",
  ])("rejects untrusted destination %s before attaching credentials", (target) => {
    expect(sanitizeReturnTo(target, "api.garden.example")).toBe("/");
    expect(appendTokenToUrl(sanitizeReturnTo(target, "api.garden.example"), "test")).toBe("/?garden_token=test");
  });
  it.each(["/private-post/?slug=demo#title", "https://api.garden.example/private", "https://ffffhx.github.io/garden-lab/"])("preserves trusted destination %s", (target) => {
    expect(sanitizeReturnTo(target, "api.garden.example")).toBe(target);
  });
  it("matches ports exactly", () => {
    expect(sanitizeReturnTo("http://localhost:3001/", "localhost:3002")).toBe("/");
  });
});

describe("production auth configuration", () => {
  it.each([undefined, "", "   ", "short", "dev-only-garden-auth-secret-change-in-prod-32chars"])("fails closed for invalid secret %s", (secret) => {
    expect(() => resolveAuthSecret({ NODE_ENV: "production", GARDEN_AUTH_SECRET: secret })).toThrow("GARDEN_AUTH_SECRET");
  });
  it("accepts a configured secret and allows local development", () => {
    const secret = "a-private-test-secret-with-at-least-32-characters";
    expect(resolveAuthSecret({ NODE_ENV: "production", GARDEN_AUTH_SECRET: secret })).toBe(secret);
    expect(resolveAuthSecret({ NODE_ENV: "development" })).toContain("dev-only-");
  });
});
