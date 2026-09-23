import { useRef, useState } from "react";
import { PanResponder, StyleSheet, Text, View } from "react-native";
import { C, MIN_HIT, font } from "../theme/tokens";

const MIN = 1;
const MAX = 10;
const THUMB = 28;

// Slider propio (PanResponder, sin módulo nativo) — evita depender de una lib incompatible con Expo Go.
// El PanResponder se crea una sola vez, así que lee ancho/posición/onChange desde refs (no desde el render)
// y usa coordenadas de pantalla (pageX), que no cambian de referencia al tocar el thumb como locationX.
export function RadiusSlider({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  const [width, setWidth] = useState(0);
  const trackRef = useRef<View>(null);
  const widthRef = useRef(0);
  const leftRef = useRef(0);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  const setFromPageX = (pageX: number) => {
    const usable = Math.max(widthRef.current - THUMB, 1);
    const ratio = Math.min(1, Math.max(0, (pageX - leftRef.current - THUMB / 2) / usable));
    onChangeRef.current(Math.round(MIN + ratio * (MAX - MIN)));
  };

  const pan = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      onPanResponderTerminationRequest: () => false, // que el ScrollView no robe el gesto
      onPanResponderGrant: (e) => {
        const pageX = e.nativeEvent.pageX;
        trackRef.current?.measureInWindow((x) => {
          leftRef.current = x;
          setFromPageX(pageX);
        });
      },
      onPanResponderMove: (_e, g) => setFromPageX(g.moveX),
    })
  ).current;

  const usable = Math.max(width - THUMB, 1);
  const left = ((value - MIN) / (MAX - MIN)) * usable;

  return (
    <View>
      <View
        accessible
        accessibilityRole="adjustable"
        accessibilityLabel="Alert radius"
        accessibilityValue={{ min: MIN, max: MAX, now: value, text: `${value} mi` }}
        accessibilityActions={[{ name: "increment" }, { name: "decrement" }]}
        onAccessibilityAction={(e) => {
          const d = e.nativeEvent.actionName === "increment" ? 1 : -1;
          onChange(Math.min(MAX, Math.max(MIN, value + d)));
        }}
        style={styles.hit}
        {...pan.panHandlers}
      >
        <View
          ref={trackRef}
          pointerEvents="none"
          style={styles.track}
          onLayout={(e) => {
            widthRef.current = e.nativeEvent.layout.width;
            setWidth(e.nativeEvent.layout.width);
          }}
        >
          <View style={[styles.fill, { width: left + THUMB / 2 }]} />
          <View style={[styles.thumb, { left }]} />
        </View>
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
  hit: { height: MIN_HIT, justifyContent: "center" }, // zona táctil de 44px alrededor del track de 28px
  track: { height: THUMB, justifyContent: "center", backgroundColor: C.border, borderRadius: THUMB / 2 },
  fill: { position: "absolute", left: 0, height: THUMB, backgroundColor: C.teal, borderRadius: THUMB / 2 },
  thumb: { position: "absolute", width: THUMB, height: THUMB, borderRadius: THUMB / 2, backgroundColor: C.white, borderWidth: 2, borderColor: C.teal },
  labels: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  labelT: { fontFamily: font.bodyRegular, fontSize: 12, color: C.slate500 },
  value: { fontFamily: font.bodyBold, fontSize: 13, color: C.ink },
});
