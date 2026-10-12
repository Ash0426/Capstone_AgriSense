// app colors

export const colors = {
  // brand
  sidebarBg: '#1a3d2e',
  brandIcon: '#6ee7b7',
  mint: '#78b63b',
  mintHover: '#5c9c2d',
  mintGradient: ['#78b63b', '#5c9c2d'] as const,

  // backgrounds
  background: '#f5f5f4',
  card: '#ffffff',
  border: '#e7e5e4',
  divider: '#f5f5f4',

  // text
  textPrimary: '#1c1917',
  textSecondary: '#78716c',
  textMuted: '#a8a29e',
  textBody: '#44403c',
  textDarkGreen: '#1f4d1a',
  white: '#ffffff',

  // badges
  okBg: '#d1fae5',
  okText: '#065f46',
  warnBg: '#fef3c7',
  warnText: '#92400e',
  dangerBg: '#fee2e2',
  dangerText: '#dc2626',

  // icons
  iconBgGreen: '#d1fae5',
  iconBgBlue: '#dbeafe',
  iconBgAmber: '#fef3c7',
  iconGreen: '#065f46',
  iconBlue: '#1e40af',
  iconAmber: '#92400e',

  // sensor card colors
  metricTintHeat: '#fef1cd',
  metricTintSoil: '#dcefc9',
  metricTintTemp: '#fbdcd2',
  metricTintWater: '#dbeafe',

  // dots
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
