// app/edit-profile.tsx
// Edit profile modal: avatar color (5 options), name, password, email, user type.
// Confirms before saving via ConfirmModal, per spec.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../constants/theme';
import { profileColors } from '../data/mockData';
import ScreenHeader from '../components/ui/ScreenHeader';
import Button from '../components/ui/Button';
import ConfirmModal from '../components/ui/ConfirmModal';

const USER_TYPES = ['Administrator', 'Manager', 'Viewer'];

export default function EditProfileScreen() {
  const [name, setName] = useState('Farmer');
  const [email, setEmail] = useState('farmer@agrisense.app');
  const [password, setPassword] = useState('');
  const [userType, setUserType] = useState('Administrator');
  const [color, setColor] = useState(profileColors[0]);
  const [confirmVisible, setConfirmVisible] = useState(false);
  const [saving, setSaving] = useState(false);

  const requestSave = () => {
    if (!name || !email) {
      Alert.alert('Missing info', 'Name and email are required.');
      return;
    }
    setConfirmVisible(true);
  };

  const confirmSave = () => {
    setConfirmVisible(false);
    setSaving(true);
    // TODO: PATCH { name, email, password, userType, color } to your /users/:id endpoint
    setTimeout(() => {
      setSaving(false);
      router.back();
    }, 500);
  };

  return (
    <ScrollView style={styles.flex} contentContainerStyle={styles.scroll}>
      <ScreenHeader title="Edit Profile" showBack />

      <Text style={styles.fieldLabel}>Profile color</Text>
      <View style={styles.colorRow}>
        {profileColors.map((c) => (
          <TouchableOpacity key={c} onPress={() => setColor(c)} style={[styles.colorDot, { backgroundColor: c }]}>
            {color === c && <Ionicons name="checkmark" size={18} color={colors.white} />}
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Name</Text>
        <TextInput style={styles.input} value={name} onChangeText={setName} placeholderTextColor={colors.textMuted} />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>Email</Text>
        <TextInput
          style={styles.input}
          value={email}
          onChangeText={setEmail}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>New password (leave blank to keep current)</Text>
        <TextInput
          style={styles.input}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          placeholder="••••••••"
          placeholderTextColor={colors.textMuted}
        />
      </View>

      <View style={styles.field}>
        <Text style={styles.fieldLabel}>User type</Text>
        <View style={styles.typeRow}>
          {USER_TYPES.map((t) => (
            <TouchableOpacity
              key={t}
              onPress={() => setUserType(t)}
              style={[styles.typeChip, userType === t && styles.typeChipActive]}
            >
              <Text style={[styles.typeChipText, userType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      <Button label="Save Changes" onPress={requestSave} loading={saving} style={{ marginTop: spacing.md }} />

      <ConfirmModal
        visible={confirmVisible}
        title="Save changes?"
        message="This will update your profile information."
        confirmLabel="Save"
        onConfirm={confirmSave}
        onCancel={() => setConfirmVisible(false)}
      />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.xl, paddingBottom: 40 },
  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 8 },
  input: {
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card, borderRadius: radius.md,
    paddingHorizontal: spacing.md, paddingVertical: 12, fontSize: 14, color: colors.textPrimary,
  },
  colorRow: { flexDirection: 'row', gap: spacing.md, marginBottom: spacing.xl },
  colorDot: { width: 36, height: 36, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
  typeRow: { flexDirection: 'row', gap: spacing.sm },
  typeChip: {
    paddingHorizontal: spacing.md, paddingVertical: 8, borderRadius: radius.pill,
    borderWidth: 1, borderColor: colors.border, backgroundColor: colors.card,
  },
  typeChipActive: { backgroundColor: colors.mint, borderColor: colors.mint },
  typeChipText: { fontSize: 12, fontWeight: '600', color: colors.textSecondary },
  typeChipTextActive: { color: colors.white },
});
