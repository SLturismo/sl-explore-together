import { describe, expect, it } from "vitest";
import { readCachedLogoUrl, writeCachedLogoUrl } from "./logo-url-cache";

describe("logo-url-cache", () => {
  it("lê e grava URL https válida", () => {
    writeCachedLogoUrl("https://example.com/x/logo.png");
    expect(readCachedLogoUrl()).toBe("https://example.com/x/logo.png");
    writeCachedLogoUrl(null);
    expect(readCachedLogoUrl()).toBeNull();
  });
});
