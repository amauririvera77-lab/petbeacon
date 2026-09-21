import NetInfo from "@react-native-community/netinfo";
import { WifiOff } from "lucide-react-native";
import { useEffect, useState } from "react";
import { StyleSheet, Text, View } from "react-native";
import { C, font } from "../theme/tokens";

// Estado offline real (CLAUDE.md §5.6): NetInfo es el equivalente nativo de navigator.onLine + eventos online/offline.
export function useOffline() {
  const [offline, setOffline] = useState(false);
  useEffect(() => {
    return NetInfo.addEventListener((s) => setOffline(s.isConnected === false || s.isInternetReachable === false));
  }, []);
  return offline;
}

export function OfflineBanner() {
  if (!useOffline()) return null;
  return (
    <View style={styles.b} accessibilityRole="alert">
      <WifiOff size={16} color={C.slate700} />
      <Text style={styles.t}>You're offline — showing the last synced data.</Text>
    </View>
  );
}
const styles = StyleSheet.create({
  b: { flexDirection: "row", alignItems: "center", gap: 8, backgroundColor: C.border, paddingHorizontal: 16, paddingVertical: 10 },
  t: { fontFamily: font.bodySemi, fontSize: 13, color: C.slate700, flexShrink: 1 },
});
