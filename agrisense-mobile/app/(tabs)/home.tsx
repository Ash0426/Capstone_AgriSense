// app/(tabs)/home.tsx
// Dashboard: out-of-calibration alert banner → live sensor readings (tap any card for its
// data log + calibration) → lettuce lifecycle banner (tap for the full lifecycle page) →
// last watering → weekly weather + predicted watering. Sensor reading + all the cross-screen
// state lives in FarmDataContext so calibration, automation limits, notifications, and logs
// stay in sync with what's shown here.
import React from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { useFarmData } from '../../context/FarmDataContext';
import { stageLabels, sensorMeta, WeatherCondition } from '../../data/mockData';
import Card from '../../components/ui/Card';
import PanelHeader from '../../components/ui/PanelHeader';
import MetricCard from '../../components/ui/MetricCard';
import TopHeader from '../../components/ui/TopHeader';

const WEATHER_ICON: Record<WeatherCondition, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rain: 'rainy',
};

export default function HomeScreen() {
  const {
    reading,
    lifecycle,
    stage,
    heatIndex,
    waterLevel,
    lastWatering,
    weeklyWeather,
    predictedWatering,
    automationLimits,
    outOfCalibration,
    heatStress,
  } = useFarmData();

  const showHeatStressBanner = heatStress?.status === 'ok' && heatStress.risk !== 'low';

  const waterLevelStatus = waterLevel < 20 ? 'danger' : waterLevel < 40 ? 'warn' : 'ok';
  const waterLevelLabel = waterLevel < 20 ? 'Low' : waterLevel < 40 ? 'Getting Low' : 'Normal';

  return (
    <View style={styles.flex}>
      <TopHeader />
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Dashboard</Text>
        <Text style={styles.pageSub}>Live sensor readings — updates every 30 seconds</Text>

        {/* Out-of-calibration alert banner */}
        {outOfCalibration.length > 0 && (
          <View style={styles.alertBanner}>
            <Ionicons name="warning" size={18} color={colors.dangerText} />
            <View style={{ flex: 1 }}>
              {outOfCalibration.map((key) => (
                <TouchableOpacity key={key} onPress={() => router.push({ pathname: '/sensor/[key]', params: { key } })}>
                  <Text style={styles.alertText}>
                    {sensorMeta[key].label} is outside its calibrated range — tap to view
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        )}

        {/* Heat stress risk banner (Random Forest prediction, trained on real health-log data) */}
        {showHeatStressBanner && heatStress?.status === 'ok' && (
          <TouchableOpacity onPress={() => router.push({ pathname: '/sensor/[key]', params: { key: 'heatIndex' } })}>
            <View style={[styles.alertBanner, heatStress.risk === 'moderate' && styles.alertBannerModerate]}>
              <Ionicons name="thermometer" size={18} color={heatStress.risk === 'moderate' ? colors.warnText : colors.dangerText} />
              <View style={{ flex: 1 }}>
                <Text style={[styles.alertText, heatStress.risk === 'moderate' && styles.alertTextModerate]}>
                  {heatStress.risk === 'high' ? 'High' : 'Moderate'} heat stress risk predicted ({Math.round(heatStress.probability * 100)}%) — tap for details
                </Text>
              </View>
            </View>
          </TouchableOpacity>
        )}

        {/* Live sensor readings — tap any card for its data log + calibration */}
        <Text style={styles.sectionLabel}>Live Sensor Readings</Text>
        <View style={styles.metricsGrid}>
          <TouchableOpacity style={styles.metricWrap} onPress={() => router.push({ pathname: '/sensor/[key]', params: { key: 'heatIndex' } })}>
            <MetricCard
              label="Daily Heat Index"
              value={heatIndex}
              unit="°C"
              status="ok"
              statusLabel="Via Weather API"
              footer="Updated hourly"
              barColor={colors.barTempEnd}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricWrap} onPress={() => router.push({ pathname: '/sensor/[key]', params: { key: 'soilMoisture' } })}>
            <MetricCard
              label="Soil Moisture"
              value={reading?.soilMoisture ?? '—'}
              unit="%"
              status={reading?.soilMoistureStatus ?? 'ok'}
              statusLabel={reading?.soilMoistureLabel ?? 'Loading'}
              footer={`Limit: ${automationLimits.soilMoistureLimit}%`}
              barColor={colors.barSoilEnd}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricWrap} onPress={() => router.push({ pathname: '/sensor/[key]', params: { key: 'airTemp' } })}>
            <MetricCard
              label="Temperature"
              value={reading?.airTemp ?? '—'}
              unit="°C"
              status={reading?.airTempStatus ?? 'ok'}
              statusLabel={reading?.airTempLabel ?? 'Loading'}
              footer={`Limit: ${automationLimits.tempLimit}°C`}
              barColor={colors.barTempStart}
            />
          </TouchableOpacity>
          <TouchableOpacity style={styles.metricWrap} onPress={() => router.push({ pathname: '/sensor/[key]', params: { key: 'waterLevel' } })}>
            <MetricCard
              label="Water Level"
              value={waterLevel}
              unit="%"
              status={waterLevelStatus}
              statusLabel={waterLevelLabel}
              footer="Tank capacity"
              barColor={colors.barHumidEnd}
            />
          </TouchableOpacity>
        </View>

        {/* Lettuce Lifecycle banner */}
        <TouchableOpacity onPress={() => router.push('/lifecycle')}>
          <Card style={styles.section}>
            <View style={styles.bannerRow}>
              <Ionicons name="leaf" size={22} color={colors.mint} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerLabel}>Lettuce Lifecycle</Text>
                <Text style={styles.bannerValue}>
                  {stageLabels[stage]} · Age {lifecycle.ageDays} {lifecycle.ageDays === 1 ? 'day' : 'days'}
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>

        {/* Last watering */}
        <Card style={styles.section}>
          <View style={styles.lastWateringRow}>
            <Ionicons name="water-outline" size={20} color={colors.mint} />
            <View style={{ flex: 1 }}>
              <Text style={styles.lastWateringLabel}>Last Watering</Text>
              <Text style={styles.lastWateringValue}>{lastWatering ?? 'No watering recorded yet'}</Text>
            </View>
          </View>
        </Card>

        {/* Weekly weather + predicted watering — tap for the full forecast & suggestion */}
        <TouchableOpacity onPress={() => router.push('/weekly-weather')}>
          <Card style={styles.section}>
            <PanelHeader
              title="Weekly Weather Summary"
              subtitle="Predicted watering schedule for the week"
              right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
            />
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.weatherRow}>
              {weeklyWeather.map((w, i) => (
                <View key={w.day} style={styles.weatherCol}>
                  <Text style={styles.weatherDay}>{w.day}</Text>
                  <Ionicons name={WEATHER_ICON[w.condition]} size={22} color={colors.mint} style={{ marginVertical: 6 }} />
                  <Text style={styles.weatherTemp}>{w.high}° / {w.low}°</Text>
                  <View style={[styles.wateringPill, predictedWatering[i].watering ? styles.wateringPillOn : styles.wateringPillOff]}>
                    <Text style={[styles.wateringPillText, predictedWatering[i].watering ? styles.wateringPillTextOn : styles.wateringPillTextOff]}>
                      {predictedWatering[i].watering ? 'Watering' : 'Skipped'}
                    </Text>
                  </View>
                </View>
              ))}
            </ScrollView>
            <Text style={styles.weatherHint}>Tap for the full forecast and watering suggestion</Text>
          </Card>
        </TouchableOpacity>

        {/* Watering Automation banner */}
        <TouchableOpacity onPress={() => router.push('/automation')}>
          <Card style={styles.section}>
            <View style={styles.bannerRow}>
              <Ionicons name="water" size={22} color={colors.mint} />
              <View style={{ flex: 1 }}>
                <Text style={styles.bannerLabel}>Watering Automation</Text>
                <Text style={styles.bannerValue}>
                  Soil ≥ {automationLimits.soilMoistureLimit}% · Temp ≤ {automationLimits.tempLimit}°C
                </Text>
              </View>
              <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
            </View>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  pageSub: { fontSize: 12, color: colors.textMuted, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  sectionLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm, textTransform: 'uppercase', letterSpacing: 0.5 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: spacing.lg },
  metricWrap: { flexBasis: '48%', flexGrow: 1 },

  alertBanner: {
    flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm,
    backgroundColor: colors.dangerBg, borderRadius: radius.md, padding: spacing.md, marginBottom: spacing.lg,
  },
  alertBannerModerate: { backgroundColor: colors.warnBg },
  alertText: { fontSize: 12, color: colors.dangerText, fontWeight: '600', marginBottom: 2 },
  alertTextModerate: { color: colors.warnText },

  bannerRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  bannerLabel: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  bannerValue: { fontSize: 15, color: colors.textPrimary, fontWeight: '700', marginTop: 2 },
  weatherHint: { fontSize: 11, color: colors.textMuted, paddingHorizontal: spacing.lg, paddingBottom: spacing.md, marginTop: -spacing.sm },

  lastWateringRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  lastWateringLabel: { fontSize: 11, color: colors.textMuted, textTransform: 'uppercase', letterSpacing: 0.5, fontWeight: '600' },
  lastWateringValue: { fontSize: 15, color: colors.textPrimary, fontWeight: '600', marginTop: 2 },

  weatherRow: { paddingHorizontal: spacing.lg, paddingVertical: spacing.lg, gap: spacing.lg },
  weatherCol: { alignItems: 'center', width: 64 },
  weatherDay: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  weatherTemp: { fontSize: 11, color: colors.textSecondary, marginBottom: 6 },
  wateringPill: { paddingHorizontal: 8, paddingVertical: 3, borderRadius: radius.sm },
  wateringPillOn: { backgroundColor: colors.okBg },
  wateringPillOff: { backgroundColor: colors.background, borderWidth: 1, borderColor: colors.border },
  wateringPillText: { fontSize: 9, fontWeight: '700' },
  wateringPillTextOn: { color: colors.okText },
  wateringPillTextOff: { color: colors.textMuted },
});
