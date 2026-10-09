// components/ui/HealthCalendar.tsx
// Month-grid calendar for Lettuce Health — one entry per day, color-coded by rating (see
// healthRatingColors in data/mockData.ts). Every day is tappable; a modal shows that day's
// status (or "No rating logged" if nothing was recorded). Self-built, no calendar library.
import React, { useMemo, useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Modal, Pressable } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius, spacing } from '../../constants/theme';
import { healthRatingColors } from '../../data/mockData';
import Button from './Button';

const WEEKDAYS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];

type HealthEntry = { id: string; rating: string; loggedAt: string; note?: string };

function dateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

export default function HealthCalendar({ entries }: { entries: HealthEntry[] }) {
  const [viewMonth, setViewMonth] = useState(() => {
    const now = new Date();
    return new Date(now.getFullYear(), now.getMonth(), 1);
  });
  const [selected, setSelected] = useState<Date | null>(null);

  const answerByDate = useMemo(() => {
    const map: Record<string, HealthEntry> = {};
    for (const e of entries) {
      const k = dateKey(new Date(e.loggedAt));
      if (!map[k]) map[k] = e;
    }
    return map;
  }, [entries]);

  const year = viewMonth.getFullYear();
  const month = viewMonth.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const totalDays = new Date(year, month + 1, 0).getDate();

  const cells: (number | null)[] = [
    ...Array(firstWeekday).fill(null),
    ...Array.from({ length: totalDays }, (_, i) => i + 1),
  ];
  while (cells.length % 7 !== 0) cells.push(null);

  const now = new Date();
  const isCurrentOrFutureMonth = year > now.getFullYear() || (year === now.getFullYear() && month >= now.getMonth());

  const selectedEntry = selected ? answerByDate[dateKey(selected)] : undefined;

  return (
    <View>
      <View style={styles.monthRow}>
        <TouchableOpacity onPress={() => setViewMonth(new Date(year, month - 1, 1))} hitSlop={8}>
          <Ionicons name="chevron-back" size={20} color={colors.textDarkGreen} />
        </TouchableOpacity>
        <Text style={styles.monthLabel}>
          {viewMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
        </Text>
        <TouchableOpacity
          onPress={() => !isCurrentOrFutureMonth && setViewMonth(new Date(year, month + 1, 1))}
          disabled={isCurrentOrFutureMonth}
          hitSlop={8}
        >
          <Ionicons name="chevron-forward" size={20} color={isCurrentOrFutureMonth ? colors.textMuted : colors.textDarkGreen} />
        </TouchableOpacity>
      </View>

      <View style={styles.weekdayRow}>
        {WEEKDAYS.map((w, i) => (
          <Text key={i} style={styles.weekdayText}>{w}</Text>
        ))}
      </View>

      <View style={styles.grid}>
        {cells.map((day, i) => {
          if (day === null) return <View key={i} style={styles.cell} />;
          const date = new Date(year, month, day);
          const entry = answerByDate[dateKey(date)];
          const dotColor = entry ? healthRatingColors[entry.rating] : undefined;
          return (
            <TouchableOpacity key={i} style={styles.cell} onPress={() => setSelected(date)}>
              <View style={[styles.dayCircle, dotColor ? { backgroundColor: dotColor } : undefined]}>
                <Text style={[styles.dayText, dotColor && styles.dayTextOnColor]}>{day}</Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>

      <Modal visible={!!selected} transparent animationType="fade" onRequestClose={() => setSelected(null)}>
        <Pressable style={styles.backdrop} onPress={() => setSelected(null)}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <Text style={styles.modalDate}>
              {selected?.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric', year: 'numeric' })}
            </Text>
            {selectedEntry ? (
              <View style={styles.modalEntryRow}>
                <View style={[styles.modalDot, { backgroundColor: healthRatingColors[selectedEntry.rating] }]} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.modalRating}>{selectedEntry.rating}</Text>
                  <Text style={styles.modalTime}>
                    {new Date(selectedEntry.loggedAt).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                  </Text>
                </View>
              </View>
            ) : (
              <Text style={styles.modalEmpty}>No rating logged for this day.</Text>
            )}
            {selectedEntry?.note ? (
              <View style={styles.noteBox}>
                <Text style={styles.noteLabel}>Note</Text>
                <Text style={styles.noteText}>{selectedEntry.note}</Text>
              </View>
            ) : null}
            <Button label="Close" variant="outline" onPress={() => setSelected(null)} style={{ marginTop: spacing.lg }} />
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  monthRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: spacing.md },
  monthLabel: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  weekdayRow: { flexDirection: 'row', marginBottom: 4 },
  weekdayText: { flexBasis: '14.28%', textAlign: 'center', fontSize: 11, fontWeight: '600', color: colors.textSecondary },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  cell: { flexBasis: '14.28%', alignItems: 'center', justifyContent: 'center', paddingVertical: 4 },
  dayCircle: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  dayText: { fontSize: 12, color: colors.textBody },
  dayTextOnColor: { color: colors.white, fontWeight: '700' },

  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', alignItems: 'center', justifyContent: 'center', padding: spacing.xl },
  modalCard: { width: '100%', backgroundColor: colors.card, borderRadius: radius.lg, padding: spacing.xl },
  modalDate: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.md },
  modalEntryRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.md },
  modalDot: { width: 16, height: 16, borderRadius: 8 },
  modalRating: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  modalTime: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  modalEmpty: { fontSize: 13, color: colors.textMuted },
  noteBox: { marginTop: spacing.md, padding: spacing.md, borderRadius: radius.sm, backgroundColor: colors.background },
  noteLabel: { fontSize: 11, fontWeight: '700', color: colors.textDarkGreen, marginBottom: 2 },
  noteText: { fontSize: 13, color: colors.textBody, lineHeight: 18 },
});
