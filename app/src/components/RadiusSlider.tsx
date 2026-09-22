import { useMemo, useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { C, font } from "../theme/tokens";

const MIN = 1;
const MAX = 10;
const THUMB = 28;

// Slider propio (PanResponder, sin módulo nativo) — evita depender de una lib incompatible con Expo Go.
export function RadiusSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [trackWidth, setTrackWidth] = useState(0);
  const usable = Math.max(trackWidth - THUMB, 1);

  const setFromX = (x: number) => {
    const ratio = Math.min(1, Math.max(0, x / usable));
    const raw = MIN + ratio * (MAX - MIN);
    onChange(Math.round(raw));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderGrant: (e) => setFromX(e.nativeEvent.locationX - THUMB / 2),
      onPanResponderMove: (e) => setFromX(e.nativeEvent.locationX - THUMB / 2),
    })
  ).current;

  const left = useMemo(() => ((value - MIN) / (MAX - MIN)) * usable, [value, usable]);

  return (
    <View>
      <View
        accessibilityRole="adjustable"
        accessibilityLabel="Alert radius"
        accessibilityValue={{ min: MIN, max: MAX, now: value, text: `${value} mi` }}
        onLayout={(e) => setTrackWidth(e.nativeEvent.layout.width)}
        style={styles.track}
        {...pan.panHandlers}
      >
        <View style={[styles.fill, { width: left + THUMB / 2 }]} />
        <View style={[styles.thumb, { left }]} />
      </View>
      <View style={styles.labels}>
        <Text style={styles.labelT}>{MIN} mi</Text>
        <Text style={styles.value}>{value} mi</Text>
        <Text style={styles.labelT}>{MAX} mi</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  track: { height: THUMB, justifyContent: "center", backgroundColor: C.border, borderRadius: THUMB / 2 },
  fill: { position: "absolute", left: 0, height: THUMB, backgroundColor: C.teal, borderRadius: THUMB / 2 },
  thumb: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: C.white, borderWidth: 2, borderColor: C.teal },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 6 },
  labelT: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  value: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
});
