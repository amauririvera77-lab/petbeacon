import { useEffect, useState } from "react";
import { supabase } from "../lib/supabase";

export type AccountStatus = { uid: string | null; email: string | null; isAnonymous: boolean; ready: boolean };

// Estado de la cuenta: anónima (se empieza así) o guardada con correo (Profile: "Save your account").
export function useAccount(): AccountStatus {
  const [s, setS] = useState<AccountStatus>({ uid: null, email: null, isAnonymous: true, ready: false });
  useEffect(() => {
    if (!supabase) { setS((p) => ({ ...p, ready: true })); return; }
    const apply = (u: { id: string; email?: string | null; is_anonymous?: boolean } | null | undefined) =>
      setS({ uid: u?.id ?? null, email: u?.email || null, isAnonymous: u ? !!u.is_anonymous : true, ready: true });
    supabase.auth.getSession().then(({ data }) => apply(data.session?.user));
    const { data } = supabase.auth.onAuthStateChange((_e, session) => apply(session?.user));
    return () => data.subscription.unsubscribe();
  }, []);
  return s;
}
