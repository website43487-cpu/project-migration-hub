import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { staffStatus } from "@/lib/staff-auth.functions";

/** Studio session (owner/admin) held in a server-side cookie. */
export function useStaff() {
  const fetchStatus = useServerFn(staffStatus);
  return useQuery({
    queryKey: ["staff-status"],
    queryFn: () => fetchStatus(),
    retry: false,
    staleTime: 30_000,
  });
}
