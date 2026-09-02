// components/ui/MetricCard.tsx
// One of the 4 sensor-reading cards at the top of the dashboard (temp, humidity, soil, rain).
// All four share the same mint accent bar — an `icon` differentiates each card instead of color.
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/theme';
import Badge, { BadgeStatus } from './Badge';
import Card from './Card';

export default function MetricCard({
  label,
  value,
  unit,
  status,
  statusLabel,
  footer,
  icon,
}: {
  label: string;
  value: string | number;
  unit?: string;
  status: BadgeStatus;
  statusLabel: string;
  footer: string;
  icon: keyof typeof Ionicons.glyphMap;
}) {
  return (
    <Card style={styles.card}>
      <View style={styles.bar} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <View style={styles.labelRow}>
            <View style={styles.iconChip}>
              <Ionicons name={icon} size={14} color={colors.mint} />
            </View>
            <Text style={styles.label} numberOfLines={1}>{label}</Text>
          </View>
          <Badge label={statusLabel} status={status} />
        </View>
        <Text style={styles.value}>
          {value}
          {unit ? <Text style={styles.unit}> {unit}</Text> : null}
        </Text>
        <Text style={styles.footer}>{footer}</Text>
      </View>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: { flexBasis: '48%', flexGrow: 1, marginBottom: spacing.md },
  bar: { height: 4, width: '100%', backgroundColor: colors.mint },
  body: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', alignItems: 'center', rowGap: 4, marginBottom: 8 },
  labelRow: { flexDirection: 'row', alignItems: 'center', flexShrink: 1, marginRight: 6, gap: 6 },
  iconChip: {
    width: 22, height: 22, borderRadius: radius.pill, backgroundColor: colors.iconBgGreen,
    alignItems: 'center', justifyContent: 'center',
  },
  label: { flexShrink: 1, fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  unit: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  footer: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
