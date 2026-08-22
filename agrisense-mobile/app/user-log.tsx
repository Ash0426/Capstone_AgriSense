// app/user-log.tsx
// "Users" — full admin user management: Username, User Type, hashed Password, Date Created,
// each with Edit / Disable / Delete actions. Backed by the real admin-only /users endpoints.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, FlatList, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import { useAuth } from '../context/AuthContext';
import { useFarmData } from '../context/FarmDataContext';
import { AdminUserRecord } from '../api/endpoints';
import { ApiError } from '../api/client';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

export default function UserLogScreen() {
  const { user: currentUser } = useAuth();
  const { adminUsers, updateUserRecord, deleteUserRecord } = useFarmData();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState('');
  const [editEmail, setEditEmail] = useState('');
  const [editRole, setEditRole] = useState<'Administrator' | 'User'>('User');
  const [saveConfirmId, setSaveConfirmId] = useState<number | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<number | null>(null);
  const [disableConfirmId, setDisableConfirmId] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  const openEdit = (u: AdminUserRecord) => {
    setEditName(u.name);
    setEditEmail(u.email);
    setEditRole(u.role);
    setEditingId(u.id);
  };

  const confirmSaveEdit = async () => {
    if (saveConfirmId == null) return;
    setBusy(true);
    try {
      await updateUserRecord(saveConfirmId, { name: editName.trim(), email: editEmail.trim(), role: editRole });
      setEditingId(null);
    } catch (err) {
      Alert.alert('Update failed', err instanceof ApiError ? err.message : 'Could not update this user.');
    } finally {
      setBusy(false);
      setSaveConfirmId(null);
    }
  };

  const confirmToggleDisable = async () => {
    if (disableConfirmId == null) return;
    const target = adminUsers.find((u) => u.id === disableConfirmId);
    if (!target) return;
    setBusy(true);
    try {
      await updateUserRecord(disableConfirmId, { disabled: !target.disabled });
    } catch (err) {
      Alert.alert('Update failed', err instanceof ApiError ? err.message : 'Could not update this user.');
    } finally {
      setBusy(false);
      setDisableConfirmId(null);
    }
  };

  const confirmDelete = async () => {
    if (deleteConfirmId == null) return;
    setBusy(true);
    try {
      await deleteUserRecord(deleteConfirmId);
    } catch (err) {
      Alert.alert('Delete failed', err instanceof ApiError ? err.message : 'Could not delete this user.');
    } finally {
      setBusy(false);
      setDeleteConfirmId(null);
    }
  };

  const disableTarget = adminUsers.find((u) => u.id === disableConfirmId);

  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <View style={styles.headerPad}>
        <ScreenHeader title="Users" subtitle="Manage registered accounts" showBack />
      </View>
      <FlatList
        contentContainerStyle={styles.list}
        data={adminUsers}
        keyExtractor={(item) => String(item.id)}
        ListEmptyComponent={<Text style={styles.emptyText}>No users found.</Text>}
        renderItem={({ item, index }) => {
          const isSelf = item.id === currentUser?.id;
          const isEditing = editingId === item.id;
          return (
            <Card style={index !== adminUsers.length - 1 ? { marginBottom: spacing.sm } : undefined}>
              <View style={styles.row}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.username}>{item.name}{item.disabled ? '  (Disabled)' : ''}</Text>
                  <Text style={styles.hash} numberOfLines={1}>{item.password_hash}</Text>
                  <Text style={styles.created}>
                    Created {new Date(item.created_at).toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' })}
                  </Text>
                </View>
                <Text style={styles.role}>{item.role}</Text>
              </View>

              {isEditing ? (
                <View style={styles.editBody}>
                  <TextInput style={styles.input} value={editName} onChangeText={setEditName} placeholder="Username" placeholderTextColor={colors.textMuted} />
                  <TextInput
                    style={styles.input}
                    value={editEmail}
                    onChangeText={setEditEmail}
                    placeholder="Email"
                    autoCapitalize="none"
                    keyboardType="email-address"
                    placeholderTextColor={colors.textMuted}
                  />
                  <View style={styles.roleRow}>
                    {(['User', 'Administrator'] as const).map((r) => (
                      <TouchableOpacity key={r} onPress={() => setEditRole(r)} style={[styles.roleChip, editRole === r && styles.roleChipActive]}>
                        <Text style={[styles.roleChipText, editRole === r && styles.roleChipTextActive]}>{r}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                  <View style={styles.editActions}>
                    <TouchableOpacity onPress={() => setEditingId(null)} style={styles.cancelLink}>
                      <Text style={styles.cancelLinkText}>Cancel</Text>
                    </TouchableOpacity>
                    <View style={{ flex: 1 }}>
                      <Button label="Save" onPress={() => setSaveConfirmId(item.id)} loading={busy} />
                    </View>
                  </View>
                </View>
              ) : (
                <View style={styles.actionsRow}>
                  <TouchableOpacity style={styles.actionBtn} onPress={() => openEdit(item)}>
                    <Ionicons name="create-outline" size={16} color={colors.textSecondary} />
                    <Text style={styles.actionText}>Edit</Text>
                  </TouchableOpacity>
                  {!isSelf && (
                    <>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setDisableConfirmId(item.id)}>
                        <Ionicons name={item.disabled ? 'eye-outline' : 'eye-off-outline'} size={16} color={colors.warnText} />
                        <Text style={[styles.actionText, { color: colors.warnText }]}>{item.disabled ? 'Enable' : 'Disable'}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.actionBtn} onPress={() => setDeleteConfirmId(item.id)}>
                        <Ionicons name="trash-outline" size={16} color={colors.danger} />
                        <Text style={[styles.actionText, { color: colors.danger }]}>Delete</Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              )}
            </Card>
          );
        }}
      />

      <ConfirmModal
        visible={saveConfirmId != null}
        title="Save user changes?"
        message={`Update ${editName || 'this user'}'s username, email, and role.`}
        confirmLabel="Save"
        onConfirm={confirmSaveEdit}
        onCancel={() => setSaveConfirmId(null)}
      />
      <ConfirmModal
        visible={disableConfirmId != null}
        title={disableTarget?.disabled ? 'Enable this user?' : 'Disable this user?'}
        message={
          disableTarget?.disabled
            ? 'They will be able to log in again.'
            : "They won't be able to log in until re-enabled."
        }
        confirmLabel={disableTarget?.disabled ? 'Enable' : 'Disable'}
        danger={!disableTarget?.disabled}
        onConfirm={confirmToggleDisable}
        onCancel={() => setDisableConfirmId(null)}
      />
      <ConfirmModal
        visible={deleteConfirmId != null}
        title="Delete this user?"
        message="This permanently removes their account and can't be undone."
        confirmLabel="Delete"
        danger
        onConfirm={confirmDelete}
        onCancel={() => setDeleteConfirmId(null)}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  headerPad: { paddingHorizontal: spacing.lg, paddingTop: spacing.lg },
  list: { padding: spacing.lg, paddingTop: spacing.sm },
  row: { padding: spacing.lg, flexDirection: 'row', alignItems: 'flex-start' },
  username: { fontSize: 14, color: colors.textPrimary, fontWeight: '700' },
  hash: { fontSize: 10, color: colors.textMuted, marginTop: 4, fontFamily: 'monospace' },
  created: { fontSize: 11, color: colors.textMuted, marginTop: 4 },
  role: { fontSize: 12, color: colors.mint, fontWeight: '600' },
  emptyText: { fontSize: 13, color: colors.textMuted, textAlign: 'center', padding: spacing.xl },

  actionsRow: { flexDirection: 'row', borderTopWidth: 1, borderTopColor: colors.divider },
  actionBtn: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: spacing.md },
  actionText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },

  editBody: { padding: spacing.lg, borderTopWidth: 1, borderTopColor: colors.divider, gap: spacing.sm },
  input: {
    borderWidth: 1, borderColor: colors.border, borderRadius: radius.sm, backgroundColor: colors.background,
    paddingHorizontal: spacing.md, paddingVertical: 10, fontSize: 14, color: colors.textPrimary,
  },
  roleRow: { flexDirection: 'row', gap: spacing.sm },
  roleChip: { paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill, borderWidth: 1, borderColor: colors.border, backgroundColor: colors.background },
  roleChipActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  roleChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  roleChipTextActive: { color: colors.white },
  editActions: { flexDirection: 'row', alignItems: 'center', gap: spacing.md, marginTop: spacing.sm },
  cancelLink: { paddingVertical: 12, paddingHorizontal: spacing.sm },
  cancelLinkText: { fontSize: 13, fontWeight: '600', color: colors.textSecondary },
});
