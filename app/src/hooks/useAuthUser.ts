import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

// id del usuario anónimo de Supabase (se crea al publicar el primer reporte); null si aún no hay sesión.
export function useAuthUser(): string | null {
  const [uid, setUid] = useState<string | null>(null);
  useEffect(() => {
    if (!supabase) return;
    supabase.auth.getSession().then(({ data }) => setUid(data.session?.user.id ?? null));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => setUid(session?.user.id ?? null));
    return () => data.subscription.unsubscribe();
  }, []);
  return uid;
}
