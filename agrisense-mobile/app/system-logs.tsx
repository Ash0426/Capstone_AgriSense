// app/system-logs.tsx
// Historical logs: temp/humidity, soil moisture, watering events, roof events.
// Replace `systemLogs` in data/mockData.ts with rows from your SQLite tables.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { systemLogs } from '../data/mockData';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import Badge, { BadgeStatus } from '../components/ui/Badge';
import Button from '../components/ui/Button';

const TABS = [
  { key: 'tempHumidity', label: 'Temp & Humidity' },
  { key: 'soil', label: 'Soil Moisture' },
  { key: 'valve', label: 'Watering' },
  { key: 'roof', label: 'Roof' },
] as const;

type TabKey = (typeof TABS)[number]['key'];

export default function SystemLogsScreen() {
  const [tab, setTab] = useState<TabKey>('tempHumidity');

  return (
    <View style={styles.flex}>
      <View style={styles.headerPad}>
        <ScreenHeader title="System Logs" subtitle="Past sensor readings and activity records" showBack />
      </View>

      <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tabBarScroll} contentContainerStyle={styles.tabBar}>
        {TABS.map((t) => (
          <TouchableOpacity
            key={t.key}
            onPress={() => setTab(t.key)}
            style={[styles.tabBtn, tab === t.key && styles.tabBtnActive]}
          >
            <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          {tab === 'tempHumidity' &&
            systemLogs.tempHumidity.map((row, i) => (
              <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.status}>
                <Text style={styles.cellMain}>{row.temp}</Text>
                <Text style={styles.cellSub}>{row.humidity} humidity</Text>
              </LogRow>
            ))}
          {tab === 'soil' &&
            systemLogs.soil.map((row, i) => (
              <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.status}>
                <Text style={styles.cellMain}>{row.moisture}</Text>
              </LogRow>
            ))}
          {tab === 'valve' &&
            systemLogs.valve.map((row, i) => (
              <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.action}>
                <Text style={styles.cellSub}>{row.reason}</Text>
              </LogRow>
            ))}
          {tab === 'roof' &&
            systemLogs.roof.map((row, i) => (
              <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.action}>
                <Text style={styles.cellMain}>{row.tempGauge}</Text>
              </LogRow>
            ))}

          <View style={styles.downloadWrap}>
            <Button label="Download as CSV" variant="outline" onPress={() => {}} />
          </View>
        </Card>
      </ScrollView>
    </View>
  );
}

function LogRow({
  time,
  statusType,
  statusLabel,
  children,
}: {
  time: string;
  statusType: BadgeStatus;
  statusLabel: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cellTime}>{time}</Text>
        {children}
      </View>
      <Badge label={statusLabel} status={statusType} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabBarScroll: { flexGrow: 0, paddingHorizontal: spacing.lg, marginBottom: spacing.sm },
  tabBar: { gap: spacing.sm, paddingBottom: spacing.sm },
  tabBtn: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border },
  tabBtnActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  tabBtnTextActive: { color: colors.white },
  scroll: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cellTime: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  cellMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cellSub: { fontSize: 12, color: colors.textBody, marginTop: 2 },
  downloadWrap: { padding: spacing.lg },
});
