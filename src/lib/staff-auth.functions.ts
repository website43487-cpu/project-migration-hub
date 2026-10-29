// Server functions for studio (owner/admin) sign-in, session and access
// management. All credentials and roles live on the personal Supabase project.
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";

async function auth() {
  return await import("./staff-auth.server");
}

const credentials = z.object({
  email: z.string().min(3).max(200),
  password: z.string().min(6).max(200),
});

/** Tells the login page whether first-time owner setup is still needed. */
export const staffStatus = createServerFn({ method: "GET" }).handler(async () => {
  const a = await auth();
  try {
    const [session, hasOwner] = [await a.getStaffSession(), await a.ownerExists()];
    return { session, needsOwner: !hasOwner, error: null as string | null };
  } catch (err) {
    return {
      session: null,
      needsOwner: false,
      error: err instanceof Error ? err.message : "Could not reach the database.",
    };
  }
});

export const staffSignIn = createServerFn({ method: "POST" })
  .inputValidator((d) => credentials.parse(d))
  .handler(async ({ data }) => {
    const a = await auth();
    const record = await a.findStaffByEmail(data.email);
    if (!record || !(await a.verifyPassword(data.password, record.password_hash))) {
      throw new Error("That email and password don't match.");
    }
    const session = { id: record.id, email: record.email, role: record.role };
    await a.issueStaffCookie(session);
    return session;
  });

export const staffSignOut = createServerFn({ method: "POST" }).handler(async () => {
  const a = await auth();
  a.clearStaffCookie();
  return { ok: true };
});

/** One-time owner creation. Refuses to run once an owner exists. */
export const createOwner = createServerFn({ method: "POST" })
  .inputValidator((d) => credentials.parse(d))
  .handler(async ({ data }) => {
    const a = await auth();
    if (await a.ownerExists()) throw new Error("The owner account already exists.");
    const { getPersonalAdmin } = await import("./personal-supabase.server");
    const db = getPersonalAdmin();
    const { data: row, error } = await db
      .from("staff")
      .insert({
        email: a.normalizeEmail(data.email),
        password_hash: await a.hashPassword(data.password),
        role: "owner",
      })
      .select("id, email, role")
      .single();
    if (error) throw new Error(a.isMissingTable(error) ? a.SETUP_HINT : error.message);
    const session = { id: row!.id as string, email: row!.email as string, role: "owner" as const };
    await a.issueStaffCookie(session);
    return session;
  });

export const listStaff = createServerFn({ method: "GET" }).handler(async () => {
  const a = await auth();
  await a.requireOwner();
  const { getPersonalAdmin } = await import("./personal-supabase.server");
  const { data, error } = await getPersonalAdmin()
    .from("staff")
    .select("id, email, role, created_at")
    .order("created_at", { ascending: true });
  if (error) throw new Error(a.isMissingTable(error) ? a.SETUP_HINT : error.message);
  return (data ?? []) as { id: string; email: string; role: "owner" | "admin"; created_at: string }[];
});

export const createAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => credentials.parse(d))
  .handler(async ({ data }) => {
    const a = await auth();
    await a.requireOwner();
    const { getPersonalAdmin } = await import("./personal-supabase.server");
    const email = a.normalizeEmail(data.email);
    const { error } = await getPersonalAdmin()
      .from("staff")
      .upsert(
        { email, password_hash: await a.hashPassword(data.password), role: "admin" },
        { onConflict: "email" },
      );
    if (error) throw new Error(a.isMissingTable(error) ? a.SETUP_HINT : error.message);
    return { ok: true, email };
  });

export const removeAdmin = createServerFn({ method: "POST" })
  .inputValidator((d) => z.object({ id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const a = await auth();
    await a.requireOwner();
    const { getPersonalAdmin } = await import("./personal-supabase.server");
    const { error } = await getPersonalAdmin()
      .from("staff")
      .delete()
      .eq("id", data.id)
      .eq("role", "admin");
    if (error) throw new Error(a.isMissingTable(error) ? a.SETUP_HINT : error.message);
    return { ok: true };
  });
