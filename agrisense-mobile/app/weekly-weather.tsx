// app/weekly-weather.tsx
// Full weekly forecast + watering suggestion, opened by tapping the Weekly Weather Summary
// card on the Dashboard. predictedWatering is derived in FarmDataContext from weeklyWeather
// (skip on rain / high rain chance, schedule otherwise) — this page just explains it in full.
import React, { useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import { WeatherCondition } from '../data/mockData';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import Badge from '../components/ui/Badge';

const WEATHER_ICON: Record<WeatherCondition, keyof typeof Ionicons.glyphMap> = {
  sunny: 'sunny',
  cloudy: 'cloudy',
  rain: 'rainy',
};
const WEATHER_LABEL: Record<WeatherCondition, string> = {
  sunny: 'Sunny',
  cloudy: 'Cloudy',
  rain: 'Rain',
};

export default function WeeklyWeatherScreen() {
  const { weeklyWeather, predictedWatering } = useFarmData();

  const suggestion = useMemo(() => {
    const scheduledDays = predictedWatering.filter((d) => d.watering);
    const skippedDays = predictedWatering.filter((d) => !d.watering);
    if (skippedDays.length === 0) {
      return `No rain expected this week — watering is scheduled on all 7 days.`;
    }
    if (scheduledDays.length === 0) {
      return `Rain is expected all week — watering will be skipped every day to conserve water.`;
    }
    return `Watering is scheduled on ${scheduledDays.length} of 7 days. It's skipped on ${skippedDays
      .map((d) => d.day)
      .join(', ')} due to expected rain — the tank won't be topped up those days unless a sensor limit is exceeded.`;
  }, [predictedWatering]);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Weekly Weather" subtitle="7-day forecast and watering suggestion" showBack />

        <Card style={styles.section}>
          <View style={styles.suggestionBody}>
            <Ionicons name="bulb" size={20} color={colors.mint} />
            <Text style={styles.suggestionText}>{suggestion}</Text>
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="7-Day Forecast" />
          <View style={styles.body}>
            {weeklyWeather.map((w, i) => (
              <View key={w.day} style={[styles.row, i === weeklyWeather.length - 1 && styles.noBorder]}>
                <View style={styles.dayCol}>
                  <Text style={styles.day}>{w.day}</Text>
                  <Text style={styles.date}>{w.date}</Text>
                </View>
                <Ionicons name={WEATHER_ICON[w.condition]} size={22} color={colors.mint} />
                <View style={styles.conditionCol}>
                  <Text style={styles.condition}>{WEATHER_LABEL[w.condition]}</Text>
                  <Text style={styles.temps}>{w.high}° / {w.low}° · {w.rainChance}% rain</Text>
                </View>
                <Badge
                  label={predictedWatering[i].watering ? 'Scheduled' : 'Skipped'}
                  status={predictedWatering[i].watering ? 'ok' : 'warn'}
                />
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  body: { paddingHorizontal: spacing.lg },
  suggestionBody: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.md, padding: spacing.lg },
  suggestionText: { flex: 1, fontSize: 13, color: colors.textBody, lineHeight: 19 },
  row: {
    flexDirection: 'row', alignItems: 'center', gap: spacing.md,
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  noBorder: { borderBottomWidth: 0 },
  dayCol: { width: 44 },
  day: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },
  date: { fontSize: 10, color: colors.textMuted, marginTop: 1 },
  conditionCol: { flex: 1 },
  condition: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  temps: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
});
