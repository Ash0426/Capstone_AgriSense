// constants/theme.ts
// Central design tokens — mirrors style.css so the app matches the web dashboard.
// Edit colors here and they update everywhere in the app.

export const colors = {
  // Brand / sidebar
  sidebarBg: '#1a3d2e',
  brandIcon: '#6ee7b7',
  mint: '#3d9970',
  mintHover: '#2d7a57',

  // Surfaces
  background: '#f5f5f4',
  card: '#ffffff',
  border: '#e7e5e4',
  divider: '#f5f5f4',

  // Text
  textPrimary: '#1c1917',
  textSecondary: '#78716c',
  textMuted: '#a8a29e',
  textBody: '#44403c',
  white: '#ffffff',

  // Status badges
  okBg: '#d1fae5',
  okText: '#065f46',
  warnBg: '#fef3c7',
  warnText: '#92400e',
  dangerBg: '#fee2e2',
  dangerText: '#dc2626',

  // Icon chips
  iconBgGreen: '#d1fae5',
  iconBgBlue: '#dbeafe',
  iconBgAmber: '#fef3c7',
  iconGreen: '#065f46',
  iconBlue: '#1e40af',
  iconAmber: '#92400e',

  // Metric bar accents
  barTempStart: '#fb923c',
  barTempEnd: '#ef4444',
  barHumidStart: '#38bdf8',
  barHumidEnd: '#3b82f6',
  barSoilStart: '#92400e',
  barSoilEnd: '#fbbf24',
  barRainStart: '#a78bfa',
  barRainEnd: '#60a5fa',

  // Dots
  dotRed: '#ef4444',
  dotEmerald: '#34d399',
  dotBlue: '#60a5fa',
  dotBlueStrong: '#3b82f6',
  dotStone: '#a8a29e',

  danger: '#dc2626',
  dangerHover: '#b91c1c',
};

export const spacing = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 20,
  xxl: 24,
  xxxl: 28,
};

export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  pill: 999,
};

export const typography = {
  title: { fontSize: 24, fontWeight: '700' as const },
  screenTitle: { fontSize: 20, fontWeight: '700' as const },
  panelTitle: { fontSize: 15, fontWeight: '600' as const },
  label: { fontSize: 12, fontWeight: '500' as const },
  body: { fontSize: 14, fontWeight: '400' as const },
  metric: { fontSize: 28, fontWeight: '700' as const },
  small: { fontSize: 11, fontWeight: '400' as const },
};
