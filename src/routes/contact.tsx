import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { SiteNav } from "@/components/SiteNav";
import { SocialLinks } from "@/components/Social";
import { useContactInfo, whatsappHref } from "@/lib/site";

export const Route = createFileRoute("/contact")({
  head: () => ({
    links: [{ rel: "canonical", href: "https://objekthausstudio.lovable.app/contact" }],
    meta: [
      { title: "Contact the Studio — ObjektHaus" },
      {
        name: "description",
        content:
          "Write to the ObjektHaus studio about commissions, editions, press or a visit to the workshop.",
      },
      { property: "og:url", content: "https://objekthausstudio.lovable.app/contact" },
      { property: "og:title", content: "Contact the Studio — ObjektHaus" },
      { property: "og:description", content: "Commissions, editions, press and studio visits." },
    ],
  }),
  component: Contact,
});

function Contact() {
  const [sent, setSent] = useState(false);
  const contact = useContactInfo();

  return (
    <main data-tone="dark" className="min-h-screen bg-sand text-sand-foreground">
      <SiteNav />

      <section className="mx-auto max-w-2xl px-7 pt-32 pb-20 sm:px-10 lg:pt-40">
        <p className="caps opacity-55">Studio</p>
        <h1 className="mt-4 font-display text-5xl font-light sm:text-6xl">Contact</h1>
        <span className="rule-line mt-6" />

        <div className="mt-10 space-y-2 text-[0.95rem] opacity-80">
          <p>ObjektHaus Werkstatt</p>
          <p className="whitespace-pre-line">{contact.address}</p>
          <p>{contact.hours}</p>
          <p className="pt-4">
            <a href={`mailto:${contact.email}`} className="link-underline">
              {contact.email}
            </a>
          </p>
          <p>
            <a href={whatsappHref(contact.whatsapp)} target="_blank" rel="noreferrer" className="link-underline">
              {contact.whatsapp}
            </a>
          </p>
        </div>

        <div className="mt-10 flex items-center gap-6">
          <span className="caps opacity-55">Elsewhere</span>
          <SocialLinks className="opacity-80" size={20} />
        </div>

        {sent ? (
          <p className="mt-14 font-display text-2xl font-light">
            WhatsApp is ready with your message. Please press Send in WhatsApp to deliver it to the studio.
          </p>
        ) : (
          <form
            className="mt-14 space-y-6"
            onSubmit={(e) => {
              e.preventDefault();
              const form = new FormData(e.currentTarget);
              const name = String(form.get("name") ?? "").trim();
              const email = String(form.get("email") ?? "").trim();
              const message = String(form.get("message") ?? "").trim();
              const text = `Hello ObjektHaus,\n\n${message}\n\nFrom: ${name}\nEmail: ${email}`;
              const chat = window.open(`${whatsappHref(contact.whatsapp)}?text=${encodeURIComponent(text)}`, "_blank", "noopener,noreferrer");
              if (chat) setSent(true);
            }}
          >
            <label className="block">
              <span className="caps opacity-55">Name</span>
              <input
                required
                name="name"
                autoComplete="name"
                className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <label className="block">
              <span className="caps opacity-55">Email</span>
              <input
                required
                type="email"
                name="email"
                autoComplete="email"
                className="mt-2 w-full border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <label className="block">
              <span className="caps opacity-55">Message</span>
              <textarea
                required
                name="message"
                rows={4}
                className="mt-2 w-full resize-none border-b border-current/30 bg-transparent py-2 outline-none focus:border-current"
              />
            </label>
            <button type="submit" className="link-underline caps mt-4">
              Send
            </button>
          </form>
        )}

        <div className="mt-20 flex justify-between">
          <Link to="/" className="caps link-underline">
            Exhibition
          </Link>
          <Link to="/order" className="caps link-underline">
            Order
          </Link>
        </div>
      </section>
      <footer className="flex gap-6 px-7 py-8 sm:px-10"><Link to="/privacy" className="caps link-underline opacity-60">Privacy policy</Link><Link to="/terms" className="caps link-underline opacity-60">Terms</Link></footer>
    </main>
  );
}
