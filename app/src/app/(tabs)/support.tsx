import { Placeholder, TabScreen } from "../../components/TabScreen";
import { useSession } from "../../state/session";
export default function Support() {
  const { city } = useSession();
  return (
    <TabScreen title="Support and care" subtitle={`Local resources near ${city || "White Plains, NY"}`}>
      <Placeholder text="Search, category filter and 8 resources — Phase 7." />
    </TabScreen>
  );
}
