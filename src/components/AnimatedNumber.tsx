/** Mechanical odometer: each digit rolls vertically into place. CSS-only, SSR-safe. */
export function AnimatedNumber({ value, className = "" }: { value: string | number; className?: string }) {
  const chars = String(value).split("");
  return (
    <span className={`inline-flex tabular-nums ${className}`} aria-label={String(value)}>
      {chars.map((c, i) =>
        /\d/.test(c) ? (
          <span key={chars.length - i} aria-hidden="true" className="relative inline-block h-[1.15em] overflow-hidden leading-[1.15em]">
            <span
              className="flex flex-col transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]"
              style={{ transform: `translateY(-${Number(c) * 10}%)` }}
            >
              {Array.from({ length: 10 }, (_, d) => (
                <span key={d} className="h-[1.15em]">{d}</span>
              ))}
            </span>
          </span>
        ) : (
          <span key={`${chars.length - i}-${c}`} aria-hidden="true">{c}</span>
        ),
      )}
    </span>
  );
}
