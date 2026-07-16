// app/(tabs)/profile.tsx
// Profile tab: profile summary + edit link, user activity log, settings, log out (confirmed).
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../../constants/theme';
import { userActivityLog } from '../../data/mockData';
import Card from '../../components/ui/Card';
import PanelHeader from '../../components/ui/PanelHeader';
import ListItem from '../../components/ui/ListItem';
import ConfirmModal from '../../components/ui/ConfirmModal';

// TODO: replace with the logged-in user from your auth/session state
const currentUser = { name: 'Farmer', email: 'farmer@agrisense.app', role: 'Administrator', color: '#3d9970' };

export default function ProfileScreen() {
  const [logoutVisible, setLogoutVisible] = useState(false);

  const handleLogout = () => {
    setLogoutVisible(false);
    // TODO: clear session/token here
    router.replace('/login');
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <Text style={styles.pageTitle}>Profile</Text>

      <Card style={styles.section}>
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: currentUser.color }]}>
            <Text style={styles.avatarInitial}>{currentUser.name.charAt(0)}</Text>
          </View>
          <View style={{ flex: 1 }}>
            <Text style={styles.userName}>{currentUser.name}</Text>
            <Text style={styles.userEmail}>{currentUser.email}</Text>
            <Text style={styles.userRole}>{currentUser.role}</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.editBtn} onPress={() => router.push('/edit-profile')}>
          <Ionicons name="create-outline" size={16} color={colors.mint} />
          <Text style={styles.editBtnText}>Edit Profile</Text>
        </TouchableOpacity>
      </Card>

      <Card style={styles.section}>
        <PanelHeader
          title="User Log"
          subtitle="What you've done in the system"
          right={
            <TouchableOpacity onPress={() => router.push('/user-log')}>
              <Text style={styles.viewAll}>View all</Text>
            </TouchableOpacity>
          }
        />
        <View style={styles.body}>
          {userActivityLog.slice(0, 3).map((log, i) => (
            <View key={log.id} style={[styles.logRow, i === 2 && styles.noBorder]}>
              <Text style={styles.logAction}>{log.action}</Text>
              <Text style={styles.logTime}>{log.time}</Text>
            </View>
          ))}
        </View>
      </Card>

      <Card style={styles.section}>
        <PanelHeader title="Settings" />
        <View style={styles.body}>
          <ListItem icon="notifications-outline" iconBg="amber" title="Notification preferences" />
          <ListItem icon="lock-closed-outline" iconBg="blue" title="Privacy & security" />
          <ListItem icon="help-circle-outline" iconBg="green" title="Help & support" noBorder />
        </View>
      </Card>

      <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutVisible(true)}>
        <Ionicons name="log-out-outline" size={18} color={colors.danger} />
        <Text style={styles.logoutText}>Log Out</Text>
      </TouchableOpacity>

      <ConfirmModal
        visible={logoutVisible}
        title="Log out?"
        message="You'll need to log in again to access your dashboard."
        confirmLabel="Log Out"
        danger
        onConfirm={handleLogout}
        onCancel={() => setLogoutVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  pageTitle: { fontSize: 22, fontWeight: '700', color: colors.textPrimary, marginBottom: spacing.lg },
  section: { marginBottom: spacing.lg },
  profileHeader: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, padding: spacing.lg },
  avatar: { width: 56, height: 56, borderRadius: 28, alignItems: 'center', justifyContent: 'center' },
  avatarInitial: { fontSize: 22, fontWeight: '700', color: colors.white },
  userName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  userEmail: { fontSize: 12, color: colors.textMuted, marginTop: 2 },
  userRole: { fontSize: 11, color: colors.mint, marginTop: 2, fontWeight: '600' },
  editBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    marginHorizontal: spacing.lg, marginBottom: spacing.lg, paddingVertical: 10,
    borderRadius: radius.md, borderWidth: 1, borderColor: colors.mint,
  },
  editBtnText: { fontSize: 13, fontWeight: '600', color: colors.mint },
  body: { paddingHorizontal: spacing.lg },
  viewAll: { fontSize: 12, fontWeight: '600', color: colors.mint },
  logRow: { paddingVertical: spacing.md, borderBottomWidth: 1, borderBottomColor: colors.divider },
  noBorder: { borderBottomWidth: 0 },
  logAction: { fontSize: 13, color: colors.textPrimary },
  logTime: { fontSize: 11, color: colors.textMuted, marginTop: 2 },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.dangerBg,
    borderRadius: radius.md, paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
