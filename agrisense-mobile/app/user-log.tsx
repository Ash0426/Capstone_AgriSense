// app/user-log.tsx
// "User Logs" — the registered users list: Username, User Type, Date of Creation.
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';
import { useFarmData } from '../context/FarmDataContext';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';

export default function UserLogScreen() {
  const { adminUsers } = useFarmData();

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}>
        <ScreenHeader title="User Logs" subtitle="Registered users and their roles" showBack />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={adminUsers}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <Card style={index !== adminUsers.length - 1 ? { marginBottom: spacing.sm } : undefined}>
            <View style={styles.row}>
              <View style={{ flex: 1 }}>
                <Text style={styles.username}>{item.username}</Text>
                <Text style={styles.created}>
                  Created {new Date(item.createdAt).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                </Text>
              </View>
              <Text style={styles.role}>{item.role}</Text>
            </View>
          </Card>
        )}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  row: { padding: spacing.lg, flexDirection: 'row', alignItems: 'center' },
  username: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  created: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  role: { fontSize: 12, color: colors.mint, fontWeight: '600' },
});
