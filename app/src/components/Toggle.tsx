import { Pressable, StyleSheet, View } from "react-native";
import { Theme, MIN_HIT } from "../theme/tokens";

type Props = { value: boolean; onValueChange: (v: boolean) => void; label: string };

// Hit-area de 44px separada del track visual de 32px (fix de accesibilidad, CLAUDE.md §3).
export function Toggle({ value, onValueChange, label }: Props) {
  return (
    <Pressable
      accessibilityRole="switch"
      accessibilityLabel={label}
      accessibilityState={{ checked: value }}
      onPress={() => onValueChange(!value)}
      style={styles.hit}
    >
      <View style={[styles.track, { backgroundColor: value ? Theme.control.trackOn : Theme.control.trackOff }]}>
        <View style={[styles.thumb, value && styles.thumbOn]} />
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  hit: { minWidth: 56, minHeight: MIN_HIT, justifyContent: "center", alignItems: "center" },
  track: { width: 52, height: 32, borderRadius: 16, padding: 3, justifyContent: "center" },
  thumb: { width: 26, height: 26, borderRadius: 13, backgroundColor: Theme.control.knob },
  thumbOn: { alignSelf: "flex-end" },
});
