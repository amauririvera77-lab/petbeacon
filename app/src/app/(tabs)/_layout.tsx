import { Tabs } from "expo-router";
import { View } from "react-native";
import { FloatingTabBar } from "../../components/FloatingTabBar";
import { usePushNotifications } from "../../hooks/usePushNotifications";
import { useSyncRadius } from "../../hooks/useSyncRadius";

// Tab bar flotante con Report integrado en el centro (v1.1, components/FloatingTabBar.tsx): 4 pestañas + el botón Report.
// El título de cada pestaña (options.title) es la etiqueta de la barra; el ícono sale de FloatingTabBar según la ruta.
export default function TabsLayout() {
  useSyncRadius();
  usePushNotifications();
  return (
    <View style={{ flex: 1 }}>
        <Tabs tabBar={(props) => <FloatingTabBar {...props} />} screenOptions={{ headerShown: false }}>
          <Tabs.Screen name="index" options={{ title: "Home" }} />
          <Tabs.Screen name="reports" options={{ title: "My Reports" }} />
          <Tabs.Screen name="support" options={{ title: "Support" }} />
          <Tabs.Screen name="profile" options={{ title: "Profile" }} />
        </Tabs>
    </View>
  );
}
