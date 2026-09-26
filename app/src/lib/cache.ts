import AsyncStorage from "@react-native-async-storage/async-storage";

// Copia local de la última respuesta buena (fase 6.3): sin conexión se muestra lo último sincronizado, con su hora.
export type Cached<T> = { data: T; savedAt: number };

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  try {
    const raw = await AsyncStorage.getItem(`petbeacon.cache.${key}`);
    return raw ? (JSON.parse(raw) as Cached<T>) : null;
  } catch { return null; }
}

export async function writeCache<T>(key: string, data: T): Promise<number> {
  const savedAt = Date.now();
  try { await AsyncStorage.setItem(`petbeacon.cache.${key}`, JSON.stringify({ data, savedAt } satisfies Cached<T>)); } catch {}
  return savedAt;
}
