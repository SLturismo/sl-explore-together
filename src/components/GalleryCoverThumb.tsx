import { useCallback, useLayoutEffect, useRef, useState, type CSSProperties } from "react";
import { thumbImgLayoutForCrop, type CropRectPct } from "@/lib/gallery-crop";

type Props = {
  src: string;
  alt: string;
  crop: CropRectPct | null;
  /** Ex.: `h-64 w-full group-hover:scale-105 transition-transform duration-500` */
  className: string;
  /** Classes de encaixe quando não há recorte (ex.: `object-cover`). */
  objectCoverClass: string;
  focalStyle?: CSSProperties;
  imageFit: "cover" | "contain";
  width?: number;
  height?: number;
};

export function GalleryCoverThumb({
  src,
  alt,
  crop,
  className,
  objectCoverClass,
  focalStyle,
  imageFit,
  width = 800,
  height = 600,
}: Props) {
  const wrapRef = useRef<HTMLDivElement>(null);
  const [box, setBox] = useState({ w: 0, h: 0 });
  const [natural, setNatural] = useState<{ nw: number; nh: number } | null>(null);

  useLayoutEffect(() => {
    const el = wrapRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => {
      const r = el.getBoundingClientRect();
      setBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    });
    ro.observe(el);
    const r = el.getBoundingClientRect();
    setBox({ w: Math.max(1, r.width), h: Math.max(1, r.height) });
    return () => ro.disconnect();
  }, []);

  const onLoad = useCallback((e: React.SyntheticEvent<HTMLImageElement>) => {
    const im = e.currentTarget;
    if (im.naturalWidth > 0 && im.naturalHeight > 0) {
      setNatural({ nw: im.naturalWidth, nh: im.naturalHeight });
    }
  }, []);

  if (imageFit !== "cover" || !crop) {
    return (
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={crop ? onLoad : undefined}
        className={`${className} ${objectCoverClass}`}
        style={focalStyle}
      />
    );
  }

  const layout =
    natural && box.w && box.h ? thumbImgLayoutForCrop(box.w, box.h, natural.nw, natural.nh, crop) : null;

  return (
    <div ref={wrapRef} className={`relative overflow-hidden ${className}`}>
      <img
        src={src}
        alt={alt}
        width={width}
        height={height}
        loading="lazy"
        onLoad={onLoad}
        draggable={false}
        className={
          layout
            ? "pointer-events-none absolute max-w-none select-none"
            : `absolute inset-0 h-full w-full ${objectCoverClass}`
        }
        style={layout ?? focalStyle}
      />
    </div>
  );
}
