// app/automation.tsx
// Water Automation — watering is driven automatically by the weekly weather forecast, but
// runs immediately regardless of the forecast if the soil-moisture or temperature limits
// below are exceeded (see the auto-watering effect in context/FarmDataContext.tsx). Also
// hosts the Auto Roof toggle, which doubles as a manual open/close override.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
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
  const { reading, predictedWatering, automationLimits, setAutomationLimits, switches, setRoof } = useFarmData();

  const [soilLimitInput, setSoilLimitInput] = useState(String(automationLimits.soilMoistureLimit));
  const [tempLimitInput, setTempLimitInput] = useState(String(automationLimits.tempLimit));
  const [soilConfirmVisible, setSoilConfirmVisible] = useState(false);
  const [tempConfirmVisible, setTempConfirmVisible] = useState(false);

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
        <PanelHeader title="This Week's Plan" subtitle={`Watering scheduled on ${scheduledDays} of 7 days`} />
        <View style={styles.panelBody}>
          <Text style={styles.explainer}>
            Watering runs automatically based on the weekly weather forecast — skipped on days rain is expected, scheduled on dry days.
          </Text>
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
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader title="Roof" subtitle="Auto roof control with manual override" />
        <View style={styles.body}>
          <ListItem
            icon="home"
            iconBg="green"
            title="Auto Roof"
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
      visible={roofConfirmVisible}
      title={pendingRoofValue ? 'Open the roof?' : 'Close the roof?'}
      message="This manually overrides the roof position."
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
