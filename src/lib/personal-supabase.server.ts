// Server-only database client. App data now lives in Lovable Cloud; this
// returns the privileged client (RLS bypassed). All access is gated by server
// functions (staff session / signed-in user checks).
// Load inside handlers only — never import at module scope from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = any;

export function getPersonalAdmin(): LooseClient {
  return supabaseAdmin;
}
