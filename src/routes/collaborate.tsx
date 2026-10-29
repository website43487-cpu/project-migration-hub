import { createFileRoute } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";
import { CoCreatePanel } from "@/components/CoCreatePanel";

export const Route = createFileRoute("/collaborate")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/collaborate" }],
    meta: [
      { title: "Got an Idea? — Co-create with ObjektHaus" },
      { name: "description", content: "Submit your object design to ObjektHaus. We review it, make it together and share profit from every sale." },
      { property: "og:title", content: "Got an Idea? — Co-create with ObjektHaus" },
      { property: "og:description", content: "Send your schematic. If we make it, you share in every sale." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Collaborate,
});

function Collaborate() {
  return (
    <main className="min-h-screen bg-sand pt-20">
      <SiteNav />
      <h1 className="sr-only">Co-create with ObjektHaus</h1>
      <CoCreatePanel />
    </main>
  );
}
