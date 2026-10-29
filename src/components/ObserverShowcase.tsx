import { useEffect, useRef } from "react";
import { loadGsap, prefersReducedMotion, useShowcase } from "@/lib/motion";
import archiveDark from "@/assets/archive-dark.jpg";

/**
 * Full-screen photo plates after "Got an idea?". One pinned stage; each scroll step slides the next
 * plate up over the previous one and snaps exactly one plate per swipe, in both directions.
 * Letters re-animate every time a plate becomes active (forward or backward).
 */
export function ObserverShowcase() {
  const s = useShowcase();
  const slides = (s.slides ?? []).filter((x) => x.published !== false);
  const root = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!s.enabled || !slides.length || !root.current || prefersReducedMotion()) return;
    let alive = true;
    let kill = () => {};
    let cleanup = () => {};
    loadGsap().then(({ gsap, Observer }) => {
      const el = root.current;
      if (!alive || !el) return;
      const ctx = gsap.context(() => {
        const plates = gsap.utils.toArray<HTMLElement>(el.querySelectorAll("[data-plate]"));
        const n = plates.length;
        const chars = plates.map((p) => p.querySelectorAll("[data-ch]"));
        let active = -1;
        const show = (i: number, dir = 1, animateOut = false) => {
          if (i === active) return;
          const prev = active;
          active = i;
          chars.forEach((c, k) => {
            gsap.killTweensOf(c);
            if (k === i) gsap.fromTo(c, { autoAlpha: 0, yPercent: 150 * dir }, { autoAlpha: 1, yPercent: 0, duration: 1, delay: animateOut ? 0.45 : 0, ease: "power3.out", stagger: { each: 0.02, from: "random" } });
            else if (k === prev && animateOut) gsap.to(c, { autoAlpha: 0, yPercent: -120 * dir, duration: 0.55, ease: "power2.in", stagger: { each: 0.012, from: "random" } });
            else gsap.set(c, { autoAlpha: 0, yPercent: 150 });
          });
        };
        const tl = gsap.timeline({ defaults: { ease: "none" }, paused: true });
        plates.forEach((p, i) => {
          if (i === 0) return;
          tl.fromTo(p, { yPercent: 100 }, { yPercent: 0, duration: 1, ease: "power2.inOut" }, i - 1)
            .fromTo(p.querySelector("[data-bg]"), { scale: 1.15 }, { scale: 1, duration: 1, ease: "power2.inOut" }, i - 1)
            .to(plates[i - 1].querySelector("[data-bg]"), { scale: 0.92, autoAlpha: 0.4, duration: 1, ease: "power2.inOut" }, i - 1);
        });
        if (n === 1) tl.to({}, { duration: 1 });

        // Gestures are intercepted so ONE swipe/wheel step = exactly ONE panel.
        // Pinning itself is pure CSS (sticky wrapper); no GSAP pin to avoid double-pinning.
        let step = 0;
        let busy = false;
        let gestureUsed = false;
        let handoff = false;
        const goTo = (next: number) => {
          next = gsap.utils.clamp(0, n - 1, next);
          if (busy || next === step) return;
          busy = true;
          const dir = next > step ? 1 : -1;
          step = next;
          show(step, dir, true);
          gsap.to(tl, {
            progress: n > 1 ? step / (n - 1) : 0,
            duration: 1.6,
            ease: "power2.inOut",
            onComplete: () => { busy = false; },
          });
        };
        const move = (dir: number) => {
          // Ignore the rest of a swipe (including its release) and wheel momentum.
          if (busy || gestureUsed || handoff) return;
          gestureUsed = true;
          const top = el.getBoundingClientRect().top + window.scrollY;
          if ((dir > 0 && step === n - 1) || (dir < 0 && step === 0)) {
            handoff = true;
            obs.disable();
            const height = el.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight;
            window.scrollTo({ top: dir > 0 ? top + el.offsetHeight : Math.max(0, top - height), behavior: "smooth" });
          } else goTo(step + dir);
        };
        const obs = Observer.create({
          target: window,
          type: "wheel,touch,pointer",
          tolerance: 12,
          preventDefault: true,
          dragMinimum: 12,
          ignore: "a, button, input, textarea, select, [role='dialog']",
          onPress: () => { gestureUsed = false; },
          onStopDelay: 0.2,
          onStop: () => { if (!obs.isPressed) gestureUsed = false; },
          // Wheel deltas follow page direction; touch/pointer deltas follow the finger.
          onDown: (self) => move(self.event.type === "wheel" ? 1 : -1),
          onUp: (self) => move(self.event.type === "wheel" ? -1 : 1),
          onEnable: () => show(step),
        });
        obs.disable(); // inert until the stage is actually pinned in view
        // Geometry-driven arm/disarm: the Observer only owns gestures while the stage fills the
        // viewport. This replaces ScrollTrigger enter/leave callbacks, which do not fire reliably
        // when the section is already scrolled into position.
        const isPinned = () => {
          const r = el.getBoundingClientRect();
          const height = el.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight;
          // Mobile scroll coordinates can land on fractional pixels and browser chrome
          // changes innerHeight independently of the stable-height photo stage.
          return r.top <= 1 && r.bottom >= height - 1;
        };
        // Hard swipes: native momentum can fly through the whole track. While armed, freeze page
        // scroll (overflow hidden kills inertia on iOS/Android) and snap to the stage edge.
        const html = document.documentElement;
        const lock = (on: boolean) => {
          html.style.overflow = on ? "hidden" : "";
          html.style.overscrollBehavior = on ? "none" : "";
          (el.firstElementChild as HTMLElement | null)?.style.setProperty("touch-action", on ? "none" : "");
        };
        const origDisable = obs.disable.bind(obs);
        obs.disable = () => { lock(false); return origDisable(); };
        let wasPinned = false;
        let lastY = window.scrollY;
        const sync = () => {
          const pinned = isPinned();
          const fromTop = window.scrollY >= lastY;
          lastY = window.scrollY;
          if (pinned && !wasPinned) {
            if (!handoff) {
              step = fromTop ? 0 : n - 1;
              gestureUsed = false;
              show(step);
              tl.progress(n > 1 ? step / (n - 1) : 0);
              const top = el.getBoundingClientRect().top + window.scrollY;
              const height = el.firstElementChild?.getBoundingClientRect().height ?? window.innerHeight;
              window.scrollTo({ top: fromTop ? top : top + el.offsetHeight - height, behavior: "instant" as ScrollBehavior });
              lastY = window.scrollY;
              lock(true);
              obs.enable();
            }
          } else if (!pinned && wasPinned) {
            obs.disable();
            handoff = false;
          } else if (pinned && !handoff && !obs.isEnabled) {
            lock(true);
            obs.enable();
          }
          wasPinned = pinned;
        };
        const onScroll = () => sync();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        chars.forEach((c) => gsap.set(c, { autoAlpha: 0, yPercent: 150 }));
        sync();
        cleanup = () => {
          window.removeEventListener("scroll", onScroll);
          window.removeEventListener("resize", onScroll);
          lock(false);
          obs.kill();
          gsap.killTweensOf(tl);
        };
      }, el);
      kill = () => ctx.revert();
    });
    return () => { alive = false; cleanup(); kill(); };
  }, [s.enabled, JSON.stringify(slides)]);

  if (!s.enabled || !slides.length) return null;

  return (
    <div ref={root} aria-label="Studio plates" className="relative" style={{ height: `${slides.length * 100}svh` }}>
      <div className="sticky top-0 h-[100svh] w-full overflow-hidden bg-soot">
        {slides.map((sl, i) => (
          <section
            key={i}
            data-plate
            data-tone="light"
            className="absolute inset-0 h-full w-full overflow-hidden bg-soot text-bone"
            style={{ zIndex: i + 1 }}
          >
            <div
              data-bg
              className="absolute inset-0 flex h-full w-full items-center justify-center bg-cover bg-center"
              style={{ backgroundImage: `linear-gradient(180deg, rgb(20 21 19 / .65) 40%, rgb(20 21 19 / .2)), url(${sl.image || archiveDark})` }}
            >
              <div className="px-7 text-center">
                <p className="caps opacity-60">{sl.caption}</p>
                <h2 className="mt-5 font-display text-5xl font-light sm:text-7xl lg:text-8xl" aria-label={sl.heading}>
                  {sl.heading.split(" ").map((w, wi) => (
                    <span key={wi} aria-hidden="true" className="inline-block overflow-hidden whitespace-nowrap pr-[0.25em]">
                      {Array.from(w).map((c, ci) => <span key={ci} data-ch className="inline-block">{c}</span>)}
                    </span>
                  ))}
                </h2>
                {sl.link && <a href={sl.link} className="corner-action caps mt-10 inline-flex">Enter</a>}
                <p className="caps mt-10 font-mono text-xs opacity-50">{String(i + 1).padStart(2, "0")} / {String(slides.length).padStart(2, "0")}</p>
              </div>
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
