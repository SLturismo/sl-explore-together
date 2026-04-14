import { describe, expect, it } from "vitest";
import { cropMatchesAspect, defaultCropRectPct, thumbImgLayoutForCrop } from "./gallery-crop";

describe("defaultCropRectPct", () => {
  it("inscreve 4:3 centrado num quadrado", () => {
    const c = defaultCropRectPct(1000, 1000);
    expect(c).not.toBeNull();
    if (!c) return;
    expect(cropMatchesAspect(1000, 1000, c, 0.02)).toBe(true);
    expect(c.x + c.w).toBeLessThanOrEqual(100);
    expect(c.y + c.h).toBeLessThanOrEqual(100);
  });
});

describe("thumbImgLayoutForCrop", () => {
  it("preenche a caixa com o recorte", () => {
    const crop = { x: 0, y: 0, w: 100, h: 75 };
    const L = thumbImgLayoutForCrop(400, 300, 1000, 750, crop);
    expect(L).not.toBeNull();
    if (!L) return;
    expect(L.width).toBeGreaterThan(400);
    expect(L.height).toBeGreaterThan(300);
  });
});
