import { useCallback, useEffect, useState } from "react";
import type { MyMatch } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "./useAuthUser";

// Matches automáticos de los Lost del usuario. `dismiss` pasa el banner de Home a badge en My Reports (no se pierde).
export function useMyMatches() {
  const uid = useAuthUser();
  const [matches, setMatches] = useState<MyMatch[]>([]);

  const refresh = useCallback(async () => {
    if (!supabase || !uid) { setMatches([]); return; }
    const { data, error } = await supabase.rpc("my_matches");
    if (error) console.warn("my_matches:", error.message);
    else setMatches(data ?? []);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);

  const dismiss = useCallback(async (id: string) => {
    setMatches((m) => m.map((x) => (x.id === id ? { ...x, dismissed: true } : x))); // optimista
    if (!supabase) return;
    const { error } = await supabase.from("matches").update({ dismissed: true }).eq("id", id);
    if (error) { console.warn("dismiss:", error.message); refresh(); }
  }, [refresh]);

  return { matches, refresh, dismiss };
}
