import { useState } from "react";
import { StyleSheet, Text, TextInput, TextInputProps, View } from "react-native";
import { C, font, radius } from "../theme/tokens";

type Props = TextInputProps & { label: string; helper?: string; disabled?: boolean };

export function TextField({ label, helper, disabled, style, ...rest }: Props) {
  const [focused, setFocused] = useState(false);
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
