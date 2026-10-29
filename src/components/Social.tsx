import { useContactInfo, whatsappHref } from "@/lib/site";

export function InstagramIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="12" cy="12" r="4.2" stroke="currentColor" strokeWidth="1.3" />
      <circle cx="17.4" cy="6.6" r="1.1" fill="currentColor" />
    </svg>
  );
}

export function FacebookIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M14.6 8.4h-1.1c-.7 0-1 .4-1 1V19"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinecap="round"
      />
      <path d="M10.4 11.4h4.1" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" />
    </svg>
  );
}

export function WhatsappIcon({ size = 18 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" aria-hidden="true">
      <rect x="3" y="3" width="18" height="18" rx="5" stroke="currentColor" strokeWidth="1.3" />
      <path
        d="M8.6 15.4a4.6 4.6 0 1 1 1.7 1.3l-2.5.7.8-2Z"
        stroke="currentColor"
        strokeWidth="1.3"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function SocialLinks({ className = "", size = 18 }: { className?: string; size?: number }) {
  const contact = useContactInfo();
  return (
    <div className={`flex items-center gap-4 ${className}`}>
      <a
        href={contact.instagram}
        target="_blank"
        rel="noreferrer"
        aria-label="ObjektHaus on Instagram"
        className="transition-all duration-500 hover:-translate-y-0.5 hover:opacity-60"
      >
        <InstagramIcon size={size} />
      </a>
      <a
        href={contact.facebook}
        target="_blank"
        rel="noreferrer"
        aria-label="ObjektHaus on Facebook"
        className="transition-all duration-500 hover:-translate-y-0.5 hover:opacity-60"
      >
        <FacebookIcon size={size} />
      </a>
      <a
        href={whatsappHref(contact.whatsapp)}
        target="_blank"
        rel="noreferrer"
        aria-label="Message ObjektHaus on WhatsApp"
        className="transition-all duration-300 hover:-translate-y-0.5 hover:opacity-60"
      >
        <WhatsappIcon size={size} />
      </a>
    </div>
  );
}
