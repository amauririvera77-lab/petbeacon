import { createContext, ReactNode, useContext, useMemo, useState } from "react";

// Estado compartido del FAB (vive en el layout de pestañas, una sola instancia para las 4 pestañas): `collapsed` es el
// comportamiento de scroll (la Home lo contrae al bajar por el feed y lo expande al subir); `hidden` lo saca de la
// pantalla por completo (Fase 3 de congelación: Profile no muestra FAB) — independiente de collapsed.
const Ctx = createContext<{ collapsed: boolean; setCollapsed: (v: boolean) => void; hidden: boolean; setHidden: (v: boolean) => void }>({
  collapsed: false, setCollapsed: () => {}, hidden: false, setHidden: () => {},
});

export function FabProvider({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [hidden, setHidden] = useState(false);
  const value = useMemo(() => ({ collapsed, setCollapsed, hidden, setHidden }), [collapsed, hidden]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}
export const useFab = () => useContext(Ctx);
