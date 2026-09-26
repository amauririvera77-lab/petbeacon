import { ClipboardList, HeartHandshake, House, User } from "lucide-react-native";
import { Tabs } from "expo-router";
import { View } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ExtendedFab } from "../../components/ExtendedFab";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useSyncRadius } from "../../hooks/useSyncRadius";
import { FabProvider } from "../../state/fab";
import { C, font } from "../../theme/tokens";

const TAB_HEIGHT = 56;

// 4 ítems; activo = negro (C.teal) en TODOS, sin color especial para Support (CLAUDE.md §7).
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
          tabBarActiveTintColor: C.teal,
          tabBarInactiveTintColor: C.slate500,
          tabBarLabelStyle: { fontFamily: font.bodySemi, fontSize: 11 },
          tabBarStyle: { height: barHeight, paddingTop: 6, borderTopColor: C.border, backgroundColor: C.white },
        }}
      >
        <Tabs.Screen name="index" options={{ title: "Home", tabBarIcon: ({ color }) => <House size={24} color={color} /> }} />
        <Tabs.Screen name="reports" options={{ title: "My Reports", tabBarIcon: ({ color }) => <ClipboardList size={24} color={color} /> }} />
        <Tabs.Screen name="support" options={{ title: "Support", tabBarIcon: ({ color }) => <HeartHandshake size={24} color={color} /> }} />
        <Tabs.Screen name="profile" options={{ title: "Profile", tabBarIcon: ({ color }) => <User size={24} color={color} /> }} />
      </Tabs>
      <ExtendedFab bottom={barHeight + 16} />
    </View>
    </FabProvider>
  );
}
