import { describe, expect, it } from "vitest";
import { safeInternalPath } from "@/lib/safe-internal-path";

describe("safeInternalPath", () => {
  it("allows relative app paths and query strings", () => {
    expect(safeInternalPath("/me")).toBe("/me");
    expect(safeInternalPath("/events/abc?register=1")).toBe(
      "/events/abc?register=1"
    );
  });

  it("rejects open redirects and the login page itself", () => {
    expect(safeInternalPath("https://evil.example")).toBe("/");
    expect(safeInternalPath("//evil.example")).toBe("/");
    expect(safeInternalPath("/open-in-telegram?next=/me")).toBe("/");
  });
});
