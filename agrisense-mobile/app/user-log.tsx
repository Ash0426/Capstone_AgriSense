// app/user-log.tsx
// Full history of this specific user's actions in the system (audit trail).
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { userActivityLog } from '../data/mockData';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';

export default function UserLogScreen() {
  return (
    <View style={styles.flex}>
      <View style={styles.headerPad}>
        <ScreenHeader title="User Log" subtitle="Everything you've done in AgriSense" showBack />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={userActivityLog}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Card style={index !== userActivityLog.length - 1 ? { marginBottom: spacing.sm } : undefined}>
            <View style={styles.row}>
              <Text style={styles.action}>{item.action}</Text>
              <Text style={styles.time}>{item.time}</Text>
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  row: { padding: spacing.lg },
  action: { fontSize: 14, color: colors.textPrimary, fontWeight: '500' },
  time: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
});
