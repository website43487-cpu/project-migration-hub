// Server-only database client. App data now lives in Lovable Cloud; this
// returns the privileged client (RLS bypassed). All access is gated by server
// functions (staff session / signed-in user checks).
// Load inside handlers only — never import at module scope from client code.
import { supabaseAdmin } from "@/integrations/supabase/client.server";

import type { createClient } from "@supabase/supabase-js";
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type LooseClient = ReturnType<typeof createClient<any, any, any>>;

export function getPersonalAdmin(): LooseClient {
  return supabaseAdmin as unknown as LooseClient;
}
