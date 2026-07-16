// components/ui/ListItem.tsx
// Generic row: icon chip + title/desc + optional right-side control (switch, chevron, text).
// Reused for automation switches, settings rows, notifications, and log entries.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/theme';

const ICON_BG: Record<string, { bg: string; fg: string }> = {
  green: { bg: colors.iconBgGreen, fg: colors.iconGreen },
  blue: { bg: colors.iconBgBlue, fg: colors.iconBlue },
  amber: { bg: colors.iconBgAmber, fg: colors.iconAmber },
};

export default function ListItem({
  icon,
  iconBg = 'green',
  title,
  desc,
  right,
  noBorder = false,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  iconBg?: 'green' | 'blue' | 'amber';
  title: string;
  desc?: string;
  right?: React.ReactNode;
  noBorder?: boolean;
}) {
  const chip = ICON_BG[iconBg];
  return (
    <View style={[styles.row, !noBorder && styles.borderBottom]}>
      <View style={[styles.iconWrap, { backgroundColor: chip.bg }]}>
        <Ionicons name={icon} size={18} color={chip.fg} />
      </View>
      <View style={styles.textStack}>
        <Text style={styles.title}>{title}</Text>
        {desc ? <Text style={styles.desc}>{desc}</Text> : null}
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  borderBottom: { borderBottomWidth: 1, borderBottomColor: colors.divider },
  iconWrap: {
    width: 36,
    height: 36,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  textStack: { flex: 1 },
  title: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  desc: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
