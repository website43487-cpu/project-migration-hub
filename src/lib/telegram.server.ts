// Server-only helper: sends order notifications to Telegram.
// Works self-hosted with a raw bot token (TELEGRAM_BOT_TOKEN), and falls back
// to the Lovable connector gateway when running on Lovable.
// Never import from client-reachable module scope.

const GATEWAY_URL = "https://connector-gateway.lovable.dev/telegram";

function money(n: number) {
  return `৳${Number(n ?? 0).toLocaleString("en-US")}`;
}

type OrderItem = { name?: string; product?: string; qty?: number; price?: number };

export type OrderNotification = {
  reference: string;
  customer_name: string;
  phone: string;
  address: string;
  email?: string | null;
  note?: string | null;
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
  total_weight: number;
  delivery_zone?: string;
};

function escapeHtml(v: unknown) {
  return String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;");
}

export function formatOrderMessage(o: OrderNotification) {
  const lines = (o.items ?? [])
    .map(
      (i) =>
        `• ${escapeHtml(i.product || i.name)} × ${i.qty ?? 1} — ${money((i.price ?? 0) * (i.qty ?? 1))}`,
    )
    .join("\n");

  return [
    `<b>New order ${escapeHtml(o.reference)}</b>`,
    "",
    lines || "—",
    "",
    `Subtotal: ${money(o.subtotal)}`,
    `Weight: ${Number(o.total_weight ?? 0).toFixed(1)} kg`,
    `Delivery: ${o.shipping ? money(o.shipping) : "Included"}`,
    `<b>Total: ${money(o.total)}</b>`,
    "",
    `<b>Customer</b>`,
    `Name: ${escapeHtml(o.customer_name)}`,
    `Phone: ${escapeHtml(o.phone)}`,
    o.email ? `Email: ${escapeHtml(o.email)}` : null,
    `Address: ${escapeHtml(o.address)}`,
    o.note ? `Note: ${escapeHtml(o.note)}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

/** Resolve the destination chat id from site settings, falling back to env. */
async function getChatId(): Promise<string | null> {
  try {
    const { getPersonalAdmin } = await import("@/lib/personal-supabase.server");
    const { data } = await getPersonalAdmin()
      .from("site_settings")
      .select("value")
      .eq("key", "telegram")
      .maybeSingle();
    const id = (data?.value as any)?.chatId;
    if (id) return String(id);
  } catch {
    // fall through to env
  }
  return process.env["TELEGRAM_CHAT_ID"] ?? null;
}

/** Best-effort notification — never throws into the checkout flow. */
export async function notifyNewOrder(order: OrderNotification): Promise<void> {
  try {
    const chatId = await getChatId();
    if (!chatId) {
      console.error("Telegram notification skipped: missing chat id");
      return;
    }
    const text = formatOrderMessage(order);

    // Self-hosted path: raw Telegram Bot API token works anywhere.
    const botToken = process.env["TELEGRAM_BOT_TOKEN"];
    if (botToken) {
      const res = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
      });
      const body = (await res.json()) as { ok?: boolean; description?: string };
      if (!res.ok || !body.ok) {
        console.error(`Telegram sendMessage failed [${res.status}]: ${body.description ?? ""}`);
      }
      return;
    }

    // Lovable path: connector gateway.
    const lovableKey = process.env["LOVABLE_API_KEY"];
    const connectionKey = process.env["TELEGRAM_API_KEY"];
    if (!lovableKey || !connectionKey) {
      console.error("Telegram notification skipped: missing TELEGRAM_BOT_TOKEN or connector keys");
      return;
    }

    const res = await fetch(`${GATEWAY_URL}/sendMessage`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": connectionKey,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ chat_id: chatId, text, parse_mode: "HTML" }),
    });

    if (!res.ok) {
      console.error(`Telegram sendMessage failed [${res.status}]: ${await res.text()}`);
      return;
    }
    const body = (await res.json()) as { ok?: boolean; description?: string };
    if (!body.ok) console.error(`Telegram sendMessage error: ${body.description}`);
  } catch (e) {
    console.error("Telegram notification error:", e);
  }
}
