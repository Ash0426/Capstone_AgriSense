// system logs
import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { getLogs } from '../api/endpoints';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import Badge, { BadgeStatus } from '../components/ui/Badge';
import Button from '../components/ui/Button';

const TABS = [
  { key: 'tempHumidity', label: 'Temp & Humidity' },
  { key: 'soil', label: 'Soil Moisture' },
  { key: 'valve', label: 'Watering' },
  { key: 'lifecycle', label: 'Lifecycle' },
] as const;

type TabKey = (typeof TABS)[number]['key'];
type Row = Record<string, string>;

export default function SystemLogsScreen() {
  const [tab, setTab] = useState<TabKey>('tempHumidity');
  const [tempHumidity, setTempHumidity] = useState<Row[]>([]);
  const [soil, setSoil] = useState<Row[]>([]);
  const [valve, setValve] = useState<Row[]>([]);
  const { lifecycleLogs } = useFarmData();

  const load = useCallback(async () => {
    try {
      const [th, s, v] = await Promise.all([getLogs('temp-humidity'), getLogs('soil'), getLogs('valve')]);
      setTempHumidity(th);
      setSoil(s);
      setValve(v);
    } catch (err) {
      console.warn('Failed to load system logs:', err);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
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
            <Text style={[styles.tabBtnText, tab === t.key && styles.tabBtnTextActive]} numberOfLines={1}>{t.label}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      <ScrollView contentContainerStyle={styles.scroll}>
        <Card>
          {tab === 'tempHumidity' &&
            (tempHumidity.length ? (
              tempHumidity.map((row, i) => (
                <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.status}>
                  <Text style={styles.cellMain}>{row.temp}</Text>
                  <Text style={styles.cellSub}>{row.humidity} humidity</Text>
                </LogRow>
              ))
            ) : (
              <EmptyRow />
            ))}
          {tab === 'soil' &&
            (soil.length ? (
              soil.map((row, i) => (
                <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.status}>
                  <Text style={styles.cellMain}>{row.moisture}</Text>
                </LogRow>
              ))
            ) : (
              <EmptyRow />
            ))}
          {tab === 'valve' &&
            (valve.length ? (
              valve.map((row, i) => (
                <LogRow key={i} time={row.time} statusType={row.statusType as BadgeStatus} statusLabel={row.action} by={row.by}>
                  <Text style={styles.cellSub}>{row.reason}</Text>
                </LogRow>
              ))
            ) : (
              <EmptyRow />
            ))}
          {tab === 'lifecycle' &&
            (lifecycleLogs.length ? (
              lifecycleLogs.map((row, i) => (
                <LogRow key={i} time={row.time} statusType={row.statusType} statusLabel={row.statusType === 'ok' ? 'Normal' : row.statusType === 'warn' ? 'Watch' : 'Alert'}>
                  <Text style={styles.cellMain}>{row.action}</Text>
                </LogRow>
              ))
            ) : (
              <EmptyRow />
            ))}

          <View style={styles.downloadWrap}>
            <Button label="Download as CSV" variant="outline" onPress={() => {}} />
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

function EmptyRow() {
  return (
    <View style={styles.emptyRow}>
      <Text style={styles.emptyText}>No records yet.</Text>
    </View>
  );
}

function LogRow({
  time,
  statusType,
  statusLabel,
  by,
  children,
}: {
  time: string;
  statusType: BadgeStatus;
  statusLabel: string;
  by?: string;
  children: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={{ flex: 1 }}>
        <Text style={styles.cellTime}>{time}</Text>
        {children}
        {by ? <Text style={styles.cellBy}>by {by}</Text> : null}
      </View>
      <Badge label={statusLabel} status={statusType} />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  tabBarScroll: { flexGrow: 0, marginBottom: spacing.sm },
  tabBar: { flexDirection: 'row', gap: spacing.sm, paddingHorizontal: spacing.lg, paddingBottom: spacing.sm },
  tabBtn: {
    flexShrink: 0, minHeight: 40, justifyContent: 'center', paddingHorizontal: spacing.lg, paddingVertical: 10, borderRadius: radius.pill,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.border,
  },
  tabBtnActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  tabBtnText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, lineHeight: 16 },
  tabBtnTextActive: { color: colors.white },
  scroll: { padding: spacing.lg, paddingTop: 0, paddingBottom: 40 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: spacing.lg, paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  cellTime: { fontSize: 12, color: colors.textMuted, marginBottom: 2 },
  cellMain: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  cellSub: { fontSize: 12, color: colors.textBody, marginTop: 2 },
  cellBy: { fontSize: 10, color: colors.textMuted, marginTop: 2, fontStyle: 'italic' },
  downloadWrap: { padding: spacing.lg },
  emptyRow: { padding: spacing.xl, alignItems: 'center' },
  emptyText: { fontSize: 13, color: colors.textMuted },
});
