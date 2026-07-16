// components/ui/Badge.tsx
// Small status pill used for "Too Hot", "Normal", "Dry" etc. Edit colors in one place here.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { colors, radius } from '../../constants/theme';

export type BadgeStatus = 'ok' | 'warn' | 'danger';

const STYLES: Record<BadgeStatus, { bg: string; text: string }> = {
  ok: { bg: colors.okBg, text: colors.okText },
  warn: { bg: colors.warnBg, text: colors.warnText },
  danger: { bg: colors.dangerBg, text: colors.dangerText },
};

export default function Badge({ label, status }: { label: string; status: BadgeStatus }) {
  const s = STYLES[status];
  return (
    <View style={[styles.badge, { backgroundColor: s.bg }]}>
      <Text style={[styles.text, { color: s.text }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: radius.sm,
    alignSelf: 'flex-start',
  },
  text: { fontSize: 11, fontWeight: '600' },
});
