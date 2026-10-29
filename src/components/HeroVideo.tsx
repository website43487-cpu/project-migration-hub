import { useEffect, useRef } from "react";

type Props = { src: string; label: string; poster?: string; className?: string };

/**
 * Autoplaying background video.
 * iOS/Android only allow silent inline autoplay, and React does not always emit
 * the `muted` attribute into the SSR markup — so we force it on the element and
 * retry playback on load and on the first user gesture.
 */
export function HeroVideo({ src, label, poster, className = "" }: Props) {
  const ref = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    el.muted = true;
    el.defaultMuted = true;
    el.volume = 0;
    el.setAttribute("muted", "");
    el.setAttribute("playsinline", "");
    el.setAttribute("webkit-playsinline", "true");

    const tryPlay = () => {
      if (!el.paused) return;
      el.muted = true;
      void el.play().catch(() => {});
    };

    tryPlay();
    // Some mobile browsers ignore the first attempt while the tab is still
    // settling, so retry for a few seconds and whenever the element scrolls in.
    const interval = window.setInterval(() => {
      if (el.paused) tryPlay();
      else window.clearInterval(interval);
    }, 600);
    window.setTimeout(() => window.clearInterval(interval), 8000);

    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) if (entry.isIntersecting) tryPlay();
      },
      { threshold: 0.05 },
    );
    io.observe(el);

    el.addEventListener("loadeddata", tryPlay);
    el.addEventListener("canplay", tryPlay);
    el.addEventListener("loadedmetadata", tryPlay);
    el.addEventListener("pause", tryPlay);
    el.addEventListener("stalled", tryPlay);
    const handleEnded = () => {
      el.currentTime = 0;
      tryPlay();
    };
    el.addEventListener("ended", handleEnded);
    document.addEventListener("touchstart", tryPlay, { passive: true });
    document.addEventListener("click", tryPlay);
    document.addEventListener("scroll", tryPlay, { passive: true, once: true });
    document.addEventListener("visibilitychange", tryPlay);

    return () => {
      window.clearInterval(interval);
      io.disconnect();
      el.removeEventListener("loadeddata", tryPlay);
      el.removeEventListener("canplay", tryPlay);
      el.removeEventListener("loadedmetadata", tryPlay);
      el.removeEventListener("pause", tryPlay);
      el.removeEventListener("stalled", tryPlay);
      el.removeEventListener("ended", handleEnded);
      document.removeEventListener("touchstart", tryPlay);
      document.removeEventListener("click", tryPlay);
      document.removeEventListener("scroll", tryPlay);
      document.removeEventListener("visibilitychange", tryPlay);
    };
  }, [src]);

  return (
    <video
      ref={ref}
      src={src}
      poster={poster}
      autoPlay
      muted
      loop
      playsInline
      preload="auto"
      controls={false}
      disablePictureInPicture
      disableRemotePlayback
      aria-label={label}
      className={className}
    />
  );
}
