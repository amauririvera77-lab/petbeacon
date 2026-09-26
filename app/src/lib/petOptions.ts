import type { PetSize } from "./database.types";

// Color principal: opciones comunes + "Other" (texto libre). Los ids son los que reconoce el matching (is_known_color en 0017).
export const COLOR_OPTIONS = [
  { value: "black", label: "Black" }, { value: "white", label: "White" }, { value: "brown", label: "Brown" }, { value: "golden", label: "Golden" },
  { value: "gray", label: "Gray" }, { value: "orange", label: "Orange" }, { value: "cream", label: "Cream" }, { value: "multicolor", label: "Multicolor" },
  { value: "other", label: "Other" },
] as const;
export type ColorChoice = (typeof COLOR_OPTIONS)[number]["value"];
const KNOWN = new Set<string>(COLOR_OPTIONS.filter((c) => c.value !== "other").map((c) => c.value));

export const colorToChoice = (c: string | null | undefined): { choice: ColorChoice | null; other: string } =>
  !c ? { choice: null, other: "" } : KNOWN.has(c) ? { choice: c as ColorChoice, other: "" } : { choice: "other", other: c };
export const choiceToColor = (choice: ColorChoice | null, other: string): string | null =>
  choice === "other" ? other.trim() || null : choice;
export const colorLabel = (c: string | null | undefined): string | null =>
  !c ? null : COLOR_OPTIONS.find((o) => o.value === c)?.label ?? c;

export const SIZE_OPTIONS: readonly { value: PetSize; label: string }[] = [
  { value: "small", label: "Small" }, { value: "medium", label: "Medium" }, { value: "large", label: "Large" },
];
export const sizeLabel = (s: PetSize | null | undefined): string | null => SIZE_OPTIONS.find((o) => o.value === s)?.label ?? null;
