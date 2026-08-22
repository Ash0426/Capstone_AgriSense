// data/mockData.ts
// Placeholder / seed data for the pieces of the app that don't have a real backend endpoint
// yet (see the TODO comments in context/FarmDataContext.tsx for what each one needs server-side).
// Swap each of these for a real fetch() call once the backend endpoint exists — the screens
// that consume this data don't need to change shape-wise.

export type LettuceStage = 'seedling' | 'growth' | 'mature';
export type DurationUnit = 'day' | 'week';

export const stageOrder: LettuceStage[] = ['seedling', 'growth', 'mature'];
export const stageLabels: Record<LettuceStage, string> = {
  seedling: 'Seedling',
  growth: 'Growth',
  mature: 'Mature',
};

export const defaultLifecycle = {
  stage: 'seedling' as LettuceStage,
  durationValue: 1,
  durationUnit: 'day' as DurationUnit,
  setAt: new Date().toISOString(),
};

// Exact wording from the product spec — data-log health rating options, worst to best.
export const healthRatingOptions = [
  'Dried out',
  'Drooping',
  'Slight paleness',
  'Good color and firmness',
  'Vibrant green / firm and upright',
];

export const mockHeatIndex = 31; // °C — TODO: proxy a weather API (e.g. OpenWeather) server-side
export const mockWaterLevel = 72; // % — TODO: add a water_level column to sensor_readings + /sensors/latest

export type SensorKey = 'heatIndex' | 'soilMoisture' | 'airTemp' | 'waterLevel';

// changeThreshold: how much a reading has to move between polls to count as a "major shift"
// worth writing to that sensor's data log.
export const sensorMeta: Record<SensorKey, { label: string; unit: string; changeThreshold: number }> = {
  heatIndex: { label: 'Daily Heat Index', unit: '°C', changeThreshold: 2 },
  soilMoisture: { label: 'Soil Moisture', unit: '%', changeThreshold: 5 },
  airTemp: { label: 'Temperature', unit: '°C', changeThreshold: 2 },
  waterLevel: { label: 'Water Level', unit: '%', changeThreshold: 5 },
};

export type SensorLogEntry = { value: number; time: string; date: string };

export const initialSensorLogs: Record<SensorKey, SensorLogEntry[]> = {
  heatIndex: [{ value: 31, time: '9:00 AM', date: 'Aug 20' }],
  soilMoisture: [{ value: 48, time: '8:30 AM', date: 'Aug 20' }],
  airTemp: [{ value: 35.2, time: '8:30 AM', date: 'Aug 20' }],
  waterLevel: [{ value: 72, time: '9:00 AM', date: 'Aug 20' }],
};

export type Calibration = { min: number; max: number };

// TODO: PATCH these to a real /calibration endpoint once one exists — memory-only for now.
export const initialCalibration: Record<SensorKey, Calibration> = {
  heatIndex: { min: 15, max: 35 },
  soilMoisture: { min: 30, max: 70 },
  airTemp: { min: 18, max: 30 },
  waterLevel: { min: 20, max: 100 },
};

export type WeatherCondition = 'sunny' | 'cloudy' | 'rain';

export const weeklyWeatherMock: {
  day: string;
  date: string;
  condition: WeatherCondition;
  high: number;
  low: number;
  rainChance: number;
}[] = [
  { day: 'Mon', date: 'Aug 17', condition: 'sunny', high: 31, low: 23, rainChance: 5 },
  { day: 'Tue', date: 'Aug 18', condition: 'cloudy', high: 29, low: 22, rainChance: 20 },
  { day: 'Wed', date: 'Aug 19', condition: 'sunny', high: 32, low: 23, rainChance: 0 },
  { day: 'Thu', date: 'Aug 20', condition: 'rain', high: 26, low: 21, rainChance: 80 },
  { day: 'Fri', date: 'Aug 21', condition: 'rain', high: 25, low: 21, rainChance: 65 },
  { day: 'Sat', date: 'Aug 22', condition: 'sunny', high: 30, low: 22, rainChance: 10 },
  { day: 'Sun', date: 'Aug 23', condition: 'cloudy', high: 28, low: 22, rainChance: 30 },
];

export const defaultAutomationLimits = {
  soilMoistureLimit: 40, // % — below this, watering runs regardless of forecast
  tempLimit: 32, // °C — above this, watering runs regardless of forecast
};

export type NotificationCategory = 'watered' | 'tank-low' | 'limit-exceeded' | 'daily-status' | 'lifecycle-change';

export type NotificationItem = {
  id: string;
  category: NotificationCategory;
  icon: string;
  iconBg: 'green' | 'blue' | 'amber';
  title: string;
  desc: string;
  time: string;
};

export const initialNotifications: NotificationItem[] = [
  {
    id: 'n1',
    category: 'lifecycle-change',
    icon: 'leaf',
    iconBg: 'green',
    title: 'Lifecycle stage updated',
    desc: 'Stage set to Seedling (Day 1)',
    time: 'Yesterday · 07:00 AM',
  },
  {
    id: 'n2',
    category: 'daily-status',
    icon: 'sunny',
    iconBg: 'amber',
    title: 'Daily crop status',
    desc: 'Health logged: Good color and firmness',
    time: 'Yesterday · 09:00 AM',
  },
  {
    id: 'n3',
    category: 'watered',
    icon: 'water',
    iconBg: 'blue',
    title: 'Crop watered',
    desc: 'Soil moisture was 38% — watering completed',
    time: 'Yesterday · 06:15 PM',
  },
];

export const initialLifecycleLogs: { time: string; action: string; statusType: 'ok' | 'warn' | 'danger' }[] = [
  { time: 'Yesterday · 07:00 AM', action: 'Stage set to Seedling (Day 1)', statusType: 'ok' },
];

export type AdminUser = {
  id: string;
  username: string;
  email: string;
  role: 'Administrator' | 'User';
  createdAt: string;
};

export const initialAdminUsers: AdminUser[] = [
  { id: 'u1', username: 'Sarah Admin', email: 'sarah@agrisense.app', role: 'Administrator', createdAt: '2026-06-01T09:00:00.000Z' },
  { id: 'u2', username: 'Mark User', email: 'mark@agrisense.app', role: 'User', createdAt: '2026-07-12T14:10:00.000Z' },
];
