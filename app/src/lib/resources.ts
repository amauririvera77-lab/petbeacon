import { HeartPulse, House, PawPrint, Scale, Utensils, type LucideIcon } from "lucide-react-native";
import type { ResourceCategory, ResourceNearby } from "./database.types";
import { C } from "../theme/tokens";

// Categorías y paleta del prototipo (CLAUDE.md §2): food → info, foster → sosDark, legal → teal.
export const CATEGORIES: { key: "all" | ResourceCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Emergency food & clinics" },
  { key: "foster", label: "Temporary foster" },
  { key: "legal", label: "Legal & shelters" },
];

export const CATEGORY_STYLE: Record<ResourceCategory, { Icon: LucideIcon; color: string; tint: string }> = {
  food: { Icon: Utensils, color: C.info, tint: C.infoTint },
  foster: { Icon: House, color: C.sosDark, tint: C.sosTint },
  legal: { Icon: Scale, color: C.teal, tint: C.tealTint },
};

// La columna `icon` del recurso (p. ej. clínicas → corazón con pulso, santuario → huella) tiene prioridad sobre la de su categoría.
const ICON_OVERRIDE: Record<string, LucideIcon> = { "heart-pulse": HeartPulse, paw: PawPrint };
export const resourceIcon = (r: Pick<ResourceNearby, "icon" | "category">): LucideIcon =>
  (r.icon && ICON_OVERRIDE[r.icon]) || CATEGORY_STYLE[r.category].Icon;

const digits = (s: string) => s.replace(/\D/g, "");
export const phoneDigits = (phone: string | null) => (phone ? digits(phone) : "");
// wa.me exige el código de país: los teléfonos del seed son de EE. UU.
export const whatsappUrl = (phone: string | null) => {
  const d = phoneDigits(phone);
  return d ? `https://wa.me/${d.length === 10 ? "1" + d : d}` : null;
};
export const directionsUrl = (r: Pick<ResourceNearby, "address" | "lat" | "lng" | "name">) =>
  `http://maps.apple.com/?daddr=${encodeURIComponent(r.address || `${r.lat},${r.lng}`)}&q=${encodeURIComponent(r.name)}`;
export const webUrl = (site: string | null) => (site ? (/^https?:\/\//.test(site) ? site : `https://${site}`) : null);
