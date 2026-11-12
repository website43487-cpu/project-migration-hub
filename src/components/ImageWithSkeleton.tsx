import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { frameClassName?: string };

export function ImageWithSkeleton({ className = "", frameClassName = "", onLoad, onError, style, width, height, ...props }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [readySource, setReadySource] = useState<string>();
  const loaded = readySource === props.src;
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setReadySource(props.src);
  }, [props.src]);
  const w = Number(width);
  const h = Number(height);
  const ratio = w > 0 && h > 0 ? `${w} / ${h}` : undefined;
  return (
    <span
      aria-busy={!loaded}
      style={ratio ? { aspectRatio: ratio } : undefined}
      className={`image-skeleton-frame block overflow-hidden ${ratio ? "has-intrinsic-ratio" : ""} ${className} ${frameClassName}`}
    >
      {!loaded && <span aria-hidden="true" className="image-skeleton absolute inset-0 block" />}
      <img
        ref={ref}
        decoding="async"
        width={width}
        height={height}
        {...props}
        style={style}
        data-ready={loaded}
        onLoad={(e) => { setReadySource(props.src); onLoad?.(e); }}
        onError={onError}
        className={`skeleton-media h-full w-full ${className.includes("object-contain") ? "object-contain" : "object-cover"}`}
      />
    </span>
  );
}
