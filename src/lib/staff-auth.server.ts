// Staff (owner + admin) authentication against the personal Supabase project.
// Credentials live in public.staff on the personal database; sessions are
// signed, HttpOnly cookies issued and verified only on the server.
import { getRequestHeader, setResponseHeader } from "@tanstack/react-start/server";
import { getPersonalAdmin } from "./personal-supabase.server";

export const STAFF_COOKIE = "oh_staff";
const SESSION_DAYS = 7;

export type StaffRole = "owner" | "admin";
export type StaffSession = { id: string; email: string; role: StaffRole };

export const SETUP_HINT =
  "Your personal database has no staff table yet — run supabase/personal-schema.sql in your Supabase SQL editor.";

export function isMissingTable(error: any) {
  return (
    error?.code === "PGRST205" ||
    error?.code === "42P01" ||
    /schema cache|does not exist/i.test(String(error?.message ?? ""))
  );
}

const enc = new TextEncoder();

function b64url(bytes: Uint8Array) {
  let s = "";
  bytes.forEach((b) => (s += String.fromCharCode(b)));
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

function fromB64url(value: string) {
  const padded = value.replace(/-/g, "+").replace(/_/g, "/");
  const raw = atob(padded + "=".repeat((4 - (padded.length % 4)) % 4));
  return Uint8Array.from(raw, (c) => c.charCodeAt(0));
}

function sessionSecret() {
  const secret = process.env["STAFF_SESSION_SECRET"];
  if (!secret) throw new Error("Staff sign-in is not configured yet.");
  return secret;
}

// ---------- password hashing (PBKDF2-SHA256) ----------

const ITERATIONS = 100_000;

async function pbkdf2(password: string, salt: Uint8Array) {
  const key = await crypto.subtle.importKey("raw", enc.encode(password), "PBKDF2", false, [
    "deriveBits",
  ]);
  const bits = await crypto.subtle.deriveBits(
    { name: "PBKDF2", hash: "SHA-256", salt: salt as unknown as BufferSource, iterations: ITERATIONS },
    key,
    256,
  );
  return new Uint8Array(bits);
}

export async function hashPassword(password: string) {
  const salt = crypto.getRandomValues(new Uint8Array(16));
  const hash = await pbkdf2(password, salt);
  return `pbkdf2$${ITERATIONS}$${b64url(salt)}$${b64url(hash)}`;
}

export async function verifyPassword(password: string, stored: string) {
  const parts = stored.split("$");
  if (parts.length !== 4 || parts[0] !== "pbkdf2") return false;
  const salt = fromB64url(parts[2]!);
  const expected = parts[3]!;
  const actual = b64url(await pbkdf2(password, salt));
  if (actual.length !== expected.length) return false;
  let diff = 0;
  for (let i = 0; i < actual.length; i++) diff |= actual.charCodeAt(i) ^ expected.charCodeAt(i);
  return diff === 0;
}

// ---------- signed session cookie ----------

async function sign(payload: string) {
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(sessionSecret()),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(payload));
  return b64url(new Uint8Array(sig));
}

/**
 * The editor shows the site inside an iframe, so the session cookie must be
 * SameSite=None (which requires Secure). Plain http dev hosts reject Secure
 * cookies, so fall back to Lax there.
 */
function cookieAttributes() {
  const host = getRequestHeader("host") ?? "";
  const proto = getRequestHeader("x-forwarded-proto") ?? (host.startsWith("localhost") ? "http" : "https");
  return proto === "https" ? "Secure; SameSite=None" : "SameSite=Lax";
}

export async function issueStaffCookie(session: StaffSession) {
  const body = { ...session, exp: Date.now() + SESSION_DAYS * 86_400_000 };
  const payload = b64url(enc.encode(JSON.stringify(body)));
  const token = `${payload}.${await sign(payload)}`;
  setResponseHeader(
    "set-cookie",
    `${STAFF_COOKIE}=${token}; Path=/; HttpOnly; ${cookieAttributes()}; Max-Age=${SESSION_DAYS * 86_400}`,
  );
}

export function clearStaffCookie() {
  setResponseHeader(
    "set-cookie",
    `${STAFF_COOKIE}=; Path=/; HttpOnly; ${cookieAttributes()}; Max-Age=0`,
  );
}

function readCookie(name: string) {
  const raw = getRequestHeader("cookie") ?? "";
  for (const part of raw.split(";")) {
    const [k, ...v] = part.trim().split("=");
    if (k === name) return v.join("=");
  }
  return undefined;
}

export async function getStaffSession(): Promise<StaffSession | null> {
  const token = readCookie(STAFF_COOKIE);
  if (!token) return null;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return null;
  if ((await sign(payload)) !== sig) return null;
  try {
    const body = JSON.parse(new TextDecoder().decode(fromB64url(payload)));
    if (!body?.id || !body?.exp || body.exp < Date.now()) return null;
    return { id: body.id, email: body.email ?? "", role: body.role === "owner" ? "owner" : "admin" };
  } catch {
    return null;
  }
}

export async function requireStaff(): Promise<StaffSession> {
  const session = await getStaffSession();
  if (!session) throw new Error("Please sign in to the studio panel.");
  return session;
}

export async function requireOwner(): Promise<StaffSession> {
  const session = await requireStaff();
  if (session.role !== "owner") throw new Error("Only the owner can manage studio access.");
  return session;
}

// ---------- staff records ----------

export function normalizeEmail(email: string) {
  return email.trim().toLowerCase();
}

export async function findStaffByEmail(email: string) {
  const db = getPersonalAdmin();
  const { data, error } = await db
    .from("staff")
    .select("id, email, role, password_hash")
    .eq("email", normalizeEmail(email))
    .maybeSingle();
  if (error) throw new Error(isMissingTable(error) ? SETUP_HINT : error.message);
  return data as { id: string; email: string; role: StaffRole; password_hash: string } | null;
}

export async function ownerExists() {
  const db = getPersonalAdmin();
  const { data, error } = await db.from("staff").select("id").eq("role", "owner").limit(1);
  if (error) throw new Error(isMissingTable(error) ? SETUP_HINT : error.message);
  return (data ?? []).length > 0;
}
