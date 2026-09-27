// Formatos de microchip usados en EE. UU. (evaluación UX): 9 dígitos (AVID/HomeAgain antiguo, solo numérico), 10 caracteres
// (AVID, alfanumérico) o 15 dígitos (estándar ISO, el más común hoy, solo numérico). Cualquier otra longitud o formato es inválido.
export type MicrochipResult = { ok: true; value: string | null } | { ok: false; error: string };

export function validateMicrochip(raw: string): MicrochipResult {
  const v = raw.trim().toUpperCase();
  if (!v) return { ok: true, value: null }; // opcional
  const isNumeric = /^\d+$/.test(v);
  const isAlnum = /^[A-Z0-9]+$/.test(v);
  const validLength = (v.length === 9 && isNumeric) || (v.length === 10 && isAlnum) || (v.length === 15 && isNumeric);
  return validLength ? { ok: true, value: v } : { ok: false, error: "Enter a valid microchip: 9, 10 or 15 characters." };
}
