// app/hardware-settings.tsx
// Every value the ESP32 follows that isn't a watering limit or the weekly schedule:
//   * Sensor calibration — the raw readings for 0% and 100%, with "Use current" buttons so
//     you can calibrate by holding the sensor dry / in water. No re-uploading the sketch.
//   * Tank minimum and rain threshold
//   * Roof: Auto/Manual, when auto closes it, and the servo's open/closed angles
//   * How often the board sends readings
// All saved on the server (routes/device.js -> hardware_settings table).
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import { HardwareSettings } from '../api/endpoints';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';

type NumKey = { [K in keyof HardwareSettings]: HardwareSettings[K] extends number ? K : never }[keyof HardwareSettings];

export default function HardwareSettingsScreen() {
  const { hardwareSettings } = useFarmData();

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <ScreenHeader title="Hardware Settings" subtitle="What the sensors, valve and roof follow" showBack />
        {hardwareSettings ? <SettingsForm initial={hardwareSettings} /> : <Text style={styles.explainer}>Loading…</Text>}
      </ScrollView>
    </SafeAreaView>
  );
}

function SettingsForm({ initial }: { initial: HardwareSettings }) {
  const { saveHardwareSettings, deviceStatus, reading, switches, setRoof } = useFarmData();

  // Text inputs hold strings so the farmer can type freely; converted on Save.
  const [form, setForm] = useState<Record<NumKey, string>>(() => {
    const out = {} as Record<NumKey, string>;
    (Object.keys(initial) as (keyof HardwareSettings)[]).forEach((k) => {
      if (typeof initial[k] === 'number') out[k as NumKey] = String(initial[k]);
    });
    return out;
  });
  const [roofMode, setRoofMode] = useState(initial.roofMode);
  const [roofCloseOnRain, setRoofCloseOnRain] = useState(initial.roofCloseOnRain);
  const [saving, setSaving] = useState<string | null>(null);

  const setField = (k: NumKey, v: string) => setForm((prev) => ({ ...prev, [k]: v }));

  const save = async (section: string, keys: NumKey[], extra: Partial<HardwareSettings> = {}) => {
    const updates: Partial<HardwareSettings> = { ...extra };
    for (const k of keys) {
      const n = Number(form[k]);
      if (form[k].trim() === '' || !Number.isFinite(n)) {
        Alert.alert('Check the numbers', `Please enter a number for every field in ${section}.`);
        return;
      }
      (updates as Record<string, number>)[k] = n;
    }
    setSaving(section);
    try {
      await saveHardwareSettings(updates);
      Alert.alert('Saved', `${section} updated. The hardware follows it from the next reading.`);
    } catch (err) {
      Alert.alert('Not saved', err instanceof Error ? err.message : 'Request failed');
    } finally {
      setSaving(null);
    }
  };

  const raw = deviceStatus?.raw;

  return (
    <>
      {/* ---------- Sensor calibration ---------- */}
      <Card style={styles.section}>
        <PanelHeader title="Sensor Calibration" subtitle="Raw reading at 0% and at 100%" />
        <View style={styles.body}>
          <Text style={styles.explainer}>
            Hold the sensor dry and tap the first “Use current”, then put it in water and tap the second. Wait about 30 seconds
            between them so a new reading arrives. Then tap Save.
          </Text>

          <CalibrationRow
            title="Soil moisture"
            live={raw?.soil}
            percent={reading?.soilMoisture}
            zeroLabel="Dry (0%)"
            fullLabel="Wet (100%)"
            zeroValue={form.soilDryRaw}
            fullValue={form.soilWetRaw}
            onZero={(v) => setField('soilDryRaw', v)}
            onFull={(v) => setField('soilWetRaw', v)}
          />
          <Button label="Save soil calibration" loading={saving === 'Soil calibration'} onPress={() => save('Soil calibration', ['soilDryRaw', 'soilWetRaw'])} />

          <View style={styles.divider} />

          <CalibrationRow
            title="Water tank level"
            live={raw?.water}
            percent={reading?.waterLevel}
            zeroLabel="Empty (0%)"
            fullLabel="Full (100%)"
            zeroValue={form.waterEmptyRaw}
            fullValue={form.waterFullRaw}
            onZero={(v) => setField('waterEmptyRaw', v)}
            onFull={(v) => setField('waterFullRaw', v)}
          />
          <Button label="Save tank calibration" loading={saving === 'Tank calibration'} onPress={() => save('Tank calibration', ['waterEmptyRaw', 'waterFullRaw'])} />

          <View style={styles.divider} />

          <CalibrationRow
            title="Rain sensor"
            live={raw?.rain}
            percent={reading?.rain}
            zeroLabel="Dry (0%)"
            fullLabel="Soaked (100%)"
            zeroValue={form.rainDryRaw}
            fullValue={form.rainWetRaw}
            onZero={(v) => setField('rainDryRaw', v)}
            onFull={(v) => setField('rainWetRaw', v)}
          />
          <Button label="Save rain calibration" loading={saving === 'Rain calibration'} onPress={() => save('Rain calibration', ['rainDryRaw', 'rainWetRaw'])} />
        </View>
      </Card>

      {/* ---------- Tank + rain rules ---------- */}
      <Card style={styles.section}>
        <PanelHeader title="Water & Rain Rules" />
        <View style={styles.body}>
          <NumberField
            label="Minimum tank level (%)"
            help="Below this, no watering runs (scheduled, automatic or Water now) and you get a refill alert."
            value={form.tankMinLevel}
            onChange={(v) => setField('tankMinLevel', v)}
          />
          <NumberField
            label="Rain threshold (%)"
            help="The rain sensor at or above this counts as raining — used to skip scheduled watering and to close the roof."
            value={form.rainThreshold}
            onChange={(v) => setField('rainThreshold', v)}
          />
          <NumberField
            label="Send readings every (seconds)"
            help="How often the ESP32 reports its sensors. 5 to 3600."
            value={form.sensorIntervalSec}
            onChange={(v) => setField('sensorIntervalSec', v)}
          />
          <Button
            label="Save water & rain rules"
            loading={saving === 'Water & rain rules'}
            onPress={() => save('Water & rain rules', ['tankMinLevel', 'rainThreshold', 'sensorIntervalSec'])}
          />
        </View>
      </Card>

      {/* ---------- Roof / servo ---------- */}
      <Card style={styles.section}>
        <PanelHeader title="Roof (Servo)" subtitle={switches ? (switches.roof ? 'Currently open' : 'Currently closed') : undefined} />
        <View style={styles.body}>
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Automatic roof</Text>
              <Text style={styles.help}>
                {roofMode === 'auto'
                  ? 'The roof closes when it is too hot or raining (rules below) and reopens when conditions are normal.'
                  : 'The roof only moves when you open or close it.'}
              </Text>
            </View>
            <ToggleSwitch value={roofMode === 'auto'} onValueChange={(on) => setRoofMode(on ? 'auto' : 'manual')} />
          </View>

          <NumberField
            label="Close the roof above (°C)"
            help="Automatic mode only. Needs a temperature sensor."
            value={form.roofCloseTemp}
            onChange={(v) => setField('roofCloseTemp', v)}
          />
          <View style={styles.toggleRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Close the roof when raining</Text>
              <Text style={styles.help}>Automatic mode only. Needs the rain sensor.</Text>
            </View>
            <ToggleSwitch value={roofCloseOnRain} onValueChange={setRoofCloseOnRain} />
          </View>

          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <NumberField label="Open angle (°)" value={form.servoOpenAngle} onChange={(v) => setField('servoOpenAngle', v)} />
            </View>
            <View style={{ flex: 1 }}>
              <NumberField label="Closed angle (°)" value={form.servoClosedAngle} onChange={(v) => setField('servoClosedAngle', v)} />
            </View>
          </View>
          <Text style={styles.help}>0 to 180. The servo moves once to this angle, then its signal turns off.</Text>

          <Button
            label="Save roof settings"
            loading={saving === 'Roof settings'}
            style={{ marginTop: spacing.md }}
            onPress={() =>
              save('Roof settings', ['roofCloseTemp', 'servoOpenAngle', 'servoClosedAngle'], { roofMode, roofCloseOnRain })
            }
          />

          <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Test the servo</Text>
          <Text style={styles.help}>Moves the roof now (switches the roof to Manual). Save the angles first.</Text>
          <View style={styles.twoCol}>
            <View style={{ flex: 1 }}>
              <Button label="Open" variant="outline" onPress={() => setRoof(true).then(() => setRoofMode('manual')).catch((e) => Alert.alert('Roof', String(e?.message ?? e)))} />
            </View>
            <View style={{ flex: 1 }}>
              <Button label="Close" variant="outline" onPress={() => setRoof(false).then(() => setRoofMode('manual')).catch((e) => Alert.alert('Roof', String(e?.message ?? e)))} />
            </View>
          </View>
        </View>
      </Card>
    </>
  );
}

function NumberField({ label, help, value, onChange }: { label: string; help?: string; value: string; onChange: (v: string) => void }) {
  return (
    <View style={styles.field}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {help ? <Text style={styles.help}>{help}</Text> : null}
      <TextInput style={styles.input} value={value} onChangeText={onChange} keyboardType="numbers-and-punctuation" />
    </View>
  );
}

function CalibrationRow({
  title, live, percent, zeroLabel, fullLabel, zeroValue, fullValue, onZero, onFull,
}: {
  title: string;
  live: number | null | undefined;
  percent: number | null | undefined;
  zeroLabel: string;
  fullLabel: string;
  zeroValue: string;
  fullValue: string;
  onZero: (v: string) => void;
  onFull: (v: string) => void;
}) {
  const hasLive = live != null;
  return (
    <View style={styles.field}>
      <View style={styles.toggleRow}>
        <Text style={[styles.fieldLabel, { flex: 1 }]}>{title}</Text>
        <Badge label={hasLive ? `Live raw ${live}${percent != null ? ` → ${percent}%` : ''}` : 'No reading yet'} status={hasLive ? 'ok' : 'warn'} />
      </View>
      <View style={styles.twoCol}>
        <View style={{ flex: 1 }}>
          <Text style={styles.help}>{zeroLabel}</Text>
          <TextInput style={styles.input} value={zeroValue} onChangeText={onZero} keyboardType="number-pad" />
          <TouchableOpacity disabled={!hasLive} onPress={() => onZero(String(live))}>
            <Text style={[styles.link, !hasLive && styles.linkDisabled]}>Use current</Text>
          </TouchableOpacity>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.help}>{fullLabel}</Text>
          <TextInput style={styles.input} value={fullValue} onChangeText={onFull} keyboardType="number-pad" />
          <TouchableOpacity disabled={!hasLive} onPress={() => onFull(String(live))}>
            <Text style={[styles.link, !hasLive && styles.linkDisabled]}>Use current</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  body: { padding: spacing.lg },
  explainer: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  field: { marginBottom: spacing.md },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 4 },
  help: { fontSize: 11, color: colors.textSecondary, lineHeight: 15, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
  twoCol: { flexDirection: 'row', gap: spacing.md },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginBottom: spacing.md },
  link: { fontSize: 12, fontWeight: '600', color: colors.mint, marginTop: 6 },
  linkDisabled: { color: colors.textMuted },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg },
});
