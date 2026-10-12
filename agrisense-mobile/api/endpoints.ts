// api endpoints
import { api } from './client';

// auth
export type AuthUser = { id: number; name: string; email: string; role: string; color: string; hasPin?: boolean };

// login with password or pin
export type LoginResult =
  | { requiresStepUp: false; token: string; user: AuthUser }
  | { requiresStepUp: true; stepUpToken: string };

export const login = (email: string, secret: { password?: string; pin?: string }, deviceId: string) =>
  api.post<LoginResult>('/auth/login', { email, ...secret, deviceId });

export const requestPasswordOtp = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password/request', { email });

export const resetPassword = (email: string, otp: string, newPassword: string) =>
  api.post<{ message: string }>('/auth/forgot-password/reset', { email, otp, newPassword });

// login otp
export const resendLoginStepUpOtp = (stepUpToken: string) =>
  api.post<{ message: string }>('/auth/login/request-otp', { stepUpToken });

export const verifyLoginStepUpOtp = (stepUpToken: string, otp: string) =>
  api.post<{ token: string; user: AuthUser }>('/auth/login/verify-otp', { stepUpToken, otp });

// sensors
export type SensorReading = {
  airTemp: number; airTempStatus: 'ok' | 'warn' | 'danger'; airTempLabel: string;
  airHumidity: number; airHumidityStatus: 'ok' | 'warn' | 'danger'; airHumidityLabel: string;
  soilMoisture: number; soilMoistureStatus: 'ok' | 'warn' | 'danger'; soilMoistureLabel: string;
  rain: number; rainStatus: 'ok' | 'warn' | 'danger'; rainLabel: string;
  waterLevel: number;
  updatedAt: string;
};

export const getLatestSensorReading = () => api.get<SensorReading>('/sensors/latest');

// switches
export type SwitchesState = { roof: boolean; valve: boolean; timer: boolean; notifications: boolean; skipRain: boolean };

export const getSwitches = () => api.get<SwitchesState>('/switches');
export const setSwitch = (key: keyof SwitchesState, value: boolean) =>
  api.patch<{ key: string; value: boolean }>(`/switches/${key}`, { value });

// esp32
export type DeviceStatus = {
  online: boolean;
  lastSeen: string | null;
  valveOpen: boolean;
  valveSecondsLeft: number;
  valveReason: string | null;
  // raw readings for calibration
  raw: { soil: number | null; water: number | null; rain: number | null };
};

export const getDeviceStatus = () => api.get<DeviceStatus>('/device/status');
// water now
export const runValve = (liters?: number) => api.post<{ liters: number; seconds: number }>('/valve/run', liters ? { liters } : {});
export const stopValve = () => api.post<{ valveOpen: boolean }>('/valve/stop');

// hardware settings
export type HardwareSettings = {
  soilDryRaw: number;
  soilWetRaw: number;
  waterEmptyRaw: number;
  waterFullRaw: number;
  rainDryRaw: number;
  rainWetRaw: number;
  tankMinLevel: number;
  rainThreshold: number;
  roofMode: 'manual' | 'auto';
  roofCloseTemp: number;
  roofCloseOnRain: boolean;
  servoOpenAngle: number;
  servoClosedAngle: number;
  sensorIntervalSec: number;
};

export const getHardwareSettings = () => api.get<HardwareSettings>('/hardware-settings');
export const updateHardwareSettings = (updates: Partial<HardwareSettings>) =>
  api.patch<HardwareSettings>('/hardware-settings', updates);

// logs
export type LogType =
  | 'temp-humidity' | 'soil' | 'valve' | 'roof' | 'lifecycle'
  | 'sensor-heatIndex' | 'sensor-soilMoisture' | 'sensor-airTemp' | 'sensor-waterLevel';

export const getLogs = (type: LogType) => api.get<Record<string, string>[]>(`/logs/${type}`);

export const createLifecycleLog = (action: string, statusType: 'ok' | 'warn' | 'danger') =>
  api.post<{ time: string; action: string; statusType: string }>('/logs/lifecycle', { action, statusType });

// users
export const updateMe = (updates: Partial<{ name: string; email: string; password: string; role: string; color: string }>) =>
  api.patch<AuthUser>('/users/me', updates);

// pin
export const setPin = (pin: string, password: string) => api.put<AuthUser>('/users/me/pin', { pin, password });
export const removePin = (password: string) => api.post<AuthUser>('/users/me/pin/remove', { password });

// admin
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

// health logs and heat stress
export type HealthLogRecord = {
  id: number;
  user_id: number;
  rating: string;
  stressed: 0 | 1;
  air_temp: number | null;
  air_humidity: number | null;
  soil_moisture: number | null;
  note: string | null;
  created_at: string;
};

export const logHealthRating = (rating: string, note?: string) =>
  api.post<HealthLogRecord>('/health-log', { rating, note });

export const getHealthLog = (limit = 365) => api.get<HealthLogRecord[]>(`/health-log?limit=${limit}`);

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

// farm settings

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
