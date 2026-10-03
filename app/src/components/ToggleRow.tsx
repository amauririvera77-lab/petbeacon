import { StyleSheet, View } from "react-native";
import { AppText } from "./AppText";
import { Theme } from "../theme/tokens";
import { typography } from "../theme/typography";
import { Toggle } from "./Toggle";

export function ToggleRow({ title, subtitle, value, onChange, note }: {
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void; note?: string;
}) {
  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <AppText style={styles.t}>{title}</AppText>
          <AppText style={styles.s}>{subtitle}</AppText>
        </View>
        <Toggle value={value} onValueChange={onChange} label={title} />
      </View>
      {note ? <AppText style={styles.note}>{note}</AppText> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  // Título de fila: Heading/16; subtítulo: Body/14 text/secondary (Fase 10 de congelación — antes Label/14 y
  // Body-Sm/13 text/muted, para que "Nearby alerts" comparta estilo con "Edit profile" y las preguntas del FAQ).
  t: { ...typography.heading16, color: Theme.text.primary },
  s: { ...typography.body14, color: Theme.text.secondary },
  note: { ...typography.caption12, color: Theme.danger.text, marginTop: 4 },
});
