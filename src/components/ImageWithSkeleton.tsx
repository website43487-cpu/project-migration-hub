import { useState, type ImgHTMLAttributes } from "react";

type Props = ImgHTMLAttributes<HTMLImageElement> & { frameClassName?: string };

export function ImageWithSkeleton({ className = "", frameClassName = "", onLoad, onError, ...props }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [failed, setFailed] = useState(false);
  return (
    <span className={`image-skeleton-frame relative block overflow-hidden ${frameClassName}`}>
      {!loaded && !failed && <span aria-hidden="true" className="image-skeleton absolute inset-0 block" />}
      <img
        {...props}
        onLoad={(e) => { setLoaded(true); onLoad?.(e); }}
        onError={(e) => { setFailed(true); onError?.(e); }}
        className={`relative z-[1] ${className} ${loaded ? "opacity-100" : "opacity-0"} transition-opacity duration-300`}
      />
    </span>
  );
}
