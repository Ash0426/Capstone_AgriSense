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

// ---- Sensors ----
export type SensorReading = {
  airTemp: number; airTempStatus: 'ok' | 'warn' | 'danger'; airTempLabel: string;
  airHumidity: number; airHumidityStatus: 'ok' | 'warn' | 'danger'; airHumidityLabel: string;
  soilMoisture: number; soilMoistureStatus: 'ok' | 'warn' | 'danger'; soilMoistureLabel: string;
  rain: number; rainStatus: 'ok' | 'warn' | 'danger'; rainLabel: string;
  updatedAt: string;
};

export const getLatestSensorReading = () => api.get<SensorReading>('/sensors/latest');

// ---- Switches ----
export type SwitchesState = { roof: boolean; valve: boolean; timer: boolean; notifications: boolean; skipRain: boolean };

export const getSwitches = () => api.get<SwitchesState>('/switches');
export const setSwitch = (key: keyof SwitchesState, value: boolean) =>
  api.patch<{ key: string; value: boolean }>(`/switches/${key}`, { value });

// ---- Schedule ----
export type Schedule = { morningTime: string; durationMinutes: number };

export const getSchedule = () => api.get<Schedule>('/schedule');
export const updateSchedule = (schedule: Schedule) => api.put<Schedule>('/schedule', schedule);

// ---- Logs ----
export type LogType = 'temp-humidity' | 'soil' | 'valve' | 'roof';

export const getLogs = (type: LogType) => api.get<Record<string, string>[]>(`/logs/${type}`);

// ---- Notifications ----
export type NotificationItem = { id: number; icon: string; iconBg: string; title: string; desc: string; time: string };

export const getNotifications = () => api.get<NotificationItem[]>('/notifications');

// ---- Users / Profile ----
export const getMe = () => api.get<AuthUser>('/users/me');

export const updateMe = (updates: Partial<{ name: string; email: string; password: string; role: string; color: string }>) =>
  api.patch<AuthUser>('/users/me', updates);

export type ActivityItem = { id: number; action: string; time: string };

export const getMyActivity = () => api.get<ActivityItem[]>('/users/me/activity');
