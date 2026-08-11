import crypto from "node:crypto";
import { describe, expect, it } from "vitest";
import { validateTelegramInitData } from "@/modules/auth/telegram";

function signedInitData(botToken: string, authDate = Math.floor(Date.now() / 1000)) {
  const params = new URLSearchParams({
    auth_date: `${authDate}`,
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    user: JSON.stringify({ id: 42, first_name: "Ham", username: "walker" })
  });
  const dataCheckString = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}=${value}`)
    .join("\n");
  const secretKey = crypto.createHmac("sha256", "WebAppData").update(botToken).digest();
  const hash = crypto.createHmac("sha256", secretKey).update(dataCheckString).digest("hex");
  params.set("hash", hash);
  return params.toString();
}

describe("validateTelegramInitData", () => {
  it("accepts correctly signed Telegram init data", () => {
    const user = validateTelegramInitData(signedInitData("secret-token"), "secret-token");
    expect(user.id).toBe(42);
    expect(user.username).toBe("walker");
  });

  it("rejects tampered init data", () => {
    const data = signedInitData("secret-token").replace("walker", "intruder");
    expect(() => validateTelegramInitData(data, "secret-token")).toThrow();
  });

  it("rejects malformed hashes as unauthorized errors", () => {
    const params = new URLSearchParams(signedInitData("secret-token"));
    params.set("hash", "z".repeat(64));

    expect(() => validateTelegramInitData(params.toString(), "secret-token")).toThrow(
      "Invalid Telegram signature"
    );
  });

  it("rejects auth dates from the future", () => {
    const futureAuthDate = Math.floor(Date.now() / 1000) + 60;
    const data = signedInitData("secret-token", futureAuthDate);

    expect(() => validateTelegramInitData(data, "secret-token")).toThrow(
      "Expired Telegram auth data"
    );
  });
});
