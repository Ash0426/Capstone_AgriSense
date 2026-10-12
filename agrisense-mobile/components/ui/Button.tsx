// button (primary, outline, danger)
import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius } from '../../constants/theme';

type Variant = 'primary' | 'outline' | 'danger';

export default function Button({
  label,
  onPress,
  variant = 'primary',
  disabled = false,
  loading = false,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: Variant;
  disabled?: boolean;
  loading?: boolean;
  style?: ViewStyle;
}) {
  const isDisabled = disabled || loading;

  if (variant === 'primary') {
    return (
      <TouchableOpacity
        onPress={onPress}
        disabled={isDisabled}
        activeOpacity={0.8}
        style={[styles.touchable, isDisabled && styles.disabled, style]}
      >
        <LinearGradient colors={colors.mintGradient} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.base}>
          {loading ? <ActivityIndicator color={colors.white} /> : <Text style={[styles.text, { color: colors.white }]}>{label}</Text>}
        </LinearGradient>
      </TouchableOpacity>
    );
  }

  const variantStyle = styles[variant];
  const textColor = variant === 'outline' ? colors.mint : colors.white;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, variantStyle, isDisabled && styles.disabled, style]}
    >
      {loading ? (
        <ActivityIndicator color={textColor} />
      ) : (
        <Text style={[styles.text, { color: textColor }]}>{label}</Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  touchable: { width: '100%', borderRadius: radius.md, overflow: 'hidden' },
  base: {
    paddingVertical: 12,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  danger: { backgroundColor: colors.danger },
  outline: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.mint },
  disabled: { opacity: 0.5 },
  text: { fontSize: 14, fontWeight: '600' },
});
