import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Estado compartido del FAB (vive en el layout de pestañas): la Home lo contrae al bajar por el feed y lo expande al subir.
const Ctx = createContext<{ collapsed: boolean; setCollapsed: (v: boolean) => void }>({ collapsed: false, setCollapsed: () => {} });

export function FabProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const value = useMemo(() => ({ collapsed, setCollapsed }), [collapsed]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useFab = () => useContext(Ctx);
