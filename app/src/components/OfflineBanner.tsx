import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { agoLong } from "../lib/time";
import { Theme, MIN_HIT } from "../theme/tokens";
import { typography } from "../theme/typography";

// Estado offline real (CLAUDE.md §5.6): NetInfo es el equivalente nativo de navigator.onLine + eventos online/offline.
export function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    return NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false));
  }, []);
  return offline;
}

// Con `lastUpdated` (Home): "Offline · Last updated 5 min ago". Con `failed` estando en línea (servidor caído): "Couldn't refresh · …" + "Try again".
export function OfflineBanner({ lastUpdated, failed, onRetry }: { lastUpdated?: number | null; failed?: boolean; onRetry?: () => void }) {
  const offline = useOffline();
  const [, tick] = useState(0);
  useEffect(() => { const id = setInterval(() => tick((n) => n + 1), 30_000); return () => clearInterval(id); }, []);
  if (!offline && !failed) return null;
  const since = lastUpdated ? `Last updated ${agoLong(lastUpdated)}` : "No saved data yet";
  const text = offline ? (lastUpdated !== undefined ? `Offline · ${since}` : "You're offline — showing the last synced data.") : `Couldn't refresh · ${since}`;
  return (
    <View style={styles.b} accessibilityRole="alert">
      <WifiOff size={16} color={Theme.text.secondary} />
      <Text style={styles.t}>{text}</Text>
      {!offline && onRetry ? <Pressable accessibilityRole="button" onPress={onRetry} style={styles.retry}><Text style={styles.retryT}>Try again</Text></Pressable> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  b: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: Theme.border.default, paddingHorizontal: 16, paddingVertical: 10 },
  t: { ...typography.label13, color: Theme.text.secondary, flexShrink: 1 },
  retry: { minHeight: MIN_HIT, justifyContent: "center", marginVertical: -12, marginLeft: "auto" },
  retryT: { ...typography.label14, color: Theme.text.primary, textDecorationLine: "underline" },
});
