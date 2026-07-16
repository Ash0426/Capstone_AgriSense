// app/irrigation.tsx
// Irrigation automation controller — shows the current schedule and lets the user change it.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { currentSchedule } from '../data/mockData';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import Button from '../components/ui/Button';

export default function IrrigationScreen() {
  const [morningTime, setMorningTime] = useState(currentSchedule.nextWatering);
  const [saving, setSaving] = useState(false);

  const saveSchedule = () => {
    setSaving(true);
    // TODO: POST { morningTime } to your backend's schedule endpoint
    setTimeout(() => setSaving(false), 500);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Irrigation" subtitle="Set when and how long to water" showBack />

      <Card style={styles.section}>
        <PanelHeader title="Current Schedule" />
        <View style={[styles.panelBody, styles.scheduleRow]}>
          <View style={styles.scheduleBlock}>
            <Text style={styles.scheduleLabel}>Next watering</Text>
            <Text style={styles.scheduleDigits}>{currentSchedule.nextWatering}</Text>
          </View>
          <View style={styles.scheduleBlock}>
            <Text style={styles.scheduleLabel}>How long</Text>
            <Text style={styles.scheduleDigits}>{currentSchedule.duration}</Text>
          </View>
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader title="Change Schedule" />
        <View style={styles.panelBody}>
          <View style={styles.fieldRow}>
            <Text style={styles.fieldLabel}>Morning time</Text>
            <TextInput
              style={styles.timeInput}
              value={morningTime}
              onChangeText={setMorningTime}
              placeholder="06:03"
              placeholderTextColor={colors.textMuted}
            />
          </View>
          <Button label="Save Schedule Updates" onPress={saveSchedule} loading={saving} style={{ marginTop: spacing.lg }} />
        </View>
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  section: { marginBottom: spacing.lg },
  panelBody: { padding: spacing.lg },
  scheduleRow: { flexDirection: 'row', gap: spacing.md },
  scheduleBlock: { flex: 1, borderWidth: 1, borderColor: colors.border, borderRadius: radius.md, padding: spacing.md },
  scheduleLabel: { fontSize: 10, textTransform: 'uppercase', letterSpacing: 0.5, color: colors.textMuted, fontWeight: '600', marginBottom: 4 },
  scheduleDigits: { fontSize: 20, fontWeight: '700', color: colors.textPrimary },
  fieldRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  fieldLabel: { fontSize: 14, fontWeight: '500', color: colors.textPrimary },
  timeInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 8, fontSize: 14, width: 100, textAlign: 'center',
  },
});
