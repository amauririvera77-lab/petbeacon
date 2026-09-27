// Dirección corta para MOSTRAR (My Reports 4.4): calle o intersección + ciudad, p. ej. "Tonnelle Ave & 42nd St, North Bergen".
// Se guarda SIEMPRE la dirección completa; aquí solo se acorta al mostrarla: sin estado, código postal, país ni unidad ("Unit 3", "Apt 4B").
const COUNTRY = /^(united states( of america)?|usa|us|u\.s\.a?\.?)$/i;
const STATE_ZIP = /^([A-Z]{2}|alabama|alaska|arizona|arkansas|california|colorado|connecticut|delaware|florida|georgia|hawaii|idaho|illinois|indiana|iowa|kansas|kentucky|louisiana|maine|maryland|massachusetts|michigan|minnesota|mississippi|missouri|montana|nebraska|nevada|new hampshire|new jersey|new mexico|new york|north carolina|north dakota|ohio|oklahoma|oregon|pennsylvania|rhode island|south carolina|south dakota|tennessee|texas|utah|vermont|virginia|washington|west virginia|wisconsin|wyoming|district of columbia)(\s+\d{5}(-\d{4})?)?$/i;
const ZIP = /^\d{5}(-\d{4})?$/;
const UNIT = /\s*(,|\b)?\s*(unit|apt\.?|apartment|suite|ste\.?|#)\s*[\w-]+\s*$/i;

// Abreviaturas estándar de EE. UU. (USPS) para el tipo de vía, y "and" → "&" en intersecciones ("Tonnelle Avenue and 42nd Street" →
// "Tonnelle Ave & 42nd St"). Un geocoder (Mapbox) devuelve el nombre completo; el texto guardado a mano en el seed ya usa la forma corta.
// Aplicarlo aquí, SOLO al mostrar, da el mismo formato sin importar de dónde vino la dirección.
const STREET_SUFFIX: [RegExp, string][] = [
  [/\bavenue\b/gi, "Ave"], [/\bboulevard\b/gi, "Blvd"], [/\bstreet\b/gi, "St"], [/\broad\b/gi, "Rd"],
  [/\bdrive\b/gi, "Dr"], [/\blane\b/gi, "Ln"], [/\bplace\b/gi, "Pl"], [/\bcourt\b/gi, "Ct"],
  [/\bcircle\b/gi, "Cir"], [/\bhighway\b/gi, "Hwy"], [/\bparkway\b/gi, "Pkwy"], [/\bterrace\b/gi, "Ter"], [/\bsquare\b/gi, "Sq"],
];
function abbreviateStreet(s: string): string {
  let out = s.replace(/\s+and\s+/gi, " & ");
  for (const [re, ab] of STREET_SUFFIX) out = out.replace(re, ab);
  return out;
}

// Calle o intersección + ciudad, SIEMPRE en ese formato y con las mismas abreviaturas, sea cual sea el origen de la dirección
// (geocodificada o escrita a mano). Se guarda siempre la dirección completa; esto solo se aplica al mostrarla.
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
  if (clean.length === 0) return abbreviateStreet(parts[0]);
  // La abreviatura solo se aplica a la calle/intersección (primer tramo): un nombre de ciudad nunca lleva sufijo de vía.
  return clean.length === 1 ? abbreviateStreet(clean[0]) : `${abbreviateStreet(clean[0])}, ${clean[clean.length - 1]}`;
}
