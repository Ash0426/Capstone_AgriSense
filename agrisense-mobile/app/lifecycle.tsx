// app/lifecycle.tsx
// Full Lettuce Lifecycle page, opened from the banner on the Dashboard. Shows the current
// stage as a statement + read-only stepper; the stage-editing controls only appear once the
// farmer taps "Update Stage". The health-rating question only shows once per calendar day —
// after it's answered it's replaced by a confirmation line until the next day.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import { stageOrder, stageLabels, healthRatingOptions, LettuceStage, DurationUnit } from '../data/mockData';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function LifecycleScreen() {
  const { lifecycle, stageIndex, setLifecycle, healthLog, logHealth } = useFarmData();

  const [updating, setUpdating] = useState(false);
  const [stageInput, setStageInput] = useState<LettuceStage>(lifecycle.stage);
  const [durationInput, setDurationInput] = useState(String(lifecycle.durationValue));
  const [unitInput, setUnitInput] = useState<DurationUnit>(lifecycle.durationUnit);
  const [stageConfirmVisible, setStageConfirmVisible] = useState(false);

  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [healthConfirmVisible, setHealthConfirmVisible] = useState(false);

  const today = new Date().toDateString();
  const latestHealthEntry = healthLog[0];
  const alreadyLoggedToday = !!latestHealthEntry && new Date(latestHealthEntry.loggedAt).toDateString() === today;

  const openUpdate = () => {
    setStageInput(lifecycle.stage);
    setDurationInput(String(lifecycle.durationValue));
    setUnitInput(lifecycle.durationUnit);
    setUpdating(true);
  };

  const confirmUpdateStage = () => {
    const value = Math.max(1, parseInt(durationInput, 10) || 1);
    setLifecycle(stageInput, value, unitInput);
    setStageConfirmVisible(false);
    setUpdating(false);
  };

  const confirmLogHealth = () => {
    if (!selectedRating) return;
    logHealth(selectedRating);
    setSelectedRating(null);
    setHealthConfirmVisible(false);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Lettuce Lifecycle" subtitle="Seedling → Growth → Mature" showBack />

        <Card style={styles.section}>
          <View style={styles.panelBody}>
            <View style={styles.stepperRow}>
              {stageOrder.map((stage, i) => (
                <React.Fragment key={stage}>
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperDot, i <= stageIndex && styles.stepperDotActive]} />
                    <Text style={[styles.stepperLabel, i === stageIndex && styles.stepperLabelActive]}>
                      {stageLabels[stage]}
                    </Text>
                  </View>
                  {i < stageOrder.length - 1 && (
                    <View style={[styles.stepperLine, i < stageIndex && styles.stepperLineActive]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.statement}>
              Your lettuce is currently in the <Text style={styles.statementBold}>{stageLabels[lifecycle.stage]}</Text> stage —{' '}
              {lifecycle.durationUnit === 'day' ? 'Day' : 'Week'} {lifecycle.durationValue}.
            </Text>

            {!updating ? (
              <Button label="Update Stage" variant="outline" onPress={openUpdate} style={{ marginTop: spacing.md }} />
            ) : (
              <View style={styles.updateBox}>
                <Text style={styles.fieldLabel}>Set stage</Text>
                <View style={styles.chipRow}>
                  {stageOrder.map((stage) => (
                    <TouchableOpacity
                      key={stage}
                      onPress={() => setStageInput(stage)}
                      style={[styles.chip, stageInput === stage && styles.chipActive]}
                    >
                      <Text style={[styles.chipText, stageInput === stage && styles.chipTextActive]}>{stageLabels[stage]}</Text>
                    </TouchableOpacity>
                  ))}
                </View>

                <View style={styles.durationRow}>
                  <View style={styles.durationInputWrap}>
                    <Text style={styles.fieldLabel}>Duration</Text>
                    <TextInput
                      style={styles.durationInput}
                      value={durationInput}
                      onChangeText={setDurationInput}
                      keyboardType="number-pad"
                      placeholder="1"
                      placeholderTextColor={colors.textMuted}
                    />
                  </View>
                  <View style={styles.unitChipRow}>
                    {(['day', 'week'] as DurationUnit[]).map((unit) => (
                      <TouchableOpacity
                        key={unit}
                        onPress={() => setUnitInput(unit)}
                        style={[styles.chip, unitInput === unit && styles.chipActive]}
                      >
                        <Text style={[styles.chipText, unitInput === unit && styles.chipTextActive]}>
                          {unit === 'day' ? 'Day' : 'Week'}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>

                <View style={styles.updateActions}>
                  <TouchableOpacity onPress={() => setUpdating(false)} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Button label="Save" onPress={() => setStageConfirmVisible(true)} />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="Lettuce Health" />
          <View style={styles.panelBody}>
            {!alreadyLoggedToday ? (
              <>
                <Text style={styles.fieldLabel}>Rate your lettuce health</Text>
                <View style={styles.ratingList}>
                  {healthRatingOptions.map((rating) => (
                    <TouchableOpacity
                      key={rating}
                      onPress={() => setSelectedRating(rating)}
                      style={styles.ratingRow}
                    >
                      <Ionicons
                        name={selectedRating === rating ? 'radio-button-on' : 'radio-button-off'}
                        size={18}
                        color={selectedRating === rating ? colors.mint : colors.textMuted}
                      />
                      <Text style={[styles.ratingText, selectedRating === rating && styles.ratingTextActive]}>{rating}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <Button
                  label="Data Log"
                  variant="outline"
                  onPress={() => setHealthConfirmVisible(true)}
                  disabled={!selectedRating}
                  style={{ marginTop: spacing.md }}
                />
              </>
            ) : (
              <Text style={styles.loggedToday}>Logged today: {latestHealthEntry.rating}</Text>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="Health Log" subtitle="Lettuce health by day" />
          <View style={styles.body}>
            {healthLog.length ? (
              healthLog.map((entry, i) => (
                <View key={entry.id} style={[styles.logRow, i === healthLog.length - 1 && styles.noBorder]}>
                  <Text style={styles.logDay}>
                    {new Date(entry.loggedAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit' })}
                  </Text>
                  <Text style={styles.logRating}>{entry.rating}</Text>
                </View>
              ))
            ) : (
              <Text style={styles.emptyText}>No health ratings logged yet.</Text>
            )}
          </View>
        </Card>
      </ScrollView>

      <ConfirmModal
        visible={stageConfirmVisible}
        title="Update lifecycle stage?"
        message={`Set the stage to ${stageLabels[stageInput]} (${unitInput === 'day' ? 'Day' : 'Week'} ${durationInput || 1}).`}
        confirmLabel="Save"
        onConfirm={confirmUpdateStage}
        onCancel={() => setStageConfirmVisible(false)}
      />
      <ConfirmModal
        visible={healthConfirmVisible}
        title="Log lettuce health?"
        message={selectedRating ? `Record today's rating as "${selectedRating}".` : ''}
        confirmLabel="Data Log"
        onConfirm={confirmLogHealth}
        onCancel={() => setHealthConfirmVisible(false)}
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

  stepperRow: { flexDirection: 'row', alignItems: 'center', marginBottom: spacing.lg },
  stepperItem: { alignItems: 'center', width: 72 },
  stepperDot: { width: 14, height: 14, borderRadius: 7, backgroundColor: colors.border },
  stepperDotActive: { backgroundColor: colors.mint },
  stepperLabel: { fontSize: 11, color: colors.textMuted, marginTop: 6 },
  stepperLabelActive: { color: colors.mint, fontWeight: '700' },
  stepperLine: { flex: 1, height: 2, backgroundColor: colors.border, marginBottom: 20 },
  stepperLineActive: { backgroundColor: colors.mint },

  statement: { fontSize: 15, color: colors.textBody, lineHeight: 22 },
  statementBold: { fontWeight: '700', color: colors.textPrimary },

  updateBox: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  chipRow: { flexDirection: 'row', gap: spacing.sm, flexWrap: 'wrap' },
  chip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background,
  },
  chipActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  chipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  chipTextActive: { color: colors.white },
  durationRow: { flexDirection: 'row', gap: spacing.md, marginTop: spacing.md, alignItems: 'flex-end' },
  durationInputWrap: { width: 90 },
  durationInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, textAlign: 'center', color: colors.textPrimary,
  },
  unitChipRow: { flexDirection: 'row', gap: spacing.sm },
  updateActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  cancelLink: { paddingVertical: 12, paddingHorizontal: spacing.sm },
  cancelLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  ratingList: { gap: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  ratingText: { fontSize: 13, color: colors.textBody },
  ratingTextActive: { color: colors.textPrimary, fontWeight: '600' },
  loggedToday: { fontSize: 14, color: colors.okText, fontWeight: '600' },

  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  noBorder: { borderBottomWidth: 0 },
  logDay: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  logRating: { fontSize: 13, color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, paddingBottom: spacing.lg },
});
