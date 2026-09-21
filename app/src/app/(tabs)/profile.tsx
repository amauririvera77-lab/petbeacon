import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useSession } from "../../state/session";
export default function Profile() {
  const { name, city } = useSession();
  return (
    <TabScreen title={name || "Profile"} subtitle={city}>
      <Placeholder text="Alert radius, notifications, pets, Help and FAQ, Log out — Phase 7." />
    </TabScreen>
  );
}
