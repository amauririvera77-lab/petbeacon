import { ClipboardList, HeartHandshake, House, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExtendedFab } from "../../components/ExtendedFab";
import { TabBarButton } from "../../components/TabBarButton";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useSyncRadius } from "../../hooks/useSyncRadius";
import { FabProvider } from "../../state/fab";
import { Theme } from "../../theme/tokens";

const TAB_HEIGHT = 56;

// 4 ítems; pestaña activa = cápsula brand.tint detrás del ícono + texto brand.primary (componente "TabBar" de Figma),
// no solo color — sin tratamiento especial para Support (CLAUDE.md §7). Botón custom en TabBarButton.tsx.
export default function TabsLayout() {
  const insets = useSafeAreaInsets();
  useSyncRadius();
  usePushNotifications();
  const barHeight = TAB_HEIGHT + insets.bottom;
  return (
    <FabProvider>
    <View style={{ flex: 1 }}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarStyle: { height: barHeight, paddingTop: 6, borderTopColor: Theme.border.default, backgroundColor: Theme.surface.card },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarButton: (props) => <TabBarButton {...props} Icon={House} label="Home" /> }} />
        <Tabs.Screen name="reports" options={{ title: "My Reports", tabBarButton: (props) => <TabBarButton {...props} Icon={ClipboardList} label="My Reports" /> }} />
        <Tabs.Screen name="support" options={{ title: "Support", tabBarButton: (props) => <TabBarButton {...props} Icon={HeartHandshake} label="Support" /> }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarButton: (props) => <TabBarButton {...props} Icon={User} label="Profile" /> }} />
      </Tabs>
      <ExtendedFab bottom={barHeight + 16} />
    </View>
    </FabProvider>
  );
}
