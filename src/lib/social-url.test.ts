import { describe, expect, it } from "vitest";
import { safeHttpUrl } from "./social-url";

describe("safeHttpUrl", () => {
  it("aceita https", () => {
    expect(safeHttpUrl("https://instagram.com/x")).toBe("https://instagram.com/x");
  });
  it("prefixa domínio sem esquema", () => {
    expect(safeHttpUrl("instagram.com/foo")).toBe("https://instagram.com/foo");
  });
  it("devolve null para vazio", () => {
    expect(safeHttpUrl("")).toBeNull();
    expect(safeHttpUrl("  ")).toBeNull();
  });
});
