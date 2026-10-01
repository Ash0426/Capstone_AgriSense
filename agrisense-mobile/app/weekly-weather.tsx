// app/weekly-weather.tsx
// Full weekly forecast + watering suggestion, opened by tapping the Weekly Weather Summary
// card on the Dashboard. predictedWatering is derived in FarmDataContext from weeklyWeather
// (skip on rain / high rain chance, schedule otherwise). Each day is tappable to edit that
// day's independent watering time + amount (FarmDataContext.wateringSchedule).
import React, { useMemo, useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import { WeatherCondition } from '../data/mockData';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import Badge from '../components/ui/Badge';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

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
  const { weeklyWeather, predictedWatering, wateringSchedule, setDayWatering, switches } = useFarmData();

  const [expandedDay, setExpandedDay] = useState<string | null>(null);
  const [timeInput, setTimeInput] = useState('');
  const [amountInput, setAmountInput] = useState('');
  const [confirmDay, setConfirmDay] = useState<string | null>(null);

  // Describes what the server will actually run (the forecast below is sample data for now).
  const suggestion = useMemo(() => {
    const scheduledDays = predictedWatering.filter((d) => d.watering);
    if (!switches?.timer) {
      return 'The watering schedule is OFF — nothing runs at set times. Turn it on in Water Automation. Soil/temperature limits still water when crossed.';
    }
    if (scheduledDays.length === 0) return 'No day has a watering amount set. Tap a day below to set its time and amount.';
    return `Watering runs on ${scheduledDays.length} of 7 days at the times below${
      switches?.skipRain ? ', and is skipped if the rain sensor shows rain at that time' : ''
    }. Soil/temperature limits can also water in between.`;
  }, [predictedWatering, switches?.timer, switches?.skipRain]);

  const toggleDay = (day: string) => {
    if (expandedDay === day) {
      setExpandedDay(null);
      return;
    }
    setTimeInput(wateringSchedule[day]?.time ?? '06:00');
    setAmountInput(String(wateringSchedule[day]?.amountLiters ?? 2));
    setExpandedDay(day);
  };

  const requestSave = (day: string) => {
    if (!timeInput.trim()) return;
    setConfirmDay(day);
  };

  const confirmSave = () => {
    if (!confirmDay) return;
    const amount = parseFloat(amountInput);
    setDayWatering(confirmDay, { time: timeInput.trim(), amountLiters: Number.isFinite(amount) ? amount : 0 });
    setConfirmDay(null);
    setExpandedDay(null);
  };

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
          <PanelHeader title="7-Day Forecast" subtitle="Tap a day to edit its watering time & amount" />
          <View style={styles.body}>
            {weeklyWeather.map((w, i) => {
              const dayWatering = wateringSchedule[w.day];
              const isExpanded = expandedDay === w.day;
              return (
                <View key={w.day} style={i === weeklyWeather.length - 1 ? styles.noBorder : undefined}>
                  <TouchableOpacity onPress={() => toggleDay(w.day)} style={styles.row}>
                    <View style={styles.dayCol}>
                      <Text style={styles.day}>{w.day}</Text>
                      <Text style={styles.date}>{w.date}</Text>
                    </View>
                    <Ionicons name={WEATHER_ICON[w.condition]} size={22} color={colors.mint} />
                    <View style={styles.conditionCol}>
                      <Text style={styles.condition}>{WEATHER_LABEL[w.condition]}</Text>
                      <Text style={styles.temps}>{w.high}° / {w.low}° · {w.rainChance}% rain</Text>
                      {dayWatering && (
                        <Text style={styles.wateringInfo}>{dayWatering.time} · {dayWatering.amountLiters}L</Text>
                      )}
                    </View>
                    <Badge
                      label={predictedWatering[i].watering ? 'Scheduled' : predictedWatering[i].reason}
                      status={predictedWatering[i].watering ? 'ok' : 'warn'}
                    />
                    <Ionicons
                      name={isExpanded ? 'chevron-up' : 'chevron-down'}
                      size={16}
                      color={colors.textMuted}
                      style={{ marginLeft: spacing.xs }}
                    />
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.editBox}>
                      <View style={styles.editRow}>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Time</Text>
                          <TextInput
                            style={styles.input}
                            value={timeInput}
                            onChangeText={setTimeInput}
                            placeholder="06:00 (24-hour, e.g. 18:30)"
                            placeholderTextColor={colors.textMuted}
                          />
                        </View>
                        <View style={{ flex: 1 }}>
                          <Text style={styles.fieldLabel}>Amount (Liters)</Text>
                          <TextInput
                            style={styles.input}
                            value={amountInput}
                            onChangeText={setAmountInput}
                            keyboardType="numbers-and-punctuation"
                            placeholder="2"
                            placeholderTextColor={colors.textMuted}
                          />
                        </View>
                      </View>
                      <Button label={`Save ${w.day}`} onPress={() => requestSave(w.day)} style={{ marginTop: spacing.md }} />
                    </View>
                  )}
                </View>
              );
            })}
          </View>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={!!confirmDay}
        title={`Save watering for ${confirmDay}?`}
        message={`Set ${confirmDay} to ${timeInput} · ${amountInput}L.`}
        confirmLabel="Save"
        onConfirm={confirmSave}
        onCancel={() => setConfirmDay(null)}
      />
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
  wateringInfo: { fontSize: 11, color: colors.mint, fontWeight: '600', marginTop: 2 },
  editBox: { paddingBottom: spacing.lg, borderBottomWidth: 1, borderBottomColor: colors.divider },
  editRow: { flexDirection: 'row', gap: spacing.md },
  fieldLabel: { fontSize: 11, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
});
