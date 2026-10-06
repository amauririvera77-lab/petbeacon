import { ReactNode, useEffect, useRef } from "react";
import { Keyboard, KeyboardAvoidingView, Platform, ScrollView, StyleProp, TextInput, View, ViewStyle } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useKeyboardVisible } from "../../hooks/useKeyboardVisible";
import { Theme } from "../../theme/tokens";

// Margen que se deja por encima/debajo del campo enfocado al traerlo a la vista.
const FOCUS_MARGIN = 16;

// Layout compartido por el onboarding y los flujos de Report lost / Report a sighting (prototipo):
//   encabezado → contenido (mide lo que ocupa; hace scroll solo si no cabe) → CTA justo debajo.
// El CTA NO se ancla al fondo: va a `margin-top: 32` del contenido, con `padding: 0 24 32` (+ safe area inferior).
// Con el teclado abierto el KeyboardAvoidingView sube el CTA hasta el teclado y el ScrollView se encoge (flexShrink 1, el de RN): el
// contenido sigue desplazándose sin cerrar el teclado. Para que tape lo menos posible, el CTA pierde el margen y la safe area inferior
// (quedan debajo del teclado), y el campo enfocado se trae a la vista si quedó detrás del CTA.
export function ScreenLayout({ header, children, cta, contentStyle }: {
  header?: ReactNode; children: ReactNode; cta?: ReactNode; contentStyle?: StyleProp<ViewStyle>;
}) {
  const insets = useSafeAreaInsets();
  const keyboard = useKeyboardVisible();
  const scrollRef = useRef<ScrollView>(null);
  const offset = useRef(0);
  const viewport = useRef(0);

  // Trae el TextInput enfocado a la vista. Se llama al abrirse el teclado (iOS lo vuelve a avisar al pasar de un campo a otro) y cuando
  // el ScrollView cambia de alto (el KeyboardAvoidingView acaba de encogerlo).
  const revealFocused = () => {
    const input = TextInput.State.currentlyFocusedInput();
    // getInnerViewRef existe en RN (ScrollView.js) pero falta en sus tipos .d.ts; measureLayout necesita la instancia, no el número.
    const inner = (scrollRef.current as unknown as { getInnerViewRef?: () => Parameters<TextInput["measureLayout"]>[0] | null } | null)?.getInnerViewRef?.();
    if (!input || !inner || !viewport.current) return;
    input.measureLayout(inner, (_x, y, _w, h) => {
      const top = y - FOCUS_MARGIN;
      const bottom = y + h + FOCUS_MARGIN;
      let to: number | null = null;
      if (bottom > offset.current + viewport.current) to = Math.min(top, bottom - viewport.current);
      else if (top < offset.current) to = top;
      if (to !== null) scrollRef.current?.scrollTo({ y: Math.max(0, to), animated: true });
    }, () => {});
  };

  useEffect(() => {
    const sub = Keyboard.addListener("keyboardDidShow", () => requestAnimationFrame(revealFocused));
    return () => sub.remove();
  }, []);

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Theme.surface.card, paddingTop: insets.top }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      {header}
      {/* flexGrow 0 (en RN el ScrollView crece por defecto): el contenido no se estira y el CTA queda pegado debajo. */}
      <ScrollView ref={scrollRef} style={{ flexGrow: 0 }} contentContainerStyle={contentStyle} keyboardShouldPersistTaps="handled" bounces={false}
        scrollEventThrottle={16} onScroll={(e) => { offset.current = e.nativeEvent.contentOffset.y; }}
        onLayout={(e) => {
          const h = e.nativeEvent.layout.height;
          const shrank = viewport.current > 0 && h < viewport.current;
          viewport.current = h;
          if (shrank) revealFocused();
        }}>
        {children}
      </ScrollView>
      {cta ? <View style={keyboard ? { marginTop: 12, paddingHorizontal: 24, paddingBottom: 12 } : { marginTop: 32, paddingHorizontal: 24, paddingBottom: 32 + insets.bottom }}>{cta}</View> : null}
    </KeyboardAvoidingView>
  );
}
