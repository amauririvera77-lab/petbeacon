import { X } from "lucide-react-native";
import { useEffect, useState } from "react";
import { KeyboardAvoidingView, Modal, Platform, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { confirmLogin, confirmSaveAccount, isEmail, startLogin, startSaveAccount } from "../../lib/authAccount";
import { C, MIN_HIT, font, radius } from "../../theme/tokens";

// Correo + código de verificación de 6 dígitos, sin contraseña.
//   mode "save":  convierte la cuenta anónima en permanente con ese correo ("Save your account").
//   mode "login": entra en una cuenta ya guardada.
export function SaveAccountSheet({ visible, mode, onClose, onDone }: { visible: boolean; mode: "save" | "login"; onClose: () => void; onDone: (email: string) => void }) {
  const insets = useSafeAreaInsets();
  const [step, setStep] = useState<"email" | "code">("email");
  const [email, setEmail] = useState("");
  const [code, setCode] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => { if (visible) { setStep("email"); setCode(""); setError(null); } }, [visible]);

  const save = mode === "save";
  const run = async (fn: () => Promise<void>, next?: () => void) => {
    setBusy(true); setError(null);
    try { await fn(); next?.(); } catch (e) { setError(e instanceof Error ? e.message : "Something went wrong."); } finally { setBusy(false); }
  };
  const send = () => {
    if (!isEmail(email)) { setError("Enter a valid email address."); return; }
    run(() => (save ? startSaveAccount(email) : startLogin(email)), () => { setStep("code"); setCode(""); });
  };
  const verify = () => {
    if (code.trim().length < 6) { setError("Enter the 6-digit code from the email."); return; }
    run(() => (save ? confirmSaveAccount(email, code) : confirmLogin(email, code)), () => onDone(email.trim().toLowerCase()));
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <Pressable style={styles.scrim} onPress={onClose} accessibilityLabel="Close" />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handleWrap}><View style={styles.handle} /></View>
          <View style={styles.head}>
            <Text style={styles.title} accessibilityRole="header">{save ? "Save Your Account" : "Log In"}</Text>
            <Pressable accessibilityRole="button" accessibilityLabel="Close" onPress={onClose} style={styles.close}><X size={16} color={C.slate700} /></Pressable>
          </View>
          <View style={styles.body}>
            {step === "email" ? (
              <>
                <Text style={styles.msg}>{save
                  ? "Add your email to keep your reports and pets, and to get back to them from any device. We'll send you a 6-digit code — no password needed."
                  : "Enter the email you saved your account with and we'll send you a 6-digit code."}</Text>
                <TextInput value={email} onChangeText={(t) => { setEmail(t); setError(null); }} placeholder="you@email.com" placeholderTextColor={C.slate500}
                  keyboardType="email-address" autoCapitalize="none" autoCorrect={false} autoComplete="email" autoFocus accessibilityLabel="Email" style={styles.input} />
              </>
            ) : (
              <>
                <Text style={styles.msg}>Enter the 6-digit code we sent to {email.trim().toLowerCase()}.</Text>
                <TextInput value={code} onChangeText={(t) => { setCode(t.replace(/\D/g, "").slice(0, 8)); setError(null); }} placeholder="123456" placeholderTextColor={C.slate500}
                  keyboardType="number-pad" autoFocus textContentType="oneTimeCode" accessibilityLabel="Verification code" style={[styles.input, styles.code]} />
              </>
            )}
            {error ? <Text style={styles.err} accessibilityRole="alert">{error}</Text> : null}
            <Pressable accessibilityRole="button" disabled={busy} onPress={step === "email" ? send : verify} style={[styles.primary, busy && { opacity: 0.6 }]}>
              <Text style={styles.primaryT}>{busy ? "Please wait…" : step === "email" ? "Send code" : save ? "Save account" : "Log in"}</Text>
            </Pressable>
            {step === "code" ? (
              <View style={styles.links}>
                <Pressable accessibilityRole="button" disabled={busy} onPress={send} style={styles.link}><Text style={styles.linkT}>Resend code</Text></Pressable>
                <Pressable accessibilityRole="button" onPress={() => { setStep("email"); setError(null); }} style={styles.link}><Text style={styles.linkT}>Use a different email</Text></Pressable>
              </View>
            ) : null}
          </View>
        </View>
      </KeyboardAvoidingView>
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
  body: { paddingHorizontal: 20, gap: 12, paddingBottom: 8 },
  msg: { fontFamily: font.bodyRegular, fontSize: 15, lineHeight: 22, color: C.slate700 },
  input: { minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, paddingHorizontal: 14, fontFamily: font.body, fontSize: 16, color: C.ink },
  code: { fontFamily: font.bodyBold, fontSize: 22, letterSpacing: 6, textAlign: "center" },
  err: { fontFamily: font.bodySemi, fontSize: 13, color: C.sosDark },
  primary: { height: 52, borderRadius: radius.md, backgroundColor: C.ink, alignItems: "center", justifyContent: "center" },
  primaryT: { fontFamily: font.bodyBold, fontSize: 16, color: C.white },
  links: { flexDirection: "row", justifyContent: "space-between" },
  link: { minHeight: MIN_HIT, justifyContent: "center" },
  linkT: { fontFamily: font.bodyBold, fontSize: 14, color: C.slate700, textDecorationLine: "underline" },
});
