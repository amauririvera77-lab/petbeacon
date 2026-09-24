import { useCallback, useEffect, useState } from "react";
import type { Pet } from "../lib/database.types";
import { supabase } from "../lib/supabase";
import { useAuthUser } from "./useAuthUser";

// Mascotas registradas del usuario (Profile → Registered pets). Sin sesión aún no hay ninguna.
export function usePets() {
  const uid = useAuthUser();
  const [pets, setPets] = useState<Pet[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    if (!supabase || !uid) { setPets([]); setLoading(false); return; }
    const { data, error } = await supabase.from("pets").select("*").eq("user_id", uid).order("created_at", { ascending: true });
    if (error) console.warn("pets:", error.message);
    else setPets((data ?? []) as Pet[]);
    setLoading(false);
  }, [uid]);

  useEffect(() => { refresh(); }, [refresh]);
  return { pets, loading, refresh };
}
