// components/ui/MetricCard.tsx
// One of the 4 sensor-reading cards at the top of the dashboard (temp, humidity, soil, rain).
import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
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
  barColor,
}: {
  label: string;
  value: string | number;
  unit?: string;
  status: BadgeStatus;
  statusLabel: string;
  footer: string;
  barColor: string;
}) {
  return (
    <Card style={styles.card}>
      <View style={[styles.bar, { backgroundColor: barColor }]} />
      <View style={styles.body}>
        <View style={styles.headerRow}>
          <Text style={styles.label}>{label}</Text>
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
  bar: { height: 4, width: '100%' },
  body: { padding: spacing.lg },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  label: { fontSize: 12, color: colors.textSecondary, fontWeight: '500' },
  value: { fontSize: 26, fontWeight: '700', color: colors.textPrimary, letterSpacing: -0.5 },
  unit: { fontSize: 14, fontWeight: '400', color: colors.textMuted },
  footer: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
});
