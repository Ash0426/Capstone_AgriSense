// app/(tabs)/notification.tsx
// Notification tab — newest first. Exactly 5 categories, all pushed live from
// FarmDataContext: crop watered, tank low, limit exceeded, daily crop status, lifecycle change.
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { useFarmData } from '../../context/FarmDataContext';
import Card from '../../components/ui/Card';
import ListItem from '../../components/ui/ListItem';
import TopHeader from '../../components/ui/TopHeader';

export default function NotificationScreen() {
  const { notifications } = useFarmData();

  return (
    <View style={styles.flex}>
      <TopHeader />
      <View style={styles.headerPad}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSub}>Watering, tank level, limits, and crop status</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={notifications}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={
          <Card>
            <Text style={styles.empty}>No notifications yet.</Text>
          </Card>
        }
        renderItem={({ item }) => (
          <Card style={{ marginBottom: spacing.sm }}>
            <View style={styles.itemBody}>
              <ListItem
                icon={item.icon as any}
                iconBg={item.iconBg}
                title={item.title}
                desc={item.desc}
                noBorder
                right={<Text style={styles.time}>{item.time}</Text>}
              />
            </View>
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg, paddingBottom: spacing.sm },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: 2 },
  pageSub: { fontSize: 12, color: colors.textMuted },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  itemBody: { paddingHorizontal: spacing.lg },
  time: { fontSize: 11, color: colors.textMuted },
  empty: { padding: spacing.xl, textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
