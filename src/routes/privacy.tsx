import { createFileRoute, Link } from "@tanstack/react-router";
import { SiteNav } from "@/components/SiteNav";

export const Route = createFileRoute("/privacy")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/privacy" }],
    meta: [
      { title: "Privacy Policy — ObjektHaus" },
      {
        name: "description",
        content: "How ObjektHaus collects, uses and protects your order details, shares them with couriers, and how to view or delete your information.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/privacy" },
      { property: "og:title", content: "Privacy — ObjektHaus" },
      { property: "og:description", content: "How the studio handles your information." },
    ],
  }),
  component: () => (
    <LegalPage
      title="Privacy"
      body={[
        "Who we are — ObjektHaus is a design studio in Mirpur, Dhaka. This policy explains what we collect when you browse or order, and what we do with it.",
        "What we collect — your name, phone number, delivery address and email when you place an order, plus any note you leave. If you pay by mobile banking, the sender number and transaction ID you share.",
        "Why — only to make, dispatch and support your order, and to reply when you write to us. We never sell your information.",
        "Couriers — your name, phone, address and the amount to collect are shared with our delivery partners (Steadfast, Pathao or Carrybee) solely to deliver your parcel.",
        "Messages — we may contact you by phone, SMS, WhatsApp or email about your order. Order details are also sent privately to the studio's own notification channel.",
        "Cookies & measurement — we use Google Tag Manager and Google Analytics to understand, in aggregate, how the site is used. You can block these cookies in your browser.",
        "Storage & security — orders are stored on secure, access-controlled servers. Only studio staff can see them.",
        "Your choices — write to studio@objekthaus.com at any time to see, correct or permanently delete what we hold about you.",
        "Changes — if this policy changes, the updated version will appear on this page. Last updated October 2026.",
      ]}
    />
  ),
});

export function LegalPage({ title, body }: { title: string; body: string[] }) {
  return (
    <main data-tone="dark" className="min-h-screen bg-bone text-bone-foreground">
      <SiteNav />
      <section className="px-7 pt-32 pb-24 sm:px-10">
        <h1 className="font-display text-5xl font-light">{title}</h1>
        <span className="rule-line mt-6" />
        <div className="mt-10 max-w-prose space-y-6 text-[0.95rem] leading-relaxed opacity-80">
          {body.map((p) => (
            <p key={p}>{p}</p>
          ))}
        </div>
        <Link to="/" className="caps link-underline mt-16 inline-block">
          Back to exhibition
        </Link>
      </section>
    </main>
  );
}
