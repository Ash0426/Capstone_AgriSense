// data/mockData.ts
// Placeholder data shaped like what the Express/SQLite backend will eventually return.
// Swap each of these for a real fetch() call once the backend endpoints are ready —
// the screens that consume this data don't need to change shape-wise.

export const sensorReadings = {
  airTemp: { value: 35.2, unit: '°C', status: 'danger', label: 'Too Hot', optimal: '20°C - 24°C' },
  airHumidity: { value: 72, unit: '%', status: 'ok', label: 'Normal', optimal: '60% - 80%' },
  soilMoisture: { value: 48, unit: '%', status: 'warn', label: 'Dry', optimal: 'Threshold set at: 55%' },
  rain: { value: 0.0, unit: 'mm', status: 'ok', label: 'No Rain', optimal: 'No rainfall detected' },
};

export type SwitchKey = 'roof' | 'valve' | 'timer' | 'notifications' | 'skipRain';

export const automationSwitches: {
  key: SwitchKey;
  icon: string;
  iconBg: 'green' | 'blue' | 'amber';
  title: string;
  desc: string;
  value: boolean;
}[] = [
  { key: 'roof', icon: 'home', iconBg: 'green', title: 'Auto Roof', desc: 'Closes when it gets too hot', value: true },
  { key: 'valve', icon: 'water', iconBg: 'blue', title: 'Water Valve', desc: 'Opens to water the plants', value: false },
  { key: 'timer', icon: 'timer-outline', iconBg: 'green', title: 'Watering Timer', desc: 'Waters on a schedule', value: true },
  { key: 'notifications', icon: 'notifications', iconBg: 'amber', title: 'Notifications', desc: 'Sends alerts when something is wrong', value: true },
  { key: 'skipRain', icon: 'rainy', iconBg: 'green', title: 'Skip watering when raining', desc: 'Saves water automatically', value: true },
];

export const currentSchedule = {
  nextWatering: '06:03',
  duration: '12 min',
};

export const systemLogs = {
  tempHumidity: [
    { time: 'Jun 22 · 08:30', temp: '35.2°C', humidity: '72%', status: 'Too Hot', statusType: 'danger' },
    { time: 'Jun 22 · 08:00', temp: '33.8°C', humidity: '74%', status: 'Too Hot', statusType: 'danger' },
    { time: 'Jun 22 · 07:30', temp: '29.4°C', humidity: '76%', status: 'Normal', statusType: 'ok' },
    { time: 'Jun 22 · 07:00', temp: '27.1°C', humidity: '80%', status: 'Normal', statusType: 'ok' },
  ],
  soil: [
    { time: 'Jun 22 · 08:30', moisture: '48%', status: 'Dry', statusType: 'warn' },
    { time: 'Jun 22 · 08:00', moisture: '51%', status: 'Good', statusType: 'ok' },
  ],
  valve: [
    { time: 'Jun 22 · 08:32', action: 'Opened', duration: '—', reason: 'Soil too dry (below 55%)', statusType: 'ok' },
  ],
  roof: [
    { time: 'Jun 22 · 08:31', action: 'Closed', tempGauge: '35.2°C', statusType: 'danger' },
  ],
};

export const notifications = [
  { id: '1', icon: 'thermometer', iconBg: 'amber', title: 'High temperature alert', desc: 'Air temperature reached 35.2°C', time: '8:30 AM' },
  { id: '2', icon: 'water', iconBg: 'blue', title: 'Watering started', desc: 'Soil moisture dropped below 55% threshold', time: '8:32 AM' },
  { id: '3', icon: 'home', iconBg: 'green', title: 'Roof closed automatically', desc: 'Triggered by high temperature', time: '8:31 AM' },
  { id: '4', icon: 'checkmark-circle', iconBg: 'green', title: 'System check complete', desc: 'All sensors reporting normally', time: '7:00 AM' },
];

export const userActivityLog = [
  { id: '1', action: 'Changed watering threshold to 55%', time: 'Today · 08:12 AM' },
  { id: '2', action: 'Turned on Water Valve manually', time: 'Yesterday · 06:45 PM' },
  { id: '3', action: 'Updated profile email', time: 'Jul 12 · 02:10 PM' },
  { id: '4', action: 'Logged in from new device', time: 'Jul 10 · 09:00 AM' },
];

export const profileColors = ['#3d9970', '#2563eb', '#dc2626', '#a855f7', '#f59e0b'];
