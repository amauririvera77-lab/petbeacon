import { Contact, ExternalLink, HeartPulse, House, Navigation, PawPrint, Scale, Utensils, type LucideIcon } from "lucide-react-native";
import type { ResourceCategory, ResourceNearby } from "./database.types";
import { resourceActionKind, type ResourceActionKind } from "./resourceLogic";
import { Theme } from "../theme/tokens";

// Categorías y paleta del prototipo (CLAUDE.md §2): food → info, foster → sosDark, legal → teal.
export const CATEGORIES: { key: "all" | ResourceCategory; label: string }[] = [
  { key: "all", label: "All" },
  { key: "food", label: "Food & clinics" },
  { key: "foster", label: "Temporary foster" },
  { key: "legal", label: "Legal aid" },
  { key: "shelter", label: "Rehoming & shelters" },
];

// Fase de congelación (Fase 5): las categorías dejan de diferenciarse por color — el significado lo llevan el ícono
// (ya distinto por categoría) y el filtro. Las 4 usan la misma tile (category.tile.bg/icon, Figma); ninguna usa
// status.*, danger.* ni brand.primary (antes foster reutilizaba status.lost y legal, brand.primary).
export const CATEGORY_STYLE: Record<ResourceCategory, { Icon: LucideIcon; icon: string; tile: string }> = {
  food: { Icon: Utensils, icon: Theme.category.tile.icon, tile: Theme.category.tile.bg },
  foster: { Icon: House, icon: Theme.category.tile.icon, tile: Theme.category.tile.bg },
  legal: { Icon: Scale, icon: Theme.category.tile.icon, tile: Theme.category.tile.bg },
  shelter: { Icon: PawPrint, icon: Theme.category.tile.icon, tile: Theme.category.tile.bg },
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

export { TAG_LABEL, isSample, resourceActionKind, supportOrder, tagLabels, webUrl, type ResourceActionKind } from "./resourceLogic";

// El ícono corresponde a la acción: navegación para direcciones, enlace externo para la web y una tarjeta de contacto para la hoja de opciones.
export type ResourceAction = { kind: ResourceActionKind; label: string; Icon: LucideIcon };
const ACTION: Record<ResourceActionKind, { label: string; Icon: LucideIcon }> = {
  directions: { label: "Get directions", Icon: Navigation }, learn: { label: "Learn more", Icon: ExternalLink }, contact: { label: "Contact", Icon: Contact },
};
export function resourceAction(r: Pick<ResourceNearby, "in_person" | "website_url">, isEvent: boolean): ResourceAction {
  const kind = resourceActionKind(r, isEvent);
  return { kind, ...ACTION[kind] };
}
