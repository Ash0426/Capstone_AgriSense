// water automation screen
import React, { useState } from 'react';
import { router } from 'expo-router';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import ListItem from '../components/ui/ListItem';
import ToggleSwitch from '../components/ui/ToggleSwitch';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function AutomationScreen() {
  const {
    reading, predictedWatering, automationLimits, setAutomationLimits, switches, setRoof,
    deviceStatus, waterNow, stopWatering, setSwitchValue, hardwareSettings,
  } = useFarmData();
  const [valveBusy, setValveBusy] = useState(false);

  const runValveAction = async (action: () => Promise<void>) => {
    setValveBusy(true);
    try {
      await action();
    } catch (err) {
      Alert.alert('Valve', err instanceof Error ? err.message : 'Request failed');
    } finally {
      setValveBusy(false);
    }
  };

  const [soilLimitInput, setSoilLimitInput] = useState(String(automationLimits.soilMoistureLimit));
  const [tempLimitInput, setTempLimitInput] = useState(String(automationLimits.tempLimit));
  const [overrideAmountInput, setOverrideAmountInput] = useState(String(automationLimits.overrideAmountLiters));

  // sync inputs with saved limits
  const [shownLimits, setShownLimits] = useState(automationLimits);
  if (shownLimits !== automationLimits) {
    setShownLimits(automationLimits);
    setSoilLimitInput(String(automationLimits.soilMoistureLimit));
    setTempLimitInput(String(automationLimits.tempLimit));
    setOverrideAmountInput(String(automationLimits.overrideAmountLiters));
  }

  const toggleSwitch = (key: 'timer' | 'skipRain', value: boolean) =>
    setSwitchValue(key, value).catch((err) => Alert.alert('Not saved', err instanceof Error ? err.message : 'Request failed'));
  const [soilConfirmVisible, setSoilConfirmVisible] = useState(false);
  const [tempConfirmVisible, setTempConfirmVisible] = useState(false);
  const [overrideAmountConfirmVisible, setOverrideAmountConfirmVisible] = useState(false);

  const [pendingRoofValue, setPendingRoofValue] = useState<boolean | null>(null);
  const [roofConfirmVisible, setRoofConfirmVisible] = useState(false);

  const scheduledDays = predictedWatering.filter((d) => d.watering).length;

  const confirmSaveSoilLimit = () => {
    const value = Math.max(0, Math.min(100, parseInt(soilLimitInput, 10) || automationLimits.soilMoistureLimit));
    setAutomationLimits({ soilMoistureLimit: value });
    setSoilLimitInput(String(value));
    setSoilConfirmVisible(false);
  };

  const confirmSaveTempLimit = () => {
    const value = parseInt(tempLimitInput, 10);
    setAutomationLimits({ tempLimit: Number.isFinite(value) ? value : automationLimits.tempLimit });
    setTempLimitInput(String(Number.isFinite(value) ? value : automationLimits.tempLimit));
    setTempConfirmVisible(false);
  };

  const confirmSaveOverrideAmount = () => {
    const value = parseFloat(overrideAmountInput);
    setAutomationLimits({ overrideAmountLiters: Number.isFinite(value) ? value : automationLimits.overrideAmountLiters });
    setOverrideAmountInput(String(Number.isFinite(value) ? value : automationLimits.overrideAmountLiters));
    setOverrideAmountConfirmVisible(false);
  };

  const requestRoofToggle = (next: boolean) => {
    setPendingRoofValue(next);
    setRoofConfirmVisible(true);
  };

  const confirmRoofToggle = () => {
    if (pendingRoofValue != null) setRoof(pendingRoofValue);
    setRoofConfirmVisible(false);
    setPendingRoofValue(null);
  };

  const soilExceeded = reading != null && reading.soilMoisture < automationLimits.soilMoistureLimit;
  const tempExceeded = reading != null && reading.airTemp > automationLimits.tempLimit;

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
    <ScrollView contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Water Automation" subtitle="Weather-driven watering with limit-based overrides" showBack />

      <Card style={styles.section}>
        <PanelHeader title="Hardware" subtitle="ESP32 controller link" />
        <View style={styles.panelBody}>
          <View style={styles.planRow}>
            <Text style={styles.planDay}>Controller</Text>
            <Badge
              label={deviceStatus ? (deviceStatus.online ? 'Online' : 'Offline') : 'Checking…'}
              status={deviceStatus?.online ? 'ok' : 'danger'}
            />
          </View>
          <View style={[styles.planRow, { borderBottomWidth: 0, marginBottom: spacing.md }]}>
            <Text style={styles.planDay}>Valve</Text>
            <Badge
              label={
                deviceStatus?.valveOpen
                  ? `Watering — ${deviceStatus.valveSecondsLeft}s left`
                  : 'Closed'
              }
              status={deviceStatus?.valveOpen ? 'warn' : 'ok'}
            />
          </View>
          {deviceStatus?.valveOpen ? (
            <Button label="Stop watering" variant="danger" loading={valveBusy} onPress={() => runValveAction(stopWatering)} />
          ) : (
            <Button
              label={`Water now (${automationLimits.overrideAmountLiters}L)`}
              loading={valveBusy}
              onPress={() => runValveAction(() => waterNow())}
            />
          )}
          <Button
            label="Hardware Settings (calibration, tank, roof)"
            variant="outline"
            style={{ marginTop: spacing.md }}
            onPress={() => router.push('/hardware-settings')}
          />
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader title="This Week's Plan" subtitle={`Watering scheduled on ${scheduledDays} of 7 days`} />
        <View style={styles.panelBody}>
          <ListItem
            icon="time"
            iconBg="green"
            title="Run watering schedule"
            desc="Waters at each day's time + amount (edit them on Weekly Weather)"
            right={<ToggleSwitch value={!!switches?.timer} onValueChange={(v) => toggleSwitch('timer', v)} />}
          />
          <ListItem
            icon="rainy"
            iconBg="blue"
            title="Skip when raining"
            desc={`Skips a scheduled watering if the rain sensor reads ${hardwareSettings?.rainThreshold ?? 30}% or more`}
            noBorder
            right={<ToggleSwitch value={!!switches?.skipRain} onValueChange={(v) => toggleSwitch('skipRain', v)} />}
          />
          <View style={{ height: spacing.md }} />
          {predictedWatering.map((d) => (
            <View key={d.day} style={styles.planRow}>
              <Text style={styles.planDay}>{d.day}</Text>
              <Badge label={d.reason} status={d.watering ? 'ok' : 'warn'} />
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader title="Override Limits" subtitle="Watering runs immediately if either limit is crossed" />
        <View style={styles.panelBody}>
          <Text style={styles.explainer}>
            If soil moisture drops below the limit, or temperature rises above it, watering runs regardless of the forecast above.
          </Text>

          <View style={styles.limitRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Soil Moisture Limit (%)</Text>
              {reading && (
                <Badge
                  label={soilExceeded ? `Exceeded — currently ${reading.soilMoisture}%` : `OK — currently ${reading.soilMoisture}%`}
                  status={soilExceeded ? 'danger' : 'ok'}
                />
              )}
            </View>
          </View>
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={soilLimitInput}
              onChangeText={setSoilLimitInput}
              keyboardType="number-pad"
            />
            <View style={styles.saveBtnWrap}>
              <Button label="Save" onPress={() => setSoilConfirmVisible(true)} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.limitRow}>
            <View style={{ flex: 1 }}>
              <Text style={styles.fieldLabel}>Temperature Limit (°C)</Text>
              {reading && (
                <Badge
                  label={tempExceeded ? `Exceeded — currently ${reading.airTemp}°C` : `OK — currently ${reading.airTemp}°C`}
                  status={tempExceeded ? 'danger' : 'ok'}
                />
              )}
            </View>
          </View>
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={tempLimitInput}
              onChangeText={setTempLimitInput}
              keyboardType="number-pad"
            />
            <View style={styles.saveBtnWrap}>
              <Button label="Save" onPress={() => setTempConfirmVisible(true)} />
            </View>
          </View>

          <View style={styles.divider} />

          <View style={styles.limitRow}>
            <Text style={styles.fieldLabel}>Water released on override (Liters)</Text>
            <Text style={styles.explainer}>Used when a limit-triggered watering fires outside the normal daily schedule.</Text>
          </View>
          <View style={styles.editRow}>
            <TextInput
              style={styles.input}
              value={overrideAmountInput}
              onChangeText={setOverrideAmountInput}
              keyboardType="numbers-and-punctuation"
            />
            <View style={styles.saveBtnWrap}>
              <Button label="Save" onPress={() => setOverrideAmountConfirmVisible(true)} />
            </View>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader
          title="Roof"
          subtitle={hardwareSettings?.roofMode === 'auto' ? 'Automatic — follows your roof rules' : 'Manual — moves only when you switch it'}
        />
        <View style={styles.body}>
          <ListItem
            icon="home"
            iconBg="green"
            title="Roof open"
            desc={switches ? (switches.roof ? 'Currently open' : 'Currently closed') : 'Loading…'}
            noBorder
            right={<ToggleSwitch value={!!switches?.roof} onValueChange={requestRoofToggle} />}
          />
        </View>
      </Card>
    </ScrollView>

    <ConfirmModal
      visible={soilConfirmVisible}
      title="Save soil moisture limit?"
      message={`Watering will run immediately if soil moisture drops below ${soilLimitInput}%.`}
      confirmLabel="Save"
      onConfirm={confirmSaveSoilLimit}
      onCancel={() => setSoilConfirmVisible(false)}
    />
    <ConfirmModal
      visible={tempConfirmVisible}
      title="Save temperature limit?"
      message={`Watering will run immediately if temperature rises above ${tempLimitInput}°C.`}
      confirmLabel="Save"
      onConfirm={confirmSaveTempLimit}
      onCancel={() => setTempConfirmVisible(false)}
    />
    <ConfirmModal
      visible={overrideAmountConfirmVisible}
      title="Save override amount?"
      message={`A limit-triggered watering will release ${overrideAmountInput}L.`}
      confirmLabel="Save"
      onConfirm={confirmSaveOverrideAmount}
      onCancel={() => setOverrideAmountConfirmVisible(false)}
    />
    <ConfirmModal
      visible={roofConfirmVisible}
      title={pendingRoofValue ? 'Open the roof?' : 'Close the roof?'}
      message="This moves the roof now and switches roof control to Manual. Turn Automatic back on in Hardware Settings."
      confirmLabel={pendingRoofValue ? 'Open' : 'Close'}
      onConfirm={confirmRoofToggle}
      onCancel={() => {
        setRoofConfirmVisible(false);
        setPendingRoofValue(null);
      }}
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
  explainer: { fontSize: 12, color: colors.textSecondary, lineHeight: 17, marginBottom: spacing.md },
  planRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  planDay: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  limitRow: { marginBottom: spacing.sm },
  fieldLabel: { fontSize: 13, fontWeight: '600', color: colors.textPrimary, marginBottom: 6 },
  editRow: { flexDirection: 'row', gap: spacing.md, alignItems: 'center' },
  input: {
    flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
  saveBtnWrap: { width: 90 },
  divider: { height: 1, backgroundColor: colors.divider, marginVertical: spacing.lg },
});
