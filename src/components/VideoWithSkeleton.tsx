import { useState, type VideoHTMLAttributes } from "react";

export function VideoWithSkeleton({ className = "", onLoadedData, onPlaying, poster: _poster, ...props }: VideoHTMLAttributes<HTMLVideoElement>) {
  const [readySource, setReadySource] = useState<string>();
  const ready = readySource === props.src;
  return (
    <span aria-busy={!ready} className={`image-skeleton-frame block overflow-hidden ${className}`}>
      {!ready && <span aria-hidden="true" className="image-skeleton absolute inset-0 block" />}
      <video {...props} data-ready={ready} className="skeleton-media h-full w-full object-cover"
        onLoadedData={(event) => { setReadySource(props.src); onLoadedData?.(event); }}
        onPlaying={(event) => { setReadySource(props.src); onPlaying?.(event); }} />
    </span>
  );
}