import { useEffect, useLayoutEffect, useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { CircleHelp } from "lucide-react";
import type { CropRectPct } from "@/lib/gallery-crop";
import {
  defaultCropRectPct,
  moveCropByDisplayDelta,
  objectContainMetrics,
  zoomCropAroundCenter,
} from "@/lib/gallery-crop";

const CROP_HELP_TEXT =
  "Arraste o retângulo para escolher a zona que aparece na miniatura (formato 4:3). Use a roda do rato sobre a imagem para aproximar ou afastar. Isto só altera como a foto encaixa nas miniaturas e cartões; a imagem completa mantém-se ao ver em grande no site.";

type Natural = { nw: number; nh: number };

type AdminThumbCropEditorProps = {
  imageSrc: string;
  crop: CropRectPct;
  onCropChange: (c: CropRectPct | null) => void;
  onNaturalChange?: (n: Natural | null) => void;
  showHelpTrigger?: boolean;
  /** Se true, mostra «Limpar recorte» (passa ao modo foco na galeria). Em criar/substituir omitir. */
  allowClearToFocal?: boolean;
};

export function AdminThumbCropEditor({
  imageSrc,
  crop,
  onCropChange,
  onNaturalChange,
  showHelpTrigger,
  allowClearToFocal,
}: AdminThumbCropEditorProps) {
  const [naturalDims, setNaturalDims] = useState<Natural | null>(null);
  const cropEditorRef = useRef<HTMLDivElement>(null);
  const cropDragRef = useRef<{ lastX: number; lastY: number } | null>(null);
  const [cropEditorBox, setCropEditorBox] = useState({ w: 0, h: 0 });
  const [cropDragging, setCropDragging] = useState(false);

  useEffect(() => {
    onNaturalChange?.(null);
    setNaturalDims(null);
    const im = new Image();
    im.crossOrigin = "anonymous";
    im.onload = () => {
      if (im.naturalWidth > 0 && im.naturalHeight > 0) {
        const n = { nw: im.naturalWidth, nh: im.naturalHeight };
        setNaturalDims(n);
        onNaturalChange?.(n);
      } else {
        onNaturalChange?.(null);
      }
    };
    im.onerror = () => {
      setNaturalDims(null);
      onNaturalChange?.(null);
    };
    im.src = imageSrc;
    return () => {
      im.onload = null;
      im.onerror = null;
    };
  }, [imageSrc, onNaturalChange]);

  useLayoutEffect(() => {
    const el = cropEditorRef.current;
    if (!el) {
      setCropEditorBox({ w: 0, h: 0 });
      return;
    }
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setCropEditorBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setCropEditorBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    return () => ro.disconnect();
  }, [imageSrc, crop]);

  useEffect(() => {
    if (!cropDragging || !naturalDims) return;
    const onMove = (e: PointerEvent) => {
      const el = cropEditorRef.current;
      if (!el || !cropDragRef.current) return;
      const rect = el.getBoundingClientRect();
      const m = objectContainMetrics(rect.width, rect.height, naturalDims.nw, naturalDims.nh);
      const dx = e.clientX - cropDragRef.current.lastX;
      const dy = e.clientY - cropDragRef.current.lastY;
      cropDragRef.current = { lastX: e.clientX, lastY: e.clientY };
      onCropChange(moveCropByDisplayDelta(naturalDims.nw, naturalDims.nh, crop, dx, dy, m.scale));
    };
    const onEnd = () => {
      cropDragRef.current = null;
      setCropDragging(false);
    };
    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onEnd);
    window.addEventListener("pointercancel", onEnd);
    return () => {
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onEnd);
      window.removeEventListener("pointercancel", onEnd);
    };
  }, [cropDragging, crop, naturalDims, onCropChange]);

  return (
    <div className="space-y-2">
      <div className="flex items-center gap-2">
        <Label>Recorte na miniatura (4:3)</Label>
        {showHelpTrigger ? (
          <Popover>
            <PopoverTrigger asChild>
              <button
                type="button"
                className="inline-flex h-7 w-7 shrink-0 items-center justify-center rounded-full border border-border bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground focus:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-label="Ajuda sobre o recorte"
              >
                <CircleHelp className="h-4 w-4" />
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-80 text-sm leading-relaxed" align="start">
              {CROP_HELP_TEXT}
            </PopoverContent>
          </Popover>
        ) : null}
      </div>
      <div
        ref={cropEditorRef}
        role="presentation"
        className="relative w-full touch-none overflow-hidden rounded-lg border border-border/80 bg-muted/30 select-none min-h-[200px]"
        onWheel={(e) => {
          if (!naturalDims) return;
          e.preventDefault();
          const dir = e.deltaY > 0 ? 1.06 : 0.94;
          onCropChange(zoomCropAroundCenter(naturalDims.nw, naturalDims.nh, crop, dir));
        }}
      >
        <img
          src={imageSrc}
          alt=""
          className="pointer-events-none block max-h-[240px] w-full object-contain mx-auto"
          draggable={false}
        />
        {naturalDims &&
          (() => {
            const { ox, oy, scale } = objectContainMetrics(
              cropEditorBox.w,
              cropEditorBox.h,
              naturalDims.nw,
              naturalDims.nh,
            );
            const box = cropEditorBox;
            if (!box.w || !box.h) return null;
            return (
              <div
                role="presentation"
                className="absolute z-[2] cursor-move rounded-sm border-2 border-primary bg-primary/10 shadow-[0_0_0_1px_rgba(0,0,0,0.35)] touch-none"
                style={{
                  left: ox + (crop.x / 100) * naturalDims.nw * scale,
                  top: oy + (crop.y / 100) * naturalDims.nh * scale,
                  width: (crop.w / 100) * naturalDims.nw * scale,
                  height: (crop.h / 100) * naturalDims.nh * scale,
                }}
                onPointerDown={(e) => {
                  if (e.button !== 0) return;
                  e.preventDefault();
                  cropDragRef.current = { lastX: e.clientX, lastY: e.clientY };
                  setCropDragging(true);
                }}
              />
            );
          })()}
      </div>
      <p className="text-[11px] text-muted-foreground leading-relaxed">
        Arraste o retângulo. Use a roda do rato sobre a imagem para aproximar ou afastar.
      </p>
      <div className="flex flex-wrap gap-2">
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!naturalDims}
          onClick={() =>
            naturalDims && onCropChange(zoomCropAroundCenter(naturalDims.nw, naturalDims.nh, crop, 0.92))
          }
        >
          Mais zoom
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!naturalDims}
          onClick={() =>
            naturalDims && onCropChange(zoomCropAroundCenter(naturalDims.nw, naturalDims.nh, crop, 1.08))
          }
        >
          Menos zoom
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          disabled={!naturalDims}
          onClick={() => naturalDims && onCropChange(defaultCropRectPct(naturalDims.nw, naturalDims.nh))}
        >
          Repor máximo
        </Button>
        {allowClearToFocal ? (
          <Button type="button" variant="outline" size="sm" onClick={() => onCropChange(null)}>
            Limpar recorte
          </Button>
        ) : null}
      </div>
    </div>
  );
}
