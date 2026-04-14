/** Valores guardados em site_content.gallery.object_position (CSS object-position). */
export const GALLERY_OBJECT_POSITION_OPTIONS = [
  { value: "center", label: "Centro" },
  { value: "top", label: "Topo" },
  { value: "bottom", label: "Baixo" },
  { value: "left", label: "Esquerda" },
  { value: "right", label: "Direita" },
  { value: "left top", label: "Canto superior esquerdo" },
  { value: "right top", label: "Canto superior direito" },
  { value: "left bottom", label: "Canto inferior esquerdo" },
  { value: "right bottom", label: "Canto inferior direito" },
] as const;

const ALLOWED = new Set(GALLERY_OBJECT_POSITION_OPTIONS.map((o) => o.value));

export function normalizeGalleryObjectPosition(raw: string | undefined | null): string {
  const t = (raw || "").trim().toLowerCase();
  return ALLOWED.has(t) ? t : "center";
}
