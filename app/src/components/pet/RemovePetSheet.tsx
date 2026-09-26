import { Heart, UserMinus, X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { Modal, Pressable, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

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
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
          </View>

          {step === "choose" ? (
            <View style={styles.body}>
              <Pressable accessibilityRole="button" accessibilityState={{ disabled: hasActiveReport }} disabled={hasActiveReport} onPress={() => setStep("removed")}
                style={({ pressed }) => [styles.option, hasActiveReport && { opacity: 0.5 }, pressed && { backgroundColor: C.surface }]}>
                <UserMinus size={20} color={C.ink} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.optT}>Remove from my profile</Text>
                  <Text style={styles.optS}>{hasActiveReport ? `${name} has an active Lost report. Mark it as reunited first.` : `${name} will no longer appear in your pets.`}</Text>
                </View>
              </Pressable>
              <Pressable accessibilityRole="button" onPress={() => setStep("passed_away")} style={({ pressed }) => [styles.option, pressed && { backgroundColor: C.surface }]}>
                <Heart size={20} color={C.ink} />
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
              <Pressable accessibilityRole="button" disabled={busy} onPress={() => onConfirm(step)} style={[styles.primary, busy && { opacity: 0.6 }]}>
                <Text style={styles.primaryT}>{busy ? "Removing…" : step === "passed_away" ? "Remove from my pets" : "Remove"}</Text>
              </Pressable>
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
  scrim: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, backgroundColor: "rgba(15,23,42,0.5)" },
  sheet: { backgroundColor: C.white, borderTopLeftRadius: 24, borderTopRightRadius: 24 },
  handleWrap: { alignItems: "center", paddingTop: 12, paddingBottom: 4 },
  handle: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.border },
  head: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 20, paddingBottom: 8 },
  title: { flex: 1, fontFamily: font.head, fontSize: 18, color: C.ink },
  close: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  body: { paddingHorizontal: 20, paddingBottom: 8, gap: 10 },
  option: { flexDirection: "row", alignItems: "center", gap: 14, padding: 16, borderRadius: radius.lg, borderWidth: 1, borderColor: C.border },
  optT: { fontFamily: font.bodyBold, fontSize: 15, color: C.ink },
  optS: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 18, color: C.slate700, marginTop: 2 },
  msg: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: C.slate700, paddingVertical: 4 },
  primary: { height: 52, borderRadius: radius.md, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  primaryT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
  secondary: { minHeight: MIN_HIT, alignItems: "center", justifyContent: "center" },
  secondaryT: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
});
