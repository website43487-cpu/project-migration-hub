import { brandShareMeta } from "@/lib/brand-media";
import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "./privacy";

export const Route = createFileRoute("/terms")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/terms" }],
    meta: [
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
      ...brandShareMeta,
      { title: "Terms — ObjektHaus" },
      {
        name: "description",
        content: "Editions, reservations, shipping and returns for objects made by the ObjektHaus studio.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/terms" },
      { property: "og:title", content: "Terms — ObjektHaus" },
      { property: "og:description", content: "Editions, reservations, shipping and returns." },
    ],
  }),
  component: () => (
    <LegalPage
      title="Terms"
      body={[
        "Every object is made in a numbered edition. Small variations in colour, grain and surface are part of the material, not a fault.",
        "A reservation holds an edition number for fourteen days. Objects ship within six weeks of confirmation.",
        "Objects may be returned unused within thirty days of delivery, with the botanical archive card included.",
      ]}
    />
  ),
});
