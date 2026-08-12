import crypto from "node:crypto";
import { createLocalJWKSet, exportJWK, generateKeyPair, SignJWT } from "jose";
import { describe, expect, it } from "vitest";
import { AppError } from "@/shared/errors";
import {
  TELEGRAM_OIDC_AUTH_URL,
  TELEGRAM_OIDC_ISSUER,
  buildTelegramOidcAuthUrl,
  createPkcePair,
  isTelegramOidcSessionPayload,
  mapOidcClaimsToTelegramUser,
  serializeTelegramOidcSession,
  telegramOidcRedirectUri,
  validateTelegramOidcSession,
  verifyTelegramOidcIdToken
} from "@/modules/auth/telegram-oidc";

const SESSION_SECRET = "oidc-test-secret";

describe("createPkcePair", () => {
  it("creates an S256 challenge from the verifier", () => {
    const { verifier, challenge } = createPkcePair();
    expect(verifier).toMatch(/^[A-Za-z0-9_-]+$/);
    expect(challenge).toBe(
      crypto.createHash("sha256").update(verifier).digest("base64url")
    );
  });
});

describe("buildTelegramOidcAuthUrl", () => {
  it("includes authorization code and PKCE params", () => {
    const url = new URL(
      buildTelegramOidcAuthUrl({
        clientId: "8619611362",
        redirectUri: "https://hammasir.mbking.info/api/auth/telegram-oidc/callback",
        state: "state-1",
        challenge: "challenge-1",
        nonce: "nonce-1"
      })
    );
    expect(url.origin + url.pathname).toBe(TELEGRAM_OIDC_AUTH_URL);
    expect(url.searchParams.get("client_id")).toBe("8619611362");
    expect(url.searchParams.get("response_type")).toBe("code");
    expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    expect(url.searchParams.get("scope")).toBe("openid profile telegram:bot_access");
    expect(url.searchParams.get("code_challenge")).toBe("challenge-1");
    expect(url.searchParams.get("nonce")).toBe("nonce-1");
  });
});

describe("telegramOidcRedirectUri", () => {
  it("appends the callback path", () => {
    expect(telegramOidcRedirectUri("https://hammasir.mbking.info/")).toBe(
      "https://hammasir.mbking.info/api/auth/telegram-oidc/callback"
    );
  });
});

describe("mapOidcClaimsToTelegramUser", () => {
  it("maps id, name, username and picture", () => {
    const user = mapOidcClaimsToTelegramUser({
      sub: "1234123412341234123",
      id: 42,
      name: "Ham Walker",
      preferred_username: "walker",
      picture: "https://t.me/i/userpic/42.jpg"
    });
    expect(user).toMatchObject({
      id: 42,
      first_name: "Ham",
      last_name: "Walker",
      username: "walker",
      photo_url: "https://t.me/i/userpic/42.jpg"
    });
  });

  it("prefers given_name and family_name when present", () => {
    const user = mapOidcClaimsToTelegramUser({
      sub: "7",
      id: 7,
      name: "Ali Reza",
      given_name: "Ali",
      family_name: "Reza"
    });
    expect(user.first_name).toBe("Ali");
    expect(user.last_name).toBe("Reza");
  });

  it("rejects a missing telegram id", () => {
    expect(() =>
      mapOidcClaimsToTelegramUser({ sub: "1234123412341234123", name: "Ham" })
    ).toThrow(AppError);
  });
});

describe("telegram oidc session", () => {
  const user = {
    id: 42,
    first_name: "Ham",
    last_name: "Walker",
    username: "walker"
  };

  it("round-trips a signed session", () => {
    const raw = serializeTelegramOidcSession(user, SESSION_SECRET);
    expect(isTelegramOidcSessionPayload(raw)).toBe(true);
    expect(validateTelegramOidcSession(raw, SESSION_SECRET)).toMatchObject(user);
  });

  it("rejects a tampered payload", () => {
    const raw = serializeTelegramOidcSession(user, SESSION_SECRET);
    expect(() =>
      validateTelegramOidcSession(`${raw}x`, SESSION_SECRET)
    ).toThrow(AppError);
  });

  it("rejects an expired session", () => {
    const body = Buffer.from(
      JSON.stringify({ ...user, exp: Math.floor(Date.now() / 1000) - 10 }),
      "utf8"
    ).toString("base64url");
    const sig = crypto
      .createHmac("sha256", SESSION_SECRET)
      .update(body)
      .digest("base64url");
    expect(() =>
      validateTelegramOidcSession(`oidc.v1.${body}.${sig}`, SESSION_SECRET)
    ).toThrow(AppError);
  });
});

describe("verifyTelegramOidcIdToken", () => {
  it("accepts a locally signed RS256 id_token", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    jwk.kid = "test-key";
    const idToken = await new SignJWT({
      sub: "1234123412341234123",
      id: 42,
      name: "Ham Walker",
      preferred_username: "walker",
      nonce: "nonce-1"
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(TELEGRAM_OIDC_ISSUER)
      .setAudience("8619611362")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

    const user = await verifyTelegramOidcIdToken(
      idToken,
      "8619611362",
      "nonce-1",
      createLocalJWKSet({ keys: [jwk] })
    );
    expect(user).toMatchObject({
      id: 42,
      first_name: "Ham",
      last_name: "Walker",
      username: "walker"
    });
  });

  it("rejects a nonce mismatch when the token includes nonce", async () => {
    const { publicKey, privateKey } = await generateKeyPair("RS256");
    const jwk = await exportJWK(publicKey);
    jwk.kid = "test-key";
    const idToken = await new SignJWT({
      sub: "1234123412341234123",
      id: 42,
      name: "Ham",
      nonce: "other-nonce"
    })
      .setProtectedHeader({ alg: "RS256", kid: "test-key" })
      .setIssuer(TELEGRAM_OIDC_ISSUER)
      .setAudience("8619611362")
      .setIssuedAt()
      .setExpirationTime("1h")
      .sign(privateKey);

    await expect(
      verifyTelegramOidcIdToken(
        idToken,
        "8619611362",
        "nonce-1",
        createLocalJWKSet({ keys: [jwk] })
      )
    ).rejects.toBeInstanceOf(AppError);
  });
});
