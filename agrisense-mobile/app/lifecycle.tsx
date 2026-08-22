// app/lifecycle.tsx
// Full Lettuce Lifecycle page, opened from the banner on the Dashboard. Stage always follows
// the plant's age (Day 1-10 Seedling, 11-20 Growth, 21+ Mature) — there's no manual stage
// picker, only an age field. The health-rating question only shows once per calendar day;
// after answering, today's rating can still be edited (via the "Edit" link) until midnight.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import { stageOrder, stageLabels, healthRatingOptions } from '../data/mockData';
import Card from '../components/ui/Card';
import PanelHeader from '../components/ui/PanelHeader';
import ScreenHeader from '../components/ui/ScreenHeader';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function LifecycleScreen() {
  const { lifecycle, stage, stageIndex, setLifecycle, healthLog, logHealth, editHealthLog } = useFarmData();

  const [updating, setUpdating] = useState(false);
  const [ageInput, setAgeInput] = useState(String(lifecycle.ageDays));
  const [ageConfirmVisible, setAgeConfirmVisible] = useState(false);

  const [healthEditing, setHealthEditing] = useState(false);
  const [selectedRating, setSelectedRating] = useState<string | null>(null);
  const [healthConfirmVisible, setHealthConfirmVisible] = useState(false);

  const today = new Date().toDateString();
  const latestHealthEntry = healthLog[0];
  const alreadyLoggedToday = !!latestHealthEntry && new Date(latestHealthEntry.loggedAt).toDateString() === today;

  const openUpdate = () => {
    setAgeInput(String(lifecycle.ageDays));
    setUpdating(true);
  };

  const confirmUpdateAge = () => {
    const value = Math.max(1, parseInt(ageInput, 10) || 1);
    setLifecycle(value);
    setAgeConfirmVisible(false);
    setUpdating(false);
  };

  const openEditHealth = () => {
    if (!latestHealthEntry) return;
    setSelectedRating(latestHealthEntry.rating);
    setHealthEditing(true);
  };

  const confirmLogHealth = () => {
    if (!selectedRating) return;
    if (healthEditing && latestHealthEntry) {
      editHealthLog(latestHealthEntry.id, selectedRating);
    } else {
      logHealth(selectedRating);
    }
    setSelectedRating(null);
    setHealthEditing(false);
    setHealthConfirmVisible(false);
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Lettuce Lifecycle" subtitle="Seedling → Growth → Mature" showBack />

        <Card style={styles.section}>
          <View style={styles.panelBody}>
            <View style={styles.stepperRow}>
              {stageOrder.map((s, i) => (
                <React.Fragment key={s}>
                  <View style={styles.stepperItem}>
                    <View style={[styles.stepperDot, i <= stageIndex && styles.stepperDotActive]} />
                    <Text style={[styles.stepperLabel, i === stageIndex && styles.stepperLabelActive]}>
                      {stageLabels[s]}
                    </Text>
                  </View>
                  {i < stageOrder.length - 1 && (
                    <View style={[styles.stepperLine, i < stageIndex && styles.stepperLineActive]} />
                  )}
                </React.Fragment>
              ))}
            </View>

            <Text style={styles.statement}>
              Your lettuce is currently in the <Text style={styles.statementBold}>{stageLabels[stage]}</Text> stage —{' '}
              Age {lifecycle.ageDays} {lifecycle.ageDays === 1 ? 'day' : 'days'}.
            </Text>
            <Text style={styles.hint}>The stage updates automatically based on age — there's no manual stage picker.</Text>

            {!updating ? (
              <Button label="Update Age" variant="outline" onPress={openUpdate} style={{ marginTop: spacing.md }} />
            ) : (
              <View style={styles.updateBox}>
                <Text style={styles.fieldLabel}>Age (Days)</Text>
                <TextInput
                  style={styles.ageInput}
                  value={ageInput}
                  onChangeText={setAgeInput}
                  keyboardType="number-pad"
                  placeholder="1"
                  placeholderTextColor={colors.textMuted}
                />

                <View style={styles.updateActions}>
                  <TouchableOpacity onPress={() => setUpdating(false)} style={styles.cancelLink}>
                    <Text style={styles.cancelLinkText}>Cancel</Text>
                  </TouchableOpacity>
                  <View style={{ flex: 1 }}>
                    <Button label="Save" onPress={() => setAgeConfirmVisible(true)} />
                  </View>
                </View>
              </View>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="Lettuce Health" />
          <View style={styles.panelBody}>
            {!alreadyLoggedToday || healthEditing || !latestHealthEntry ? (
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
                <View style={styles.updateActions}>
                  {healthEditing && (
                    <TouchableOpacity onPress={() => { setHealthEditing(false); setSelectedRating(null); }} style={styles.cancelLink}>
                      <Text style={styles.cancelLinkText}>Cancel</Text>
                    </TouchableOpacity>
                  )}
                  <View style={{ flex: 1 }}>
                    <Button
                      label={healthEditing ? 'Save' : 'Data Log'}
                      variant="outline"
                      onPress={() => setHealthConfirmVisible(true)}
                      disabled={!selectedRating}
                    />
                  </View>
                </View>
              </>
            ) : (
              <>
                <Text style={styles.loggedToday}>Logged today: {latestHealthEntry.rating}</Text>
                <Text style={styles.loggedTodayTime}>
                  {new Date(latestHealthEntry.loggedAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
                </Text>
                <TouchableOpacity onPress={openEditHealth} style={styles.editLink}>
                  <Ionicons name="create-outline" size={14} color={colors.mint} />
                  <Text style={styles.editLinkText}>Edit today's rating</Text>
                </TouchableOpacity>
                <Text style={styles.hint}>Editable until midnight — tomorrow's question will ask again.</Text>
              </>
            )}
          </View>
        </Card>

        <Card style={styles.section}>
          <PanelHeader title="Health Log" subtitle="Lettuce health by date and time" />
          <View style={styles.body}>
            {healthLog.length ? (
              healthLog.map((entry, i) => (
                <View key={entry.id} style={[styles.logRow, i === healthLog.length - 1 && styles.noBorder]}>
                  <Text style={styles.logDay}>
                    {new Date(entry.loggedAt).toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' })}
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
        visible={ageConfirmVisible}
        title="Update lettuce age?"
        message={`Set the age to ${ageInput || 1} day(s). Stage will update automatically.`}
        confirmLabel="Save"
        onConfirm={confirmUpdateAge}
        onCancel={() => setAgeConfirmVisible(false)}
      />
      <ConfirmModal
        visible={healthConfirmVisible}
        title={healthEditing ? "Update today's rating?" : 'Log lettuce health?'}
        message={selectedRating ? `Record today's rating as "${selectedRating}".` : ''}
        confirmLabel={healthEditing ? 'Save' : 'Data Log'}
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
  hint: { fontSize: 11, color: colors.textMuted, marginTop: spacing.sm, lineHeight: 16 },

  updateBox: { marginTop: spacing.lg, paddingTop: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: spacing.sm },
  ageInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, width: 120,
  },
  updateActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.lg },
  cancelLink: { paddingVertical: 12, paddingHorizontal: spacing.sm },
  cancelLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },

  ratingList: { gap: spacing.xs },
  ratingRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, paddingVertical: 8 },
  ratingText: { fontSize: 13, color: colors.textBody },
  ratingTextActive: { color: colors.textPrimary, fontWeight: '600' },
  loggedToday: { fontSize: 14, color: colors.okText, fontWeight: '600' },
  loggedTodayTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  editLink: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: spacing.md },
  editLinkText: { fontSize: 13, fontWeight: '600', color: colors.mint },

  logRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider,
  },
  noBorder: { borderBottomWidth: 0 },
  logDay: { fontSize: 12, color: colors.textMuted, fontWeight: '600' },
  logRating: { fontSize: 13, color: colors.textPrimary },
  emptyText: { fontSize: 13, color: colors.textMuted, paddingBottom: spacing.lg },
});
