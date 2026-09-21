import { Redirect } from "expo-router";
import { useSession } from "../state/session";

export default function Entry() {
  const { hydrated, onboarded } = useSession();
  if (!hydrated) return null;
  return <Redirect href={onboarded ? "/(tabs)" : "/(onboarding)"} />;
}
