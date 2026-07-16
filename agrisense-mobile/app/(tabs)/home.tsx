// app/(tabs)/home.tsx
// Dashboard. Order per spec: "what's happening now" status → live sensor readings →
// automation override (view more) → watering threshold slider → irrigation button → system logs button.
// Swap `sensorReadings` for a live fetch from your Express API (e.g. poll every 30s).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import Slider from '@react-native-community/slider';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { sensorReadings } from '../../data/mockData';
import Card from '../../components/ui/Card';
import PanelHeader from '../../components/ui/PanelHeader';
import MetricCard from '../../components/ui/MetricCard';
import Button from '../../components/ui/Button';

export default function HomeScreen() {
  const [threshold, setThreshold] = useState(55);
  const [roofOpen, setRoofOpen] = useState(false);

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <View style={styles.headerRow}>
        <View>
          <Text style={styles.pageTitle}>Dashboard</Text>
          <Text style={styles.pageSub}>Live sensor readings — updates every 30 seconds</Text>
        </View>
        <View style={styles.onlineBadge}>
          <View style={styles.onlineDot} />
          <Text style={styles.onlineText}>Online</Text>
        </View>
      </View>

      {/* What's happening right now */}
      <Card style={styles.section}>
        <PanelHeader title="What's happening right now" />
        <View style={styles.panelBody}>
          <View style={styles.statusBox}>
            <Ionicons name={roofOpen ? 'sunny' : 'home'} size={44} color={roofOpen ? colors.dotBlueStrong : colors.textPrimary} />
            <Text style={[styles.statusTitle, roofOpen && { color: colors.dotBlueStrong }]}>
              Roof: {roofOpen ? 'Open' : 'Closed'}
            </Text>
            <Text style={styles.statusDesc}>
              {roofOpen ? 'Manually opened via dashboard override' : "Closed automatically · it's 35.2°C outside"}
            </Text>
          </View>
          <View style={styles.badgeCloud}>
            <StatusChip dotColor={roofOpen ? colors.dotBlueStrong : colors.dotRed} label={`Roof ${roofOpen ? 'Open' : 'Closed'}`} />
            <StatusChip dotColor={colors.dotEmerald} label="Valve Open" />
            <StatusChip dotColor={colors.dotBlue} label="No Rain" />
            <StatusChip dotColor={colors.dotEmerald} label="Camera On" />
          </View>
        </View>
      </Card>

      {/* Live sensor readings */}
      <Text style={styles.sectionLabel}>Live Sensor Readings</Text>
      <View style={styles.metricsGrid}>
        <MetricCard
          label="Air Temperature"
          value={sensorReadings.airTemp.value}
          unit={sensorReadings.airTemp.unit}
          status="danger"
          statusLabel={sensorReadings.airTemp.label}
          footer={`Optimal: ${sensorReadings.airTemp.optimal}`}
          barColor={colors.barTempEnd}
        />
        <MetricCard
          label="Air Humidity"
          value={sensorReadings.airHumidity.value}
          unit={sensorReadings.airHumidity.unit}
          status="ok"
          statusLabel={sensorReadings.airHumidity.label}
          footer={`Optimal: ${sensorReadings.airHumidity.optimal}`}
          barColor={colors.barHumidEnd}
        />
        <MetricCard
          label="Soil Moisture"
          value={sensorReadings.soilMoisture.value}
          unit={sensorReadings.soilMoisture.unit}
          status="warn"
          statusLabel={sensorReadings.soilMoisture.label}
          footer={sensorReadings.soilMoisture.optimal}
          barColor={colors.barSoilEnd}
        />
        <MetricCard
          label="Rain Status"
          value={sensorReadings.rain.value.toFixed(1)}
          unit={sensorReadings.rain.unit}
          status="ok"
          statusLabel={sensorReadings.rain.label}
          footer={sensorReadings.rain.optimal}
          barColor={colors.barRainEnd}
        />
      </View>

      {/* Automation override - view more */}
      <Card style={styles.section}>
        <PanelHeader title="Automation Override Switches" subtitle="Auto roof, valve, timer & more" />
        <View style={styles.panelBody}>
          <Button label="View More" variant="outline" onPress={() => router.push('/automation')} />
        </View>
      </Card>

      {/* When should watering start */}
      <Card style={styles.section}>
        <PanelHeader title="When should watering start?" subtitle="Valve opens automatically when soil gets too dry" />
        <View style={styles.panelBody}>
          <View style={styles.sliderLabels}>
            <Text style={styles.sliderLabelText}>Drier soil → water sooner</Text>
            <Text style={styles.sliderLabelText}>Wetter soil → water later</Text>
          </View>
          <Slider
            minimumValue={20}
            maximumValue={90}
            step={1}
            value={threshold}
            onValueChange={setThreshold}
            minimumTrackTintColor={colors.mint}
            maximumTrackTintColor={colors.border}
            thumbTintColor={colors.mint}
          />
          <View style={styles.thresholdRow}>
            <Text style={styles.thresholdLabel}>Start watering when soil drops below:</Text>
            <Text style={styles.thresholdValue}>{Math.round(threshold)}%</Text>
          </View>
          <View style={styles.rightNowRow}>
            <Text style={styles.thresholdLabel}>Right now</Text>
            <Text style={styles.rightNowText}>
              Soil is at <Text style={styles.bold}>48%</Text> — <Text style={styles.wateringNow}>watering now</Text>
            </Text>
          </View>
        </View>
      </Card>

      {/* Irrigation controller */}
      <Card style={styles.section}>
        <PanelHeader title="Irrigation" subtitle="Schedule & manage the watering controller" />
        <View style={styles.panelBody}>
          <Button label="Open Irrigation Controller" onPress={() => router.push('/irrigation')} />
        </View>
      </Card>

      {/* System logs button */}
      <TouchableOpacity style={styles.logsButton} onPress={() => router.push('/system-logs')}>
        <Ionicons name="document-text-outline" size={18} color={colors.textPrimary} />
        <Text style={styles.logsButtonText}>View System Logs</Text>
        <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
      </TouchableOpacity>
    </ScrollView>
  );
}

function StatusChip({ dotColor, label }: { dotColor: string; label: string }) {
  return (
    <View style={styles.chip}>
      <View style={[styles.chipDot, { backgroundColor: dotColor }]} />
      <Text style={styles.chipText}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  headerRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: spacing.lg },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  onlineBadge: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.okBg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 5,
  },
  onlineDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: colors.dotEmerald },
  onlineText: { fontSize: 11, fontWeight: '600', color: colors.okText },
  section: { marginBottom: spacing.lg },
  panelBody: { padding: spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  statusBox: {
    backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border,
    borderRadius: radius.md, paddingVertical: spacing.xl, alignItems: 'center', marginBottom: spacing.lg,
  },
  statusTitle: { fontSize: 12, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5, marginTop: spacing.sm, color: colors.okText },
  statusDesc: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  badgeCloud: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm },
  chip: {
    flexDirection: 'row', alignItems: 'center', gap: 6, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.card, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 6,
  },
  chipDot: { width: 8, height: 8, borderRadius: 4 },
  chipText: { fontSize: 12, fontWeight: '500', color: colors.textBody },
  sliderLabels: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 6 },
  sliderLabelText: { fontSize: 11, color: colors.textMuted },
  thresholdRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: spacing.sm },
  thresholdLabel: { fontSize: 13, color: colors.textSecondary },
  thresholdValue: { fontSize: 14, fontWeight: '700', color: colors.mint },
  rightNowRow: {
    flexDirection: 'row', justifyContent: 'space-between', marginTop: spacing.md, paddingTop: spacing.md,
    borderTopWidth: 1, borderTopColor: colors.divider,
  },
  rightNowText: { fontSize: 13, color: colors.textBody },
  bold: { fontWeight: '700' },
  wateringNow: { color: colors.warnText, fontWeight: '600' },
  logsButton: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.sm, backgroundColor: colors.card,
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.lg,
  },
  logsButtonText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});
