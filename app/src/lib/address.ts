// Dirección corta para MOSTRAR (My Reports 4.4): calle o intersección + ciudad, p. ej. "Tonnelle Ave & 42nd St, North Bergen".
// Se guarda SIEMPRE la dirección completa; aquí solo se acorta al mostrarla: sin estado, código postal, país ni unidad ("Unit 3", "Apt 4B").
const COUNTRY = /^(united states( of america)?|usa|us|u\.s\.a?\.?)$/i;
const STATE_ZIP = /^([A-Z]{2}|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)(\s+\d{5}(-\d{4})?)?$/i;
const ZIP = /^\d{5}(-\d{4})?$/;
const UNIT = /\s*(,|\b)?\s*(unit|apt\.?|apartment|suite|ste\.?|#)\s*[\w-]+\s*$/i;

export function shortAddress(label: string | null | undefined): string | null {
  if (!label) return null;
  const parts = label.split(",").map((p) => p.trim()).filter(Boolean);
  if (parts.length === 0) return null;
  // De atrás hacia adelante: país, código postal suelto y estado (con o sin código). Solo se quita UNO de cada tipo, al final, así una
  // ciudad que se llama igual que su estado ("New York, New York 10013") conserva la ciudad.
  if (parts.length > 1 && COUNTRY.test(parts[parts.length - 1])) parts.pop();
  if (parts.length > 1 && ZIP.test(parts[parts.length - 1])) parts.pop();
  if (parts.length > 1 && STATE_ZIP.test(parts[parts.length - 1])) parts.pop();
  const clean = parts.map((p) => p.replace(UNIT, "").trim()).filter((p) => p && !/^(unit|apt\.?|apartment|suite|ste\.?|#)\s*[\w-]+$/i.test(p));
  if (clean.length === 0) return parts[0];
  return clean.length === 1 ? clean[0] : `${clean[0]}, ${clean[clean.length - 1]}`;   // calle o intersección + ciudad
}
