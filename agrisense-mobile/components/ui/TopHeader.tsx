// components/ui/TopHeader.tsx
// Shared top nav bar for the three tab screens (Dashboard, Notifications, Profile): just the
// logo-straight brand mark. The tab's own page label lives on the page content below this,
// left-aligned — not in the nav bar itself.
import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors, spacing } from '../../constants/theme';

export default function TopHeader() {
  const insets = useSafeAreaInsets();

  return (
    <View style={[styles.wrap, { paddingTop: insets.top + spacing.sm }]}>
      <Image source={require('../../assets/images/logo-straight.png')} style={styles.logo} resizeMode="contain" />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.md,
    backgroundColor: colors.card,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  logo: { width: 150, height: 29 },
});
