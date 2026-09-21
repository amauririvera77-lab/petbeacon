// 1 · Welcome

import { router } from "expo-router";
import { StyleSheet, View } from "react-native";
import { Button } from "../../components/Button";
import { Logo } from "../../components/Logo";
import { Heading, OnboardingScreen, Sub } from "../../components/Screen";
import { LinkButton } from "../../components/Primary";
import { Intent, useSession } from "../../state/session";

export default function Welcome() {
  const { update } = useSession();
  const pick = (intent: Intent) => {
    update({ intent });
    router.push("/signup");
  };
  return (
    <OnboardingScreen
      footer={
        <>
          <LinkButton label="Just setting up — I'll register my pet now" onPress={() => pick("register")} />
          <LinkButton
            label={"Struggling to care for your pet right now?\nSee local support"}
            onPress={() => router.push("/(tabs)/support")}
          />
        </>
      }
    >
      <View style={styles.logo}><Logo width={150} /></View>
      <Sub>Reunite pets with their people.</Sub>
      <View style={{ height: 24 }} />
      <Heading>What brings you here today?</Heading>
      <View style={styles.btns}>
        <Button label="I lost my pet" variant="primaryLost" onPress={() => pick("lost")} />
        <Button label="I see a pet" variant="primarySighted" onPress={() => pick("seen")} />
      </View>
    </OnboardingScreen>
  );
}

const styles = StyleSheet.create({
  logo: { alignItems: "flex-start", marginBottom: 12, marginLeft: -6 },
  btns: { gap: 12, marginTop: 28 },
});
