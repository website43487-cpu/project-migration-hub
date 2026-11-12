import { useEffect, useRef, useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { frameClassName?: string };

export function ImageWithSkeleton({ className = "", frameClassName = "", onLoad, onError, style, ...props }: Props) {
  const ref = useRef<HTMLImageElement>(null);
  const [readySource, setReadySource] = useState<string>();
  const loaded = readySource === props.src;
  useEffect(() => {
    if (ref.current?.complete && ref.current.naturalWidth > 0) setReadySource(props.src);
  }, [props.src]);
  return (
    <span aria-busy={!loaded} className={`image-skeleton-frame block overflow-hidden ${className} ${frameClassName}`}>
      {!loaded && <span aria-hidden="true" className="image-skeleton absolute inset-0 block" />}
      <img
        ref={ref}
        decoding="async"
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
