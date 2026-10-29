import { Link, useRouterState } from "@tanstack/react-router";

/** Quiet cream footer with legal links; the homepage ends on its own cream "Bring it home" panel. */
export function SiteFooter() {
  const path = useRouterState({ select: (s) => s.location.pathname });
  if (path === "/" || path.startsWith("/admin")) return null;
  return (
    <footer data-snap-end data-tone="dark" className="bg-clay text-clay-foreground">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-x-5 gap-y-2 px-7 py-8 text-[0.65rem] tracking-widest uppercase opacity-55 sm:px-10">
        <span>© ObjektHaus Studio, Dhaka</span>
        <Link to="/privacy" className="hover:opacity-100">Privacy policy</Link>
        <Link to="/terms" className="hover:opacity-100">Terms</Link>
      </div>
    </footer>
  );
}
