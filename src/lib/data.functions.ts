// Server functions that read/write app data (products, site_settings, orders)
// on the user's personal Supabase project. Auth stays on the managed backend:
// admin actions are authorized through has_role() on the managed user_roles
// table; own-order reads use the signed-in user's id; public reads need no auth.
import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import type { ProductRow } from "@/lib/products";

async function personalAdmin() {
  const { getPersonalAdmin } = await import("@/lib/personal-supabase.server");
  return getPersonalAdmin();
}

// Studio access is authenticated against the personal database's staff table.
async function assertAdmin() {
  const { requireStaff } = await import("@/lib/staff-auth.server");
  await requireStaff();
}

/** True when the personal database hasn't had the schema script run yet. */
function isMissingTable(error: any) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    /schema cache|does not exist/i.test(String(error?.message ?? ""))
  );
}

const SETUP_HINT =
  "Your personal database has no tables yet — run supabase/personal-schema.sql in your Supabase SQL editor.";

/**
 * PGRST303 ("JWT issued at future") happens when the server clock is a few
 * seconds behind the database's. It is transient, so retry briefly.
 */
function isClockSkew(error: any) {
  return error?.code === "PGRST303" || /issued at future/i.test(String(error?.message ?? ""));
}

async function withRetry<T extends { error: any }>(run: () => PromiseLike<T>): Promise<T> {
  let result = await run();
  for (let i = 0; i < 2 && isClockSkew(result.error); i++) {
    await new Promise((r) => setTimeout(r, 400));
    result = await run();
  }
  return result;
}

function assertSchema(error: any) {
  if (isMissingTable(error)) throw new Error(SETUP_HINT);
  if (error) throw error;
}


// ---------- Public reads ----------

export const listProducts = createServerFn({ method: "GET" }).handler(async () => {
  const db = await personalAdmin();
  const { data, error } = await withRetry(() =>
    db
      .from("products")
      .select("*")
      .eq("published", true)
      .order("sort_order", { ascending: true })
      .order("created_at", { ascending: true }),
  );
  // Before the schema script is run, fall back to the built-in objects
  // instead of breaking the public site.
  if (error) {
    if (isMissingTable(error) || isClockSkew(error)) return [] as ProductRow[];
    throw error;
  }
  return (data ?? []) as ProductRow[];
});

export const getSetting = createServerFn({ method: "GET" })
  .inputValidator((input: { key: string }) => input)
  .handler(async ({ data }) => {
    const db = await personalAdmin();
    const { data: row, error } = await withRetry(() =>
      db.from("site_settings").select("value").eq("key", data.key).maybeSingle(),
    );
    // A missing schema or a transient clock-skew error must never blank the site.
    if (error && !isMissingTable(error) && !isClockSkew(error)) throw error;
    return { value: (row?.value ?? null) as any };
  });


// ---------- Public: place an order ----------

type OrderInput = {
  customer_name: string;
  phone: string;
  address: string;
  email?: string | null;
  note?: string | null;
  items: unknown;
  subtotal: number;
  total_weight: number;
  shipping: number;
  total: number;
  delivery_zone?: string;
  payment_method?: string | null;
  payment_trx_id?: string | null;
  payment_sender?: string | null;
  user_id?: string | null;
};

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: OrderInput) => input)
  .handler(async ({ data }) => {
    const db = await personalAdmin();
    const trxId = data.payment_trx_id?.trim().toUpperCase() || null;
    if (trxId) {
      const { data: existing, error: lookupError } = await db.from("orders").select("reference").ilike("payment_trx_id", trxId).limit(1);
      if (lookupError && !isMissingTable(lookupError)) throw lookupError;
      if (existing?.length) throw new Error("This transaction ID has already been used. Check the ID or contact the studio.");
    }
    const { data: row, error } = await db
      .from("orders")
      .insert({
        customer_name: data.customer_name,
        phone: data.phone,
        address: data.address,
        email: data.email ?? null,
        note: data.note ?? null,
        items: data.items,
        subtotal: data.subtotal,
        total_weight: data.total_weight,
        shipping: data.shipping,
        total: data.total,
        delivery_zone: data.delivery_zone ?? "inside",
        payment_method: data.payment_method ?? null,
        payment_trx_id: trxId,
        payment_sender: data.payment_sender ?? null,
        user_id: data.user_id ?? null,
      })
      .select("reference")
      .single();
    if (error?.code === "23505" || /orders_trx_unique|duplicate key/i.test(String(error?.message ?? ""))) {
      throw new Error("This transaction ID has already been used. Please verify it or contact the studio.");
    }
    assertSchema(error);

    const reference = (row?.reference ?? "") as string;
    // Notify the studio's Telegram bot; never block the customer on it.
    try {
      const { notifyNewOrder } = await import("@/lib/telegram.server");
      await notifyNewOrder({
        reference,
        customer_name: data.customer_name,
        phone: data.phone,
        address: data.address,
        email: data.email ?? null,
        note: data.note ?? null,
        items: Array.isArray(data.items) ? (data.items as any[]) : [],
        subtotal: data.subtotal,
        shipping: data.shipping,
        total: data.total,
        total_weight: data.total_weight,
        delivery_zone: data.delivery_zone ?? "inside",
      });
    } catch (e) {
      console.error("Order notification failed:", e);
    }

    return { reference };
  });

// ---------- Authenticated: own order history ----------

type MyOrderRow = {
  id: string;
  reference: string;
  status: string;
  total: number;
  shipping: number;
  created_at: string;
  items: { name?: string; product?: string; qty?: number }[] | null;
};

export const getMyOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const db = await personalAdmin();
    const { data } = await db
      .from("orders")
      .select("id, reference, status, total, shipping, created_at, items")
      .eq("user_id", context.userId)
      .order("created_at", { ascending: false });
    return (data ?? []) as MyOrderRow[];
  });

// ---------- Admin: products ----------

export const adminListProducts = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin();
  const db = await personalAdmin();
  const { data } = await db
    .from("products")
    .select("*")
    .order("sort_order", { ascending: true })
    .order("created_at", { ascending: true });
  return (data ?? []) as ProductRow[];
});

type ProductInput = Omit<ProductRow, "id" | "created_at" | "updated_at"> & { id?: string };

export const adminSaveProduct = createServerFn({ method: "POST" })
  .inputValidator((input: ProductInput) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    if (data.id) {
      const { id, ...input } = data;
      const { data: previous, error: readError } = await db.from("products").select("card_url, images").eq("id", id).single();
      assertSchema(readError);
      const { storeReplacementsInPersonal, cleanupReplacedMedia } = await import("./media-cleanup.server");
      const rest = await storeReplacementsInPersonal(previous, input, await requestOrigin());
      const { error } = await db.from("products").update(rest).eq("id", id);
      assertSchema(error);
      await cleanupReplacedMedia(previous, rest);
    } else {
      const { id: _omit, ...rest } = data;
      const { error } = await db.from("products").insert(rest);
      assertSchema(error);
    }
    return { ok: true };
  });

export const adminDeleteProduct = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    const { error } = await db.from("products").delete().eq("id", data.id);
    assertSchema(error);
    return { ok: true };
  });

// ---------- Admin: site settings ----------

export const adminSaveSetting = createServerFn({ method: "POST" })
  .inputValidator((input: { key: string; value: unknown }) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    const { data: previous, error: readError } = await db.from("site_settings").select("value").eq("key", data.key).maybeSingle();
    assertSchema(readError);
    const { storeReplacementsInPersonal, cleanupReplacedMedia } = await import("./media-cleanup.server");
    const value = data.key === "media_copies"
      ? data.value
      : await storeReplacementsInPersonal(previous?.value, data.value, await requestOrigin());
    const { error } = await db.from("site_settings").upsert({ key: data.key, value });
    assertSchema(error);
    if (data.key !== "media_copies") await cleanupReplacedMedia(previous?.value, value);
    return { ok: true };
  });

// ---------- Admin: orders ----------

type AdminOrderInput = {
  id: string;
  reference?: string;
  customer_name?: string;
  phone?: string;
  address?: string;
  email?: string | null;
  note?: string | null;
  status?: string;
  delivery_zone?: string;
  items?: unknown;
  subtotal?: number;
  shipping?: number;
  total?: number;
  total_weight?: number;
  courier?: string | null;
  tracking_code?: string | null;
  payment_trx_id?: string | null;
  payment_sender?: string | null;
};

export const adminListOrders = createServerFn({ method: "GET" }).handler(async () => {
  await assertAdmin();
  const db = await personalAdmin();
  const { data } = await db.from("orders").select("*").order("created_at", { ascending: false });
  return data ?? [];
});

export const adminUpdateOrder = createServerFn({ method: "POST" })
  .inputValidator((input: AdminOrderInput) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    const { id, ...rest } = data;
    const { error } = await db.from("orders").update(rest).eq("id", id);
    assertSchema(error);
    return { ok: true };
  });

export const adminDeleteOrder = createServerFn({ method: "POST" })
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    const { error } = await db.from("orders").delete().eq("id", data.id);
    assertSchema(error);
    return { ok: true };
  });


// Chronological order audit trail for Studio.
export const adminListOrderAudit = createServerFn({ method: "GET" })
  .inputValidator((input: { order_id: string }) => input)
  .handler(async ({ data }) => {
    await assertAdmin();
    const db = await personalAdmin();
    const { data: rows, error } = await db.from("order_audit").select("*").eq("order_id", data.order_id).order("changed_at", { ascending: false }).limit(100);
    if (error && !isMissingTable(error)) throw error;
    return rows ?? [];
  });
