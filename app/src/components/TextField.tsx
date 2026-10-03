import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { Theme, radius } from "../theme/tokens";
import { typography } from "../theme/typography";

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
          placeholderTextColor={Theme.text.muted}
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
      <Text style={styles.label}>{label}{labelSuffix ? <Text style={styles.suffix}> {labelSuffix}</Text> : null}</Text>
      <TextInput
        {...rest}
        editable={!disabled}
        accessibilityLabel={label}
        placeholderTextColor={Theme.text.muted}
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
  label: { ...typography.label14, color: Theme.text.secondary },
  suffix: { color: Theme.text.muted }, // mismo estilo que la etiqueta (Label/14), solo cambia el color
  input: {
    minHeight: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong,
    backgroundColor: Theme.surface.card, paddingHorizontal: 14, ...typography.bodyLg16, color: Theme.text.primary,
  },
  focus: { borderColor: Theme.brand.primary },
  disabled: { backgroundColor: Theme.surface.page, color: Theme.text.muted },
  helper: { ...typography.bodySm13, color: Theme.text.muted },
});

const v = StyleSheet.create({
  dsLabel: { ...typography.label13, color: Theme.text.primary },
  dsInput: { minHeight: 46, borderRadius: radius.md, borderWidth: 1, borderColor: Theme.border.default, backgroundColor: Theme.surface.card, paddingHorizontal: 14, ...typography.bodyLg16, color: Theme.text.primary },
  dsMulti: { minHeight: 90, paddingVertical: 12, textAlignVertical: "top" },
  formLabel: { ...typography.label14, color: Theme.text.secondary, marginBottom: 8 },
  formInput: { height: 52, borderRadius: radius.md, borderWidth: 1.5, borderColor: Theme.border.strong, backgroundColor: Theme.surface.card, paddingHorizontal: 16, ...typography.bodyLg16, color: Theme.text.primary },
  formMulti: { height: 88, paddingVertical: 12, lineHeight: 24, textAlignVertical: "top" },
  suffix: { color: Theme.text.muted }, // mismo estilo que la etiqueta (Label/14), solo cambia el color
  hint: { ...typography.caption12, color: Theme.text.muted, marginTop: 6 },
  focus: { borderColor: Theme.brand.primary },
  errBorder: { borderColor: Theme.danger.border },
  errT: { color: Theme.danger.text },
  disabled: { backgroundColor: Theme.surface.page, color: Theme.text.muted },
});
