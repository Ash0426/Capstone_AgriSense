// components/ui/Checkbox.tsx
// Simple checkbox (no extra dependency needed). Used for the Terms & Conditions field on login.
import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors, radius } from '../../constants/theme';

export default function Checkbox({ checked, onToggle }: { checked: boolean; onToggle: () => void }) {
  return (
    <TouchableOpacity onPress={onToggle} hitSlop={8} style={[styles.box, checked && styles.boxChecked]}>
      {checked && <Ionicons name="checkmark" size={14} color={colors.white} />}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  box: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.card,
  },
  boxChecked: { backgroundColor: colors.mint, borderColor: colors.mint },
});
