// Galería temporal de la Fase 1 — se reemplaza por Welcome/Onboarding en la Fase 2.
import { useState } from "react";
import { ScrollView, StyleSheet, Text, View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { Badge } from "../components/Badge";
import { Button } from "../components/Button";
import { Logo } from "../components/Logo";
import { TextField } from "../components/TextField";
import { Toggle } from "../components/Toggle";
import { C, font } from "../theme/tokens";

export default function Gallery() {
  const insets = useSafeAreaInsets();
  const [on, setOn] = useState(true);
  return (
    <ScrollView contentContainerStyle={[styles.c, { paddingTop: insets.top + 16, paddingBottom: insets.bottom + 24 }]}>
      <Logo width={180} />
      <Text style={styles.h}>Component gallery</Text>
      <View style={styles.row}><Badge status="lost" /><Badge status="sighted" /><Badge status="reunited" /></View>
      <Button label="I lost my pet" variant="primaryLost" />
      <Button label="I see a pet" variant="primarySighted" />
      <Button label="Secondary" variant="secondary" />
      <Button label="Ghost" variant="ghost" />
      <Button label="Disabled" disabled />
      <TextField label="City or ZIP code" placeholder="White Plains, NY" />
      <TextField label="Disabled" value="Read only" disabled />
      <View style={styles.row}><Text style={styles.body}>Push notifications</Text><Toggle value={on} onValueChange={setOn} label="Push notifications" /></View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  c: { paddingHorizontal: 16, gap: 14 },
  h: { fontFamily: font.display, fontSize: 28, color: C.ink },
  row: { flexDirection: "row", gap: 8, alignItems: "center", justifyContent: "space-between" },
  body: { fontFamily: font.body, fontSize: 16, color: C.ink },
});
