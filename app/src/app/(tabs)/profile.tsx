import { StyleSheet, Text, View } from "react-native";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { RadiusSlider } from "../../components/RadiusSlider";
import { useSession } from "../../state/session";
import { C, font } from "../../theme/tokens";

export default function Profile() {
  const { name, city, alertRadiusMi, update } = useSession();
  return (
    <TabScreen title={name || "Profile"} subtitle={city}>
      <View style={styles.section}>
        <Text style={styles.h}>Alert radius</Text>
        <Text style={styles.s}>Notify me about activity within</Text>
        <View style={{ marginTop: 12 }}>
          <RadiusSlider value={alertRadiusMi} onChange={(alertRadiusMi) => update({ alertRadiusMi })} />
        </View>
      </View>
      <Placeholder text="Notifications, pets, Help and FAQ, Log out — Phase 7." />
    </TabScreen>
  );
}
const styles = StyleSheet.create({
  section: { marginTop: 16, padding: 16, borderRadius: 16, borderWidth: 1, borderColor: C.border, gap: 2 },
  h: { fontFamily: font.head, fontSize: 16, color: C.ink },
  s: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
});
