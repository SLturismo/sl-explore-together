/** Proporção fixa do editor de recorte (opção A): largura : altura */
export const GALLERY_THUMB_CROP_ASPECT = 4 / 3;

export type CropRectPct = {
  x: number;
  y: number;
  w: number;
  h: number;
};

function clampPct(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

export function parseCropFromRow(row: {
  crop_x?: unknown;
  crop_y?: unknown;
  crop_w?: unknown;
  crop_h?: unknown;
}): CropRectPct | null {
  const x = typeof row.crop_x === "number" ? row.crop_x : Number(row.crop_x);
  const y = typeof row.crop_y === "number" ? row.crop_y : Number(row.crop_y);
  const w = typeof row.crop_w === "number" ? row.crop_w : Number(row.crop_w);
  const h = typeof row.crop_h === "number" ? row.crop_h : Number(row.crop_h);
  if (![x, y, w, h].every((v) => Number.isFinite(v))) return null;
  if (w < 5 || h < 5) return null;
  if (x < 0 || y < 0 || x > 100 || y > 100) return null;
  if (x + w > 100.5 || y + h > 100.5) return null;
  return { x: clampPct(x), y: clampPct(y), w: clampPct(w), h: clampPct(h) };
}

/** Maior retângulo 4:3 inscrito na imagem, centrado (valores em % por eixo). */
export function defaultCropRectPct(nw: number, nh: number): CropRectPct | null {
  if (!nw || !nh) return null;
  const t = GALLERY_THUMB_CROP_ASPECT;
  const ar = nw / nh;
  let wPx: number;
  let hPx: number;
  let x0: number;
  let y0: number;
  if (ar >= t) {
    hPx = nh;
    wPx = nh * t;
    x0 = (nw - wPx) / 2;
    y0 = 0;
  } else {
    wPx = nw;
    hPx = nw / t;
    x0 = 0;
    y0 = (nh - hPx) / 2;
  }
  return {
    x: clampPct((100 * x0) / nw),
    y: clampPct((100 * y0) / nh),
    w: clampPct((100 * wPx) / nw),
    h: clampPct((100 * hPx) / nh),
  };
}

/** Verifica se o retângulo em % reproduz ~4:3 em pixels (tolera arredondamentos). */
export function cropMatchesAspect(nw: number, nh: number, c: CropRectPct, tol = 0.04): boolean {
  const wPx = (c.w / 100) * nw;
  const hPx = (c.h / 100) * nh;
  if (!hPx) return false;
  const r = wPx / hPx;
  return Math.abs(r - GALLERY_THUMB_CROP_ASPECT) <= tol;
}

export function clampCropPan(nw: number, nh: number, c: CropRectPct): CropRectPct {
  let { x, y, w, h } = c;
  const wPx = (w / 100) * nw;
  const hPx = (h / 100) * nh;
  if (!cropMatchesAspect(nw, nh, c, 0.08)) {
    const d = defaultCropRectPct(nw, nh);
    if (d) return d;
  }
  x = clampPct(x);
  y = clampPct(y);
  w = clampPct(w);
  h = clampPct(h);
  if (x + w > 100) x = clampPct(100 - w);
  if (y + h > 100) y = clampPct(100 - h);
  return { x, y, w, h };
}

/** factor &lt; 1 aproxima (recorte menor em px); factor &gt; 1 afasta. Mantém proporção do recorte. */
export function zoomCropAroundCenter(nw: number, nh: number, c: CropRectPct, factor: number): CropRectPct {
  const f = Math.max(0.9, Math.min(1.1, factor));
  const cx = (c.x / 100) * nw + (c.w / 200) * nw;
  const cy = (c.y / 100) * nh + (c.h / 200) * nh;
  let wPx = (c.w / 100) * nw * f;
  let hPx = (c.h / 100) * nh * f;
  wPx = Math.max(nw * 0.1, Math.min(nw, wPx));
  hPx = Math.max(nh * 0.1, Math.min(nh, hPx));
  let x0 = cx - wPx / 2;
  let y0 = cy - hPx / 2;
  x0 = Math.max(0, Math.min(nw - wPx, x0));
  y0 = Math.max(0, Math.min(nh - hPx, y0));
  return clampCropPan(nw, nh, {
    x: clampPct((100 * x0) / nw),
    y: clampPct((100 * y0) / nh),
    w: clampPct((100 * wPx) / nw),
    h: clampPct((100 * hPx) / nh),
  });
}

export type ThumbImgLayout = {
  position: "absolute";
  left: number;
  top: number;
  width: number;
  height: number;
};

/** Posiciona a imagem inteira dentro da caixa para que o retângulo de recorte (em %) cubra a caixa (overflow hidden). */
export function thumbImgLayoutForCrop(
  boxW: number,
  boxH: number,
  nw: number,
  nh: number,
  crop: CropRectPct,
): ThumbImgLayout | null {
  if (!boxW || !boxH || !nw || !nh) return null;
  const cx = crop.x / 100;
  const cy = crop.y / 100;
  const cw = crop.w / 100;
  const ch = crop.h / 100;
  const cropWpx = cw * nw;
  const cropHpx = ch * nh;
  if (!cropWpx || !cropHpx) return null;
  const s = Math.max(boxW / cropWpx, boxH / cropHpx);
  const width = nw * s;
  const height = nh * s;
  const left = boxW / 2 - (cx + cw / 2) * nw * s;
  const top = boxH / 2 - (cy + ch / 2) * nh * s;
  return { position: "absolute" as const, left, top, width, height };
}

/** Desloca o recorte em coordenadas de ecrã (object-contain), mantendo tamanho. */
export function moveCropByDisplayDelta(
  nw: number,
  nh: number,
  c: CropRectPct,
  dScreenX: number,
  dScreenY: number,
  displayScale: number,
): CropRectPct {
  if (!displayScale) return clampCropPan(nw, nh, c);
  const dxPct = (dScreenX / displayScale / nw) * 100;
  const dyPct = (dScreenY / displayScale / nh) * 100;
  return clampCropPan(nw, nh, { ...c, x: c.x + dxPct, y: c.y + dyPct });
}

export function objectContainMetrics(containerW: number, containerH: number, nw: number, nh: number) {
  const scale = Math.min(containerW / nw, containerH / nh);
  const rw = nw * scale;
  const rh = nh * scale;
  const ox = (containerW - rw) / 2;
  const oy = (containerH - rh) / 2;
  return { scale, rw, rh, ox, oy };
}
