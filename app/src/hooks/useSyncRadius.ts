import { useEffect } from "react";
import { supabase } from "../lib/supabase";
import { useSession } from "../state/session";
import { useAuthUser } from "./useAuthUser";

// El matching corre en la base con profiles.alert_radius_mi (§6): hay que mantenerlo igual al slider/chip.
export function useSyncRadius() {
  const { alertRadiusMi } = useSession();
  const uid = useAuthUser();
  useEffect(() => {
    if (!supabase || !uid) return;
    supabase.from("profiles").update({ alert_radius_mi: alertRadiusMi }).eq("id", uid).then(({ error }) => {
      if (error) console.warn("sync radius:", error.message);
    });
  }, [alertRadiusMi, uid]);
}
