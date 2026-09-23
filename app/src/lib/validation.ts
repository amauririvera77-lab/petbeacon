import { parsePhoneNumberFromString } from "libphonenumber-js";

// CLAUDE.md §5.8: un valor claramente inválido ("a") no debe llegar a un artefacto público como el flyer.
// Teléfono real (libphonenumber, US por defecto; los no-US se guardan con código de país) o email con formato válido — no basta con "no vacío".
export type ContactResult =
  | { ok: true; kind: "phone" | "email" | "none"; value: string | null }
  | { ok: false; error: string };

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export function validateContact(raw: string, opts: { required: boolean }): ContactResult {
  const v = raw.trim();
  if (!v) return opts.required ? { ok: false, error: "Add a phone number or email so people can reach you." } : { ok: true, kind: "none", value: null };
  if (v.includes("@")) {
    return EMAIL.test(v) ? { ok: true, kind: "email", value: v.toLowerCase() } : { ok: false, error: "That email doesn't look right." };
  }
  const p = parsePhoneNumberFromString(v, "US");
  if (p && p.isValid()) return { ok: true, kind: "phone", value: p.countryCallingCode === "1" ? p.formatNational() : p.formatInternational() };
  return { ok: false, error: "Enter a valid phone number, like (914) 555-0100, or an email." };
}
