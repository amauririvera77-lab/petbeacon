import { StyleSheet, Text, View } from "react-native";
import { C, font } from "../theme/tokens";
import { Toggle } from "./Toggle";

export function ToggleRow({ title, subtitle, value, onChange, note }: {
  title: string; subtitle: string; value: boolean; onChange: (v: boolean) => void; note?: string;
}) {
  return (
    <View>
      <View style={styles.row}>
        <View style={{ flex: 1 }}>
          <Text style={styles.t}>{title}</Text>
          <Text style={styles.s}>{subtitle}</Text>
        </View>
        <Toggle value={value} onValueChange={onChange} label={title} />
      </View>
      {note ? <Text style={styles.note}>{note}</Text> : null}
    </View>
  );
}
const styles = StyleSheet.create({
  row: { flexDirection: "row", alignItems: "center", gap: 12 },
  t: { fontFamily: font.bodySemi, fontSize: 15, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
  note: { fontFamily: font.bodyRegular, fontSize: 12, color: C.sosDark, marginTop: 4 },
});
