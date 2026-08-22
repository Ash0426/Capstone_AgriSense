// app/(tabs)/profile.tsx
// Profile tab: one card holding username/role (read-only) + email/password (editable via the
// corner Edit button), admin-only collapsed Create New User, Settings (User Logs / System
// Logs), Log Out.
import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { useFarmData } from '../../context/FarmDataContext';
import { updateMe } from '../../api/endpoints';
import { ApiError } from '../../api/client';
import Card from '../../components/ui/Card';
import PanelHeader from '../../components/ui/PanelHeader';
import ListItem from '../../components/ui/ListItem';
import Button from '../../components/ui/Button';
import ConfirmModal from '../../components/ui/ConfirmModal';

export default function ProfileScreen() {
  const { user, setUser, logout } = useAuth();
  const { addAdminUser } = useFarmData();

  const [editing, setEditing] = useState(false);
  const [email, setEmail] = useState(user?.email ?? '');
  const [password, setPassword] = useState('');
  const [saveConfirmVisible, setSaveConfirmVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUsername, setNewUsername] = useState('');
  const [newEmail, setNewEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [createConfirmVisible, setCreateConfirmVisible] = useState(false);

  const [logoutVisible, setLogoutVisible] = useState(false);

  const isAdmin = user?.role === 'Administrator';

  const openEdit = () => {
    setEmail(user?.email ?? '');
    setPassword('');
    setEditing(true);
  };

  const confirmSave = async () => {
    setSaving(true);
    try {
      const updated = await updateMe(password ? { email: email.trim(), password } : { email: email.trim() });
      setUser(updated);
      setPassword('');
      setEditing(false);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not update your profile.';
      Alert.alert('Update failed', message);
    } finally {
      setSaving(false);
      setSaveConfirmVisible(false);
    }
  };

  const confirmCreateUser = () => {
    addAdminUser({ username: newUsername.trim(), email: newEmail.trim(), role: 'User' });
    setNewUsername('');
    setNewEmail('');
    setNewPassword('');
    setShowCreateUser(false);
    setCreateConfirmVisible(false);
    // TODO: this only adds the user to local state — see addAdminUser in FarmDataContext for
    // the real POST /users endpoint this should call once it exists.
  };

  const requestCreateUser = () => {
    if (!newUsername || !newEmail || !newPassword) {
      Alert.alert('Missing info', 'Enter a username, email, and password for the new user.');
      return;
    }
    setCreateConfirmVisible(true);
  };

  const handleLogout = () => {
    setLogoutVisible(false);
    logout();
    router.replace('/login');
  };

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <Text style={styles.pageTitle}>Profile</Text>

        <Card style={styles.section}>
          <View style={styles.profileHeader}>
            <View style={[styles.avatar, { backgroundColor: user?.color || colors.mint }]}>
              <Text style={styles.avatarInitial}>{(user?.name || 'U').charAt(0)}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.userName}>{user?.name ?? '—'}</Text>
              <Text style={styles.userRole}>{user?.role ?? '—'}</Text>
            </View>
          </View>

          <View style={styles.body}>
            <Text style={styles.fieldLabel}>Email</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={email}
                onChangeText={setEmail}
                autoCapitalize="none"
                keyboardType="email-address"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.readValue}>{user?.email ?? '—'}</Text>
            )}

            <Text style={[styles.fieldLabel, { marginTop: spacing.lg }]}>Password</Text>
            {editing ? (
              <TextInput
                style={styles.input}
                value={password}
                onChangeText={setPassword}
                secureTextEntry
                placeholder="New password (leave blank to keep current)"
                placeholderTextColor={colors.textMuted}
              />
            ) : (
              <Text style={styles.readValue}>••••••••</Text>
            )}
          </View>

          <View style={styles.cornerBtnRow}>
            {editing ? (
              <>
                <TouchableOpacity onPress={() => setEditing(false)} style={styles.cancelLink}>
                  <Text style={styles.cancelLinkText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.cornerBtn} onPress={() => setSaveConfirmVisible(true)}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                  <Text style={styles.cornerBtnText}>Save</Text>
                </TouchableOpacity>
              </>
            ) : (
              <TouchableOpacity style={styles.cornerBtn} onPress={openEdit}>
                <Ionicons name="create-outline" size={14} color={colors.white} />
                <Text style={styles.cornerBtnText}>Edit</Text>
              </TouchableOpacity>
            )}
          </View>
        </Card>

        {isAdmin && (
          <Card style={styles.section}>
            {!showCreateUser ? (
              <View style={styles.body}>
                <Button label="Create New User" variant="outline" onPress={() => setShowCreateUser(true)} />
              </View>
            ) : (
              <>
                <PanelHeader title="Create New User" />
                <View style={styles.body}>
                  <TextInput
                    style={styles.stackedInput}
                    value={newUsername}
                    onChangeText={setNewUsername}
                    placeholder="Username"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.stackedInput}
                    value={newEmail}
                    onChangeText={setNewEmail}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={colors.textMuted}
                  />
                  <TextInput
                    style={styles.stackedInput}
                    value={newPassword}
                    onChangeText={setNewPassword}
                    placeholder="Password"
                    secureTextEntry
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.createActions}>
                    <TouchableOpacity onPress={() => setShowCreateUser(false)} style={styles.cancelLink}>
                      <Text style={styles.cancelLinkText}>Cancel</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Button label="Create" onPress={requestCreateUser} />
                    </View>
                  </View>
                </View>
              </>
            )}
          </Card>
        )}

        <Card style={styles.section}>
          <PanelHeader title="Settings" />
          <View style={styles.body}>
            <TouchableOpacity onPress={() => router.push('/user-log')}>
              <ListItem
                icon="people-outline"
                iconBg="blue"
                title="User Logs"
                desc="Registered users and their roles"
                right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
              />
            </TouchableOpacity>
            <TouchableOpacity onPress={() => router.push('/system-logs')}>
              <ListItem
                icon="document-text-outline"
                iconBg="green"
                title="System Logs"
                desc="Everything happening in the system"
                right={<Ionicons name="chevron-forward" size={18} color={colors.textMuted} />}
                noBorder
              />
            </TouchableOpacity>
          </View>
        </Card>

        <TouchableOpacity style={styles.logoutBtn} onPress={() => setLogoutVisible(true)}>
          <Ionicons name="log-out-outline" size={18} color={colors.danger} />
          <Text style={styles.logoutText}>Log Out</Text>
        </TouchableOpacity>

        <ConfirmModal
          visible={saveConfirmVisible}
          title="Save profile changes?"
          message="This updates the email and/or password used to log in."
          confirmLabel="Save"
          onConfirm={confirmSave}
          onCancel={() => setSaveConfirmVisible(false)}
        />
        <ConfirmModal
          visible={createConfirmVisible}
          title="Create new user?"
          message={`Add "${newUsername}" as a new user.`}
          confirmLabel="Create"
          onConfirm={confirmCreateUser}
          onCancel={() => setCreateConfirmVisible(false)}
        />
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
    </SafeAreaView>
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
  userRole: { fontSize: 11, color: colors.mint, marginTop: 2, fontWeight: '600' },
  body: { paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  fieldLabel: { fontSize: 12, fontWeight: '600', color: colors.textSecondary, marginBottom: 6 },
  readValue: { fontSize: 14, color: colors.textPrimary },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
  stackedInput: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary, marginBottom: spacing.sm,
  },
  cornerBtnRow: { flexDirection: 'row', justifyContent: 'flex-end', alignItems: 'center', gap: spacing.md, paddingHorizontal: spacing.lg, paddingBottom: spacing.lg },
  cancelLink: { paddingVertical: 8, paddingHorizontal: spacing.sm },
  cancelLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
  cornerBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    backgroundColor: colors.mint, borderRadius: radius.pill, paddingHorizontal: spacing.md, paddingVertical: 8,
  },
  cornerBtnText: { fontSize: 12, fontWeight: '700', color: colors.white },
  createActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  logoutBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.card, borderWidth: 1, borderColor: colors.dangerBg,
    borderRadius: radius.md, paddingVertical: 14,
  },
  logoutText: { fontSize: 14, fontWeight: '600', color: colors.danger },
});
