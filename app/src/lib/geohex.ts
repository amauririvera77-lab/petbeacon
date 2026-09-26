// PostgREST devuelve una columna geography como EWKB en hexadecimal ("0101000020E6100000<x><y>"). Extrae [lat, lng] de un punto.
export function parsePointHex(hex: string | null | undefined): { lat: number; lng: number } | null {
  if (!hex || hex.length < 42 || !/^[0-9a-fA-F]+$/.test(hex)) return null;
  try {
    const bytes = new Uint8Array(hex.length / 2);
    for (let i = 0; i < bytes.length; i++) bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
    const v = new DataView(bytes.buffer);
    const little = bytes[0] === 1;
    const type = v.getUint32(1, little);
    const hasSrid = (type & 0x20000000) !== 0;
    const off = 5 + (hasSrid ? 4 : 0);
    const lng = v.getFloat64(off, little), lat = v.getFloat64(off + 8, little);
    return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
  } catch { return null; }
}

export function distanceMi(a: { lat: number; lng: number }, b: { lat: number; lng: number }): number {
  const R = 3958.8, rad = Math.PI / 180;
  const dLat = (b.lat - a.lat) * rad, dLng = (b.lng - a.lng) * rad;
  const h = Math.sin(dLat / 2) ** 2 + Math.cos(a.lat * rad) * Math.cos(b.lat * rad) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}
