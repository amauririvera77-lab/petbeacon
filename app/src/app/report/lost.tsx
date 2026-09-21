import { router } from "expo-router";
import { Placeholder, TabScreen } from "../../components/TabScreen";
import { Primary } from "../../components/Primary";
import { View } from "react-native";
export default function Report_lost() {
  return (
    <TabScreen title="Report lost pet">
      <Placeholder text="Multi-step flow with geocoding and validation — Phase 5." />
      <View style={{ marginTop: 16 }}><Primary label="Close" onPress={() => router.back()} /></View>
    </TabScreen>
  );
}
