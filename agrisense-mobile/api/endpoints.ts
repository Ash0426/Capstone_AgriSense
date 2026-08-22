// api/endpoints.ts
// One typed function per backend route (see server/API_CONTRACT.md). Screens import
// from here instead of calling api.get/post directly, so typos in a URL only need fixing once.
import { api } from './client';

// ---- Auth ----
export type AuthUser = { id: number; name: string; email: string; role: string; color: string };

export const login = (email: string, password: string) =>
  api.post<{ token: string; user: AuthUser }>('/auth/login', { email, password });

export const requestPasswordOtp = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password/request', { email });

export const resetPassword = (email: string, otp: string, newPassword: string) =>
  api.post<{ message: string }>('/auth/forgot-password/reset', { email, otp, newPassword });

// Login step-up OTP (required when the last successful login was 24h+ ago). Mirrors the
// forgot-password OTP flow: 6-digit code, emailed via Nodemailer, 10 min expiry.
export const sendLoginStepUpOtp = (email: string) =>
  api.post<{ message: string }>('/auth/login/request-otp', { email });

export const verifyLoginStepUpOtp = (email: string, otp: string) =>
  api.post<{ message: string }>('/auth/login/verify-otp', { email, otp });

// ---- Sensors ----
export type SensorReading = {
  airTemp: number; airTempStatus: 'ok' | 'warn' | 'danger'; airTempLabel: string;
  airHumidity: number; airHumidityStatus: 'ok' | 'warn' | 'danger'; airHumidityLabel: string;
  soilMoisture: number; soilMoistureStatus: 'ok' | 'warn' | 'danger'; soilMoistureLabel: string;
  rain: number; rainStatus: 'ok' | 'warn' | 'danger'; rainLabel: string;
  waterLevel: number;
  updatedAt: string;
};

export const getLatestSensorReading = () => api.get<SensorReading>('/sensors/latest');

// ---- Switches ----
export type SwitchesState = { roof: boolean; valve: boolean; timer: boolean; notifications: boolean; skipRain: boolean };

export const getSwitches = () => api.get<SwitchesState>('/switches');
export const setSwitch = (key: keyof SwitchesState, value: boolean) =>
  api.patch<{ key: string; value: boolean }>(`/switches/${key}`, { value });

// ---- Logs ----
export type LogType =
  | 'temp-humidity' | 'soil' | 'valve' | 'roof' | 'lifecycle'
  | 'sensor-heatIndex' | 'sensor-soilMoisture' | 'sensor-airTemp' | 'sensor-waterLevel';

export const getLogs = (type: LogType) => api.get<Record<string, string>[]>(`/logs/${type}`);

export const createLifecycleLog = (action: string, statusType: 'ok' | 'warn' | 'danger') =>
  api.post<{ time: string; action: string; statusType: string }>('/logs/lifecycle', { action, statusType });

// ---- Users / Profile ----
export const updateMe = (updates: Partial<{ name: string; email: string; password: string; role: string; color: string }>) =>
  api.patch<AuthUser>('/users/me', updates);

// ---- Admin user management ----
export type AdminUserRecord = {
  id: number;
  name: string;
  email: string;
  role: 'Administrator' | 'User';
  password_hash: string;
  disabled: boolean;
  created_at: string;
};

export const listUsers = () => api.get<AdminUserRecord[]>('/users');

export const createUser = (user: { name: string; email: string; password: string; role: 'Administrator' | 'User' }) =>
  api.post<AdminUserRecord>('/users', user);

export const updateUser = (id: number, updates: Partial<{ name: string; email: string; role: string; disabled: boolean }>) =>
  api.patch<AdminUserRecord>(`/users/${id}`, updates);

export const deleteUser = (id: number) => api.delete<{ message: string }>(`/users/${id}`);

// ---- Lettuce health / heat-stress ML ----
export type HealthLogRecord = {
  id: number;
  user_id: number;
  rating: string;
  stressed: 0 | 1;
  air_temp: number | null;
  air_humidity: number | null;
  soil_moisture: number | null;
  created_at: string;
};

export const logHealthRating = (rating: string) => api.post<HealthLogRecord>('/health-log', { rating });

export type HeatStressPrediction =
  | { status: 'insufficient-data'; collected: number; required: number }
  | {
      status: 'ok';
      risk: 'low' | 'moderate' | 'high';
      probability: number;
      trainedOn: number;
      topFactor: string;
      latestReading: { airTemp: number; airHumidity: number; soilMoisture: number };
    };

export const getHeatStressPrediction = () => api.get<HeatStressPrediction>('/ml/heat-stress');

// ---- Farm settings/state (lifecycle, automation limits, watering schedule, calibration,
// notifications) — farm-wide, not per-user, persisted server-side so they survive an app
// restart or a second device logging in. ----

export const getLifecycle = () => api.get<{ ageDays: number; updatedAt: string }>('/lifecycle');
export const updateLifecycle = (ageDays: number) => api.patch<{ ageDays: number; updatedAt: string }>('/lifecycle', { ageDays });

export type AutomationLimits = { soilMoistureLimit: number; tempLimit: number; overrideAmountLiters: number };

export const getAutomationLimits = () => api.get<AutomationLimits>('/automation-limits');
export const updateAutomationLimits = (updates: Partial<AutomationLimits>) =>
  api.patch<AutomationLimits>('/automation-limits', updates);

export type DayWatering = { time: string; amountLiters: number };

export const getWateringSchedule = () => api.get<Record<string, DayWatering>>('/watering-schedule');
export const updateDayWatering = (day: string, value: DayWatering) =>
  api.patch<{ day: string } & DayWatering>(`/watering-schedule/${day}`, value);

export type SensorKey = 'heatIndex' | 'soilMoisture' | 'airTemp' | 'waterLevel';
export type Calibration = { min: number; max: number };

export const getCalibration = () => api.get<Record<SensorKey, Calibration>>('/calibration');
export const updateCalibration = (key: SensorKey, value: Calibration) =>
  api.patch<{ key: string } & Calibration>(`/calibration/${key}`, value);

export type NotificationCategory = 'watered' | 'tank-low' | 'limit-exceeded' | 'daily-status' | 'lifecycle-change';

export type NotificationItem = {
  id: number;
  category: NotificationCategory;
  icon: string;
  iconBg: 'green' | 'blue' | 'amber';
  title: string;
  desc: string;
  time: string;
};

export const getNotifications = () => api.get<NotificationItem[]>('/notifications');
export const createNotification = (n: { category: NotificationCategory; icon: string; iconBg: string; title: string; desc: string }) =>
  api.post<NotificationItem>('/notifications', n);
