// app/sensor/[key].tsx
// Sensor detail page, opened by tapping a MetricCard on the Dashboard. Shows a data log of
// "major shifts" in the reading (see the change-detection in FarmDataContext's polling tick)
// and a calibration form — go out of the calibrated min/max range and the Dashboard shows an
// alert banner for this sensor.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';
import { useFarmData } from '../../context/FarmDataContext';
import { sensorMeta, SensorKey } from '../../data/mockData';
import Card from '../../components/ui/Card';
import PanelHeader from '../../components/ui/PanelHeader';
import ScreenHeader from '../../components/ui/ScreenHeader';
import Badge from '../../components/ui/Badge';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

const VALID_KEYS: SensorKey[] = ['heatIndex', 'soilMoisture', 'airTemp', 'waterLevel'];

export default function SensorDetailScreen() {
  const { key: rawKey } = useLocalSearchParams<{ key: string }>();
  const key: SensorKey = VALID_KEYS.includes(rawKey as SensorKey) ? (rawKey as SensorKey) : 'soilMoisture';

  const { sensorValues, sensorLogs, calibration, setCalibration, outOfCalibration } = useFarmData();
  const meta = sensorMeta[key];
  const value = sensorValues[key];
  const cal = calibration[key];
  const isOut = outOfCalibration.includes(key);
  const log = sensorLogs[key];

  const [calibrating, setCalibrating] = useState(false);
  const [minInput, setMinInput] = useState(String(cal.min));
  const [maxInput, setMaxInput] = useState(String(cal.max));
  const [confirmVisible, setConfirmVisible] = useState(false);

  const openCalibrate = () => {
    setMinInput(String(cal.min));
    setMaxInput(String(cal.max));
    setCalibrating(true);
  };

  const confirmSaveCalibration = () => {
    const min = parseFloat(minInput);
    const max = parseFloat(maxInput);
    if (Number.isFinite(min) && Number.isFinite(max) && min < max) {
      setCalibration(key, { min, max });
    }
    setConfirmVisible(false);
    setCalibrating(false);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title={meta.label} subtitle="Data log and calibration" showBack />

        <Card style={styles.section}>
          <View style={styles.panelBody}>
            <View style={styles.valueRow}>
              <Text style={styles.value}>
                {value ?? '—'}
                <Text style={styles.unit}> {meta.unit}</Text>
              </Text>
              <Badge label={isOut ? 'Out of range' : 'Within range'} status={isOut ? 'danger' : 'ok'} />
            </View>
            <Text style={styles.rangeText}>
              Safe range: {cal.min}{meta.unit} – {cal.max}{meta.unit}
            </Text>

            {!calibrating ? (
              <Button label="Calibrate" variant="outline" onPress={openCalibrate} style={{ marginTop: spacing.md }} />
            ) : (
              <View style={styles.calibrateBox}>
                <View style={styles.calibrateRow}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Minimum ({meta.unit})</Text>
                    <TextInput
                      style={styles.input}
                      value={minInput}
                      onChangeText={setMinInput}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.fieldLabel}>Maximum ({meta.unit})</Text>
                    <TextInput
                      style={styles.input}
                      value={maxInput}
                      onChangeText={setMaxInput}
                      keyboardType="numbers-and-punctuation"
                    />
                  </View>
                </View>
                <Text style={styles.calibrateHint}>
                  If the reading goes outside this range, an alert will show above Live Sensor Readings on the Dashboard.
                </Text>
                <Button label="Save Calibration" onPress={() => setConfirmVisible(true)} style={{ marginTop: spacing.md }} />
              </View>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="Data Log" subtitle="Major shifts in this reading" />
          <View style={styles.body}>
            {log.length ? (
              log.map((entry, i) => (
                <View key={i} style={[styles.logRow, i === log.length - 1 && styles.noBorder]}>
                  <Text style={styles.logValue}>{entry.value}{meta.unit}</Text>
                  <Text style={styles.logWhen}>{entry.time} · {entry.date}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No major shifts recorded yet.</Text>
            )}
          </View>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={confirmVisible}
        title="Save calibration?"
        message={`Set the safe range to ${minInput}${meta.unit} – ${maxInput}${meta.unit}.`}
        confirmLabel="Save"
        onConfirm={confirmSaveCalibration}
        onCancel={() => setConfirmVisible(false)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  panelBody: { padding: spacing.lg },
  body: { paddingHorizontal: spacing.lg },
  valueRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  value: { fontSize: 32, fontWeight: '700', color: colors.textPrimary },
  unit: { fontSize: 16, fontWeight: '400', color: colors.textMuted },
  rangeText: { fontSize: 12, color: colors.textSecondary, marginTop: 6 },
  calibrateBox: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider },
  calibrateRow: { flexDirection: 'row', gap: spacing.md },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
  calibrateHint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.md, lineHeight: 16 },
  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  noBorder: { borderBottomWidth: 0 },
  logValue: { fontSize: 15, fontWeight: '600', color: colors.textPrimary },
  logWhen: { fontSize: 12, color: colors.textMuted },
  emptyText: { fontSize: 13, color: colors.textMuted, paddingBottom: spacing.lg },
});
