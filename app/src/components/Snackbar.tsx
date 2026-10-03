import { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme, FAB_SIZE, MIN_HIT, radius } from "../theme/tokens";
import { elevation } from "../theme/elevation";
import { typography } from "../theme/typography";

type Opts = { message: string; actionLabel?: string; onAction?: () => void; duration?: number };
const Ctx = createContext<{ show: (o: Opts) => void } | null>(null);

// Snackbar global (~5 s por defecto) con acción, p. ej. "Match dismissed · Undo". Se coloca sobre el tab bar y el FAB.
export function SnackbarProvider({ children }: { children: ReactNode }) {
  const insets = useSafeAreaInsets();
  const [opts, setOpts] = useState<Opts | null>(null);
  const opacity = useRef(new Animated.Value(0)).current;
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const hide = useCallback(() => {
    Animated.timing(opacity, { toValue: 0, duration: 160, useNativeDriver: true }).start(() => setOpts(null));
  }, [opacity]);

  const show = useCallback((o: Opts) => {
    if (timer.current) clearTimeout(timer.current);
    setOpts(o);
    Animated.timing(opacity, { toValue: 1, duration: 160, useNativeDriver: true }).start();
    timer.current = setTimeout(hide, o.duration ?? 5000);
  }, [hide, opacity]);

  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  const value = useMemo(() => ({ show }), [show]);

  return (
    <Ctx.Provider value={value}>
      {children}
      {opts ? (
        <Animated.View pointerEvents="box-none" style={[styles.wrap, { opacity, bottom: insets.bottom + 56 + 16 + FAB_SIZE + 12 }]}>
          <View style={styles.bar} accessibilityRole="alert" accessibilityLiveRegion="polite">
            <Text style={styles.msg}>{opts.message}</Text>
            {opts.actionLabel ? (
              <Pressable accessibilityRole="button" onPress={() => { if (timer.current) clearTimeout(timer.current); opts.onAction?.(); hide(); }} style={styles.action}>
                <Text style={styles.actionT}>{opts.actionLabel}</Text>
              </Pressable>
            ) : null}
          </View>
        </Animated.View>
      ) : null}
    </Ctx.Provider>
  );
}

export function useSnackbar() {
  const v = useContext(Ctx);
  if (!v) throw new Error("useSnackbar must be used inside SnackbarProvider");
  return v;
}

const styles = StyleSheet.create({
  wrap: { position: "absolute", left: 16, right: 16, zIndex: 200 },
  bar: { minHeight: 48, flexDirection: "row", alignItems: "center", justifyContent: "space-between", gap: 12, paddingLeft: 16, paddingRight: 4, borderRadius: radius.md, backgroundColor: Theme.surface.inverse, ...elevation[2] },
  msg: { flex: 1, ...typography.label14, color: Theme.text.onAccent },
  action: { minHeight: MIN_HIT, paddingHorizontal: 14, justifyContent: "center" },
  actionT: { ...typography.label14, color: Theme.text.onAccent, textDecorationLine: "underline" },
});
