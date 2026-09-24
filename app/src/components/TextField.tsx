import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

// variant:
//  - "default": el estilo actual (pantallas fuera del rediseño).
//  - "ds": TextField del sistema del prototipo (onboarding y campos con hint): etiqueta 13, campo 46 px, fuente 14, borde 1.
//  - "form": campos de los formularios de reporte: etiqueta 13/700, campo 52 px, fuente 16, borde 1.5; multilínea 88 px.
type Props = TextInputProps & { label: string; helper?: string; disabled?: boolean; variant?: "default" | "ds" | "form"; labelSuffix?: string; error?: string };

export function TextField({ label, helper, disabled, style, variant = "default", labelSuffix, error, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
  if (variant !== "default") {
    const ds = variant === "ds";
    return (
      <View style={{ gap: ds ? 6 : 0 }}>
        <Text style={ds ? v.dsLabel : v.formLabel}>{label}{labelSuffix ? <Text style={v.suffix}> {labelSuffix}</Text> : null}</Text>
        <TextInput
          {...rest}
          editable={!disabled}
          accessibilityLabel={label}
          placeholderTextColor={C.slate500}
          onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
          onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
          style={[ds ? v.dsInput : v.formInput, rest.multiline && (ds ? v.dsMulti : v.formMulti), focused && v.focus, !!error && v.errBorder, disabled && v.disabled, style]}
        />
        {error ? <Text style={[v.hint, v.errT]} accessibilityRole="alert">{error}</Text> : helper ? <Text style={v.hint}>{helper}</Text> : null}
      </View>
    );
  }
  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        {...rest}
        editable={!disabled}
        accessibilityLabel={label}
        placeholderTextColor={C.slate500}
        onFocus={(e) => { setFocused(true); rest.onFocus?.(e); }}
        onBlur={(e) => { setFocused(false); rest.onBlur?.(e); }}
        style={[styles.input, focused && styles.focus, disabled && styles.disabled, style]}
      />
      {helper ? <Text style={styles.helper}>{helper}</Text> : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: { gap: 6 },
  label: { fontFamily: font.bodySemi, fontSize: 14, color: C.slate700 },
  input: {
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2,
    backgroundColor: C.white, paddingHorizontal: 14, fontFamily: font.body, fontSize: 16, color: C.ink,
  },
  focus: { borderColor: C.teal },
  disabled: { backgroundColor: C.surface, color: C.slate500 },
  helper: { fontFamily: font.bodyRegular, fontSize: 13, color: C.slate500 },
});

const v = StyleSheet.create({
  dsLabel: { fontFamily: font.bodySemi, fontSize: 13, lineHeight: 18, color: C.ink },
  dsInput: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: C.border, backgroundColor: C.white, paddingHorizontal: 14, fontFamily: font.body, fontSize: 14, color: C.ink },
  dsMulti: { minHeight: 90, paddingVertical: 12, textAlignVertical: "top" },
  formLabel: { fontFamily: font.bodyBold, fontSize: 13, color: C.slate700, marginBottom: 8 },
  formInput: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: C.border2, backgroundColor: C.white, paddingHorizontal: 16, fontFamily: font.body, fontSize: 16, color: C.ink },
  formMulti: { height: 88, paddingVertical: 12, lineHeight: 24, textAlignVertical: "top" },
  suffix: { fontFamily: font.body, color: C.slate500 },
  hint: { fontFamily: font.bodyRegular, fontSize: 12, lineHeight: 17, color: C.slate500, marginTop: 6 },
  focus: { borderColor: C.ink },
  errBorder: { borderColor: C.sosDark },
  errT: { color: C.sosDark },
  disabled: { backgroundColor: C.surface, color: C.slate500 },
});
