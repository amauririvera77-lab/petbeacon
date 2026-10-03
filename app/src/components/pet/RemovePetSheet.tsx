import { Heart, UserMinus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Theme, MIN_HIT, radius } from "../../theme/tokens";
import { elevation } from "../../theme/elevation";
import { typography } from "../../theme/typography";
import { Button } from "../Button";

type Reason = "removed" | "passed_away";

// Retirar una mascota (Pet profile 2.6). Dos caminos, ninguno usa la palabra "delete":
//  · "Remove from my profile": confirmación simple. No está disponible con un Lost activo (primero hay que cerrarlo).
//  · "My pet passed away": tono cuidadoso. Si hay un reporte activo se cierra sin enviar alertas ni mensajes de celebración.
export function RemovePetSheet({ visible, petName, hasActiveReport, busy, onClose, onConfirm }: {
  visible: boolean; petName: string; hasActiveReport: boolean; busy?: boolean; onClose: () => void; onConfirm: (reason: Reason) => void;
}) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"choose" | Reason>("choose");
  useEffect(() => { if (visible) setStep("choose"); }, [visible]);
  const name = petName.trim() || "your pet";

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <View style={styles.root}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">{step === "choose" ? `Remove ${name}` : step === "passed_away" ? "We're so sorry" : `Remove ${name}?`}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={Theme.text.secondary} /></Pressable>
          </View>

          {step === "choose" ? (
            <View style={styles.body}>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: hasActiveReport }} disabled={hasActiveReport} onPress={() => setStep("removed")}
                style={({ pressed }) => [styles.option, hasActiveReport && { opacity: 0.5 }, pressed && { backgroundColor: Theme.surface.page }]}>
                <UserMinus size={20} color={Theme.text.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optT}>Remove from my profile</Text>
                  <Text style={styles.optS}>{hasActiveReport ? `${name} has an active Lost report. Mark it as reunited first.` : `${name} will no longer appear in your pets.`}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setStep("passed_away")} style={({ pressed }) => [styles.option, pressed && { backgroundColor: Theme.surface.page }]}>
                <Heart size={20} color={Theme.text.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optT}>My pet passed away</Text>
                  <Text style={styles.optS}>We'll take care of everything for you.</Text>
                </View>
              </Pressable>
            </View>
          ) : (
            <View style={styles.body}>
              <Text style={styles.msg}>
                {step === "passed_away"
                  ? `${name} will be removed from your active pets.${hasActiveReport ? " Their active report will be closed, and we won't send any alerts." : ""}`
                  : `${name} will no longer appear in your pets. Reports you already published stay in your history.`}
              </Text>
              {step === "removed" ? (
                // Destructiva de verdad (Fase 2 de congelación): danger.bg, igual criterio que "Delete account".
                <Pressable accessibilityRole="button" disabled={busy} onPress={() => onConfirm(step)} style={[styles.danger, busy && { opacity: 0.6 }]}>
                  <Text style={styles.dangerT}>{busy ? "Removing…" : "Remove"}</Text>
                </Pressable>
              ) : (
                // "My pet passed away": momento de duelo, no una acción destructiva — botón secundario, nunca rojo.
                <Button variant="secondary" label={busy ? "Removing…" : "Remove from my pets"} disabled={busy} onPress={() => onConfirm(step)} />
              )}
              <Pressable accessibilityRole="button" onPress={() => setStep("choose")} style={styles.secondary}><Text style={styles.secondaryT}>Back</Text></Pressable>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, justifyContent: "flex-end" },
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: Theme.scrim(0.5) },
  sheet: { backgroundColor: Theme.surface.card, borderTopLeftRadius: 24, borderTopRightRadius: 24, ...elevation[3] },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: Theme.border.default },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  title: { flex: 1, ...typography.heading18, color: Theme.text.primary },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: Theme.border.default },
  optT: { ...typography.label14, color: Theme.text.primary },
  optS: { ...typography.bodySm13, color: Theme.text.secondary, marginTop: 2 },
  msg: { ...typography.bodyLg16, color: Theme.text.secondary, paddingVertical: 4 },
  danger: { height: 52, borderRadius: radius.md, backgroundColor: Theme.danger.bg, alignItems: "center", justifyContent: "center" },
  dangerT: { ...typography.button16, color: Theme.text.onAccent },
  secondary: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  secondaryT: { ...typography.button14, color: Theme.text.secondary },
});
