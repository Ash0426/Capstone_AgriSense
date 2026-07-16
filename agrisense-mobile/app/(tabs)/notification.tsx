// app/(tabs)/notification.tsx
// Notification tab: system alerts and events, newest first. Point this at your
// notifications/alerts table so it updates as new sensor events come in.
import React from 'react';
import { View, Text, StyleSheet, FlatList } from 'react-native';
import { colors, spacing } from '../../constants/theme';
import { notifications } from '../../data/mockData';
import Card from '../../components/ui/Card';
import ListItem from '../../components/ui/ListItem';

export default function NotificationScreen() {
  return (
    <View style={styles.flex}>
      <View style={styles.headerPad}>
        <Text style={styles.pageTitle}>Notifications</Text>
        <Text style={styles.pageSub}>Recent alerts and system activity</Text>
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={notifications}
        keyExtractor={(item) => item.id}
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
                iconBg={item.iconBg as any}
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
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary },
  pageSub: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  itemBody: { paddingHorizontal: spacing.lg },
  time: { fontSize: 11, color: colors.textMuted },
  empty: { padding: spacing.xl, textAlign: 'center', color: colors.textMuted, fontSize: 13 },
});
