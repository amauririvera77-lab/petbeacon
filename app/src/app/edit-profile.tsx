import { router, useNavigation } from "expo-router";
import { ChevronLeft } from "lucide-react-native";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Avatar } from "../components/account/Avatar";
import { Primary } from "../components/Primary";
import { TextField } from "../components/TextField";
import { ensureAccount } from "../lib/account";
import { isEmail } from "../lib/authAccount";
import { uploadPhoto } from "../lib/photos";
import { choosePhotoSource, pickPhoto } from "../lib/pickPhoto";
import { supabase } from "../lib/supabase";
import { validateContact } from "../lib/validation";
import { useSession } from "../state/session";
import { C, MIN_HIT, font } from "../theme/tokens";

type Form = { name: string; email: string; phone: string; photoUri: string | null; photoUrl: string | null };

// Edit profile: nombre, foto y datos de CONTACTO del perfil (privados). El correo de inicio de sesión no se edita aquí: se gestiona
// desde "Save your account". "Save changes" solo se activa con cambios y, al salir con cambios sin guardar, se pregunta "Discard changes?".
export default function EditProfile() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { name: sName, city, alertRadiusMi, home, avatarUrl, update } = useSession();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [f, setF] = useState<Form>({ name: sName, email: "", phone: "", photoUri: null, photoUrl: avatarUrl });
  const [initial, setInitial] = useState<Form>(f);
  const [errors, setErrors] = useState<{ email?: string; phone?: string }>({});
  const set = (p: Partial<Form>) => setF((x) => ({ ...x, ...p }));

  useEffect(() => {
    (async () => {
      const base: Form = { name: sName, email: "", phone: "", photoUri: null, photoUrl: avatarUrl };
      if (supabase) {
        const { data: s } = await supabase.auth.getSession();
        if (s.session) {
          const { data } = await supabase.from("profiles").select("contact_email,contact_phone,avatar_url").eq("id", s.session.user.id).maybeSingle();
          if (data) { base.email = data.contact_email ?? ""; base.phone = data.contact_phone ?? ""; base.photoUrl = data.avatar_url ?? avatarUrl; }
        }
      }
      setF(base); setInitial(base); setLoading(false);
    })();
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  const dirty = JSON.stringify(f) !== JSON.stringify(initial);
  const dirtyRef = useRef(false); dirtyRef.current = dirty;
  const allowExit = useRef(false);
  useEffect(() => navigation.addListener("beforeRemove", (e) => {
    if (!dirtyRef.current || allowExit.current) return;
    e.preventDefault();
    Alert.alert("Discard changes?", "You have changes that haven't been saved.", [
      { text: "Keep editing", style: "cancel" },
      { text: "Discard", style: "destructive", onPress: () => { allowExit.current = true; navigation.dispatch(e.data.action); } },
    ]);
  }), [navigation]);

  const changePhoto = () => choosePhotoSource(async (src) => { const u = await pickPhoto(src); if (u) set({ photoUri: u }); });

  const save = async () => {
    const next: typeof errors = {};
    const email = f.email.trim();
    if (email && !isEmail(email)) next.email = "That email doesn't look right.";
    let phone: string | null = null;
    if (f.phone.trim()) {
      const r = validateContact(f.phone, { required: false });
      if (!r.ok || r.kind !== "phone") next.phone = "Enter a valid phone number, like (201) 555-0100.";
      else phone = r.value;
    }
    setErrors(next);
    if (next.email || next.phone || !f.name.trim()) return;
    setSaving(true);
    try {
      const uid = await ensureAccount({ name: f.name.trim(), city, alertRadiusMi, home });
      const photo = f.photoUri ? await uploadPhoto(uid, f.photoUri) : f.photoUrl;
      const { error } = await supabase!.from("profiles").update({ name: f.name.trim(), avatar_url: photo, contact_email: email ? email.toLowerCase() : null, contact_phone: phone }).eq("id", uid);
      if (error) throw new Error(error.message);
      update({ name: f.name.trim(), avatarUrl: photo });
      allowExit.current = true;
      router.back();
    } catch (e) {
      Alert.alert("Couldn't save", e instanceof Error ? e.message : "Something went wrong.");
    } finally { setSaving(false); }
  };

  const shown = f.photoUri ?? f.photoUrl;
  return (
    <KeyboardAvoidingView style={styles.root} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={[styles.top, { paddingTop: Math.max(insets.top, 12) }]}>
        <Pressable accessibilityRole="button" accessibilityLabel="Back" onPress={() => router.back()} style={styles.back}><ChevronLeft size={26} color={C.ink} /></Pressable>
        <Text style={styles.h} accessibilityRole="header">Edit profile</Text>
      </View>
      {loading ? <View style={styles.center}><ActivityIndicator color={C.teal} /></View> : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 20, paddingBottom: insets.bottom + 32 }} keyboardShouldPersistTaps="handled">
          <View style={{ alignItems: "center", gap: 6 }}>
            <Avatar uri={shown} name={f.name} size={96} />
            <Pressable accessibilityRole="button" onPress={changePhoto} style={styles.link}><Text style={styles.linkT}>{shown ? "Change photo" : "Add photo"}</Text></Pressable>
            {shown ? <Pressable accessibilityRole="button" onPress={() => set({ photoUri: null, photoUrl: null })} style={styles.link}><Text style={[styles.linkT, { color: C.slate500 }]}>Remove photo</Text></Pressable> : null}
          </View>
          <TextField label="Name" placeholder="Your name" value={f.name} onChangeText={(name) => set({ name })} autoCapitalize="words" />
          <View style={{ gap: 12 }}>
            <Text style={styles.note}>Contact details are private. They're only used to reach you about a pet, and they're never shown in the app to other people. Your login email is managed in "Save your account".</Text>
            <TextField label="Contact email (optional)" placeholder="you@email.com" value={f.email} onChangeText={(email) => { set({ email }); setErrors((e) => ({ ...e, email: undefined })); }}
              keyboardType="email-address" autoCapitalize="none" autoCorrect={false} helper={errors.email} />
            <TextField label="Contact phone (optional)" placeholder="(201) 555-0100" value={f.phone} onChangeText={(phone) => { set({ phone }); setErrors((e) => ({ ...e, phone: undefined })); }}
              keyboardType="phone-pad" helper={errors.phone} />
          </View>
          <Primary label={saving ? "Saving…" : "Save changes"} onPress={save} disabled={saving || !dirty || !f.name.trim()} />
        </ScrollView>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: C.white },
  top: { flexDirection: "row", alignItems: "center", gap: 4, paddingHorizontal: 8, paddingBottom: 8, borderBottomWidth: 1, borderBottomColor: C.border },
  back: { width: MIN_HIT, height: MIN_HIT, alignItems: "center", justifyContent: "center" },
  h: { fontFamily: font.displayMedium, fontSize: 22, color: C.ink },
  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  link: { minHeight: MIN_HIT, justifyContent: "center", paddingHorizontal: 12 },
  linkT: { fontFamily: font.bodyBold, fontSize: 14, color: C.ink, textDecorationLine: "underline" },
  note: { fontFamily: font.bodyRegular, fontSize: 13, lineHeight: 19, color: C.slate700 },
});
