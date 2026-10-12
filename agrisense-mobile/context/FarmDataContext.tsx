// shared farm data
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo } from 'react';
import { useAuth } from './AuthContext';
import {
  getLatestSensorReading,
  getSwitches,
  setSwitch,
  getDeviceStatus,
  runValve,
  stopValve,
  DeviceStatus,
  getHardwareSettings,
  updateHardwareSettings,
  HardwareSettings,
  getLogs,
  createLifecycleLog,
  logHealthRating,
  getHealthLog,
  getHeatStressPrediction,
  listUsers,
  createUser,
  updateUser,
  deleteUser,
  getLifecycle,
  updateLifecycle,
  getAutomationLimits,
  updateAutomationLimits,
  getWateringSchedule,
  updateDayWatering,
  getCalibration,
  updateCalibration,
  getNotifications,
  createNotification,
  SensorReading,
  SwitchesState,
  HeatStressPrediction,
  AdminUserRecord,
  NotificationItem,
  NotificationCategory,
} from '../api/endpoints';
import {
  stageOrder,
  stageLabels,
  stageForAge,
  healthRatingOptions,
  mockHeatIndex,
  weeklyWeatherMock,
  LettuceStage,
  SensorKey,
  SensorLogEntry,
  Calibration,
  DayWatering,
} from '../data/mockData';

const POLL_INTERVAL_MS = 10000;
const HEAT_STRESS_POLL_INTERVAL_MS = 120000;

const SENSOR_LOG_TYPES: Record<SensorKey, 'sensor-heatIndex' | 'sensor-soilMoisture' | 'sensor-airTemp' | 'sensor-waterLevel'> = {
  heatIndex: 'sensor-heatIndex',
  soilMoisture: 'sensor-soilMoisture',
  airTemp: 'sensor-airTemp',
  waterLevel: 'sensor-waterLevel',
};

function healthSeverity(rating: string): 'ok' | 'warn' | 'danger' {
  const i = healthRatingOptions.indexOf(rating);
  if (i <= 1) return 'danger';
  if (i === 2) return 'warn';
  return 'ok';
}

type Lifecycle = { ageDays: number; setAt: string };
type HealthLogEntry = { id: string; rating: string; loggedAt: string; note?: string };
type LifecycleLogEntry = { time: string; action: string; statusType: 'ok' | 'warn' | 'danger' };
type AutomationLimits = { soilMoistureLimit: number; tempLimit: number; overrideAmountLiters: number };

type FarmDataContextValue = {
  reading: SensorReading | null;

  lifecycle: Lifecycle;
  stage: LettuceStage;
  stageIndex: number;
  setLifecycle: (ageDays: number) => void;

  healthLog: HealthLogEntry[];
  logHealth: (rating: string, note?: string) => void;
  editHealthLog: (id: string, rating: string, note?: string) => void;

  heatIndex: number;
  waterLevel: number;
  lastWatering: string | null;

  weeklyWeather: typeof weeklyWeatherMock;
  predictedWatering: { day: string; watering: boolean; reason: string }[];
  wateringSchedule: Record<string, DayWatering>;
  setDayWatering: (day: string, value: DayWatering) => void;

  automationLimits: AutomationLimits;
  setAutomationLimits: (partial: Partial<AutomationLimits>) => void;

  switches: SwitchesState | null;
  setRoof: (value: boolean) => Promise<void>;

  // esp32 status and valve
  deviceStatus: DeviceStatus | null;
  waterNow: (liters?: number) => Promise<void>;
  stopWatering: () => Promise<void>;

  // hardware settings
  hardwareSettings: HardwareSettings | null;
  saveHardwareSettings: (updates: Partial<HardwareSettings>) => Promise<void>;
  // schedule and skip rain switches
  setSwitchValue: (key: 'timer' | 'skipRain', value: boolean) => Promise<void>;

  notifications: NotificationItem[];
  lifecycleLogs: LifecycleLogEntry[];

  adminUsers: AdminUserRecord[];
  refreshUsers: () => Promise<void>;
  createUserRecord: (user: { name: string; email: string; password: string; role: 'Administrator' | 'User' }) => Promise<void>;
  updateUserRecord: (id: number, updates: Partial<{ name: string; email: string; role: string; disabled: boolean }>) => Promise<void>;
  deleteUserRecord: (id: number) => Promise<void>;

  calibration: Record<SensorKey, Calibration>;
  setCalibration: (key: SensorKey, value: Calibration) => void;
  sensorLogs: Record<SensorKey, SensorLogEntry[]>;
  outOfCalibration: SensorKey[];
  sensorValues: Record<SensorKey, number | null>;

  heatStress: HeatStressPrediction | null;
};

const FarmDataContext = createContext<FarmDataContextValue | null>(null);

const EMPTY_CALIBRATION: Record<SensorKey, Calibration> = {
  heatIndex: { min: 15, max: 35 },
  soilMoisture: { min: 30, max: 70 },
  airTemp: { min: 18, max: 30 },
  waterLevel: { min: 20, max: 100 },
};
const EMPTY_SENSOR_LOGS: Record<SensorKey, SensorLogEntry[]> = { heatIndex: [], soilMoisture: [], airTemp: [], waterLevel: [] };
const EMPTY_AUTOMATION_LIMITS: AutomationLimits = { soilMoistureLimit: 40, tempLimit: 32, overrideAmountLiters: 2 };

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn, user } = useAuth();

  const [reading, setReading] = useState<SensorReading | null>(null);
  const [lifecycle, setLifecycleState] = useState<Lifecycle>({ ageDays: 1, setAt: new Date().toISOString() });
  const [healthLog, setHealthLog] = useState<HealthLogEntry[]>([]);
  const [lastWatering, setLastWatering] = useState<string | null>(null);
  const [automationLimits, setAutomationLimitsState] = useState<AutomationLimits>(EMPTY_AUTOMATION_LIMITS);
  const [wateringSchedule, setWateringScheduleState] = useState<Record<string, DayWatering>>({});
  const [switches, setSwitches] = useState<SwitchesState | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [lifecycleLogs, setLifecycleLogs] = useState<LifecycleLogEntry[]>([]);
  const [adminUsers, setAdminUsers] = useState<AdminUserRecord[]>([]);
  const [calibration, setCalibrationState] = useState<Record<SensorKey, Calibration>>(EMPTY_CALIBRATION);
  const [sensorLogs, setSensorLogs] = useState<Record<SensorKey, SensorLogEntry[]>>(EMPTY_SENSOR_LOGS);
  const [heatStress, setHeatStress] = useState<HeatStressPrediction | null>(null);
  const [deviceStatus, setDeviceStatus] = useState<DeviceStatus | null>(null);
  const [hardwareSettings, setHardwareSettings] = useState<HardwareSettings | null>(null);


  const actorSuffix = user?.name ? ` (by ${user.name})` : '';

  const addNotification = useCallback(
    (category: NotificationCategory, icon: string, iconBg: 'green' | 'blue' | 'amber', title: string, desc: string) => {
      // show right away then save
      setNotifications((prev) => [
        { id: -Date.now(), category, icon, iconBg, title, desc, time: 'Just now' },
        ...prev,
      ]);
      createNotification({ category, icon, iconBg, title, desc }).catch((err) =>
        console.warn('Failed to persist notification:', err)
      );
    },
    []
  );

  const addLifecycleLog = useCallback((action: string, statusType: 'ok' | 'warn' | 'danger') => {
    setLifecycleLogs((prev) => [{ time: 'Just now', action, statusType }, ...prev]);
    createLifecycleLog(action, statusType).catch((err) => console.warn('Failed to persist lifecycle log:', err));
  }, []);

  const setLifecycle = useCallback(
    (ageDays: number) => {
      const clamped = Math.max(1, Math.round(ageDays));
      setLifecycleState({ ageDays: clamped, setAt: new Date().toISOString() });
      const stage = stageForAge(clamped);
      const label = `Age set to ${clamped} day${clamped === 1 ? '' : 's'} — now ${stageLabels[stage]} stage`;
      addNotification('lifecycle-change', 'leaf', 'green', 'Lifecycle stage updated', label);
      addLifecycleLog(`${label}${actorSuffix}`, 'ok');
      updateLifecycle(clamped).catch((err) => console.warn('Failed to persist lifecycle age:', err));
    },
    [addNotification, addLifecycleLog, actorSuffix]
  );

  const refreshHeatStress = useCallback(async () => {
    try {
      setHeatStress(await getHeatStressPrediction());
    } catch (err) {
      console.warn('Failed to load heat-stress prediction:', err);
    }
  }, []);

  const logHealth = useCallback(
    (rating: string, note?: string) => {
      const cleanNote = note?.trim() || undefined;
      setHealthLog((prev) => [{ id: `${Date.now()}`, rating, loggedAt: new Date().toISOString(), note: cleanNote }, ...prev]);
      addNotification('daily-status', 'sunny', 'amber', 'Daily crop status', `Health logged: ${rating}`);
      addLifecycleLog(`Health rated: ${rating}${cleanNote ? ` — "${cleanNote}"` : ''}${actorSuffix}`, healthSeverity(rating));
      logHealthRating(rating, cleanNote)
        .then(() => refreshHeatStress())
        .catch((err) => console.warn('Failed to persist health rating:', err));
    },
    [addNotification, addLifecycleLog, refreshHeatStress, actorSuffix]
  );

  const editHealthLog = useCallback(
    (id: string, rating: string, note?: string) => {
      const cleanNote = note?.trim() || undefined;
      setHealthLog((prev) => prev.map((e) => (e.id === id ? { ...e, rating, note: cleanNote, loggedAt: new Date().toISOString() } : e)));
      addNotification('daily-status', 'sunny', 'amber', 'Daily crop status', `Health rating updated to: ${rating}`);
      addLifecycleLog(`Health rating updated to: ${rating}${cleanNote ? ` — "${cleanNote}"` : ''}${actorSuffix}`, healthSeverity(rating));
      logHealthRating(rating, cleanNote)
        .then(() => refreshHeatStress())
        .catch((err) => console.warn('Failed to persist updated health rating:', err));
    },
    [addNotification, addLifecycleLog, refreshHeatStress, actorSuffix]
  );

  const setAutomationLimits = useCallback((partial: Partial<AutomationLimits>) => {
    setAutomationLimitsState((prev) => ({ ...prev, ...partial }));
    updateAutomationLimits(partial)
      .then((real) => setAutomationLimitsState(real))
      .catch((err) => console.warn('Failed to persist automation limits:', err));
  }, []);

  const setDayWatering = useCallback((day: string, value: DayWatering) => {
    setWateringScheduleState((prev) => ({ ...prev, [day]: value }));
    updateDayWatering(day, value).catch((err) => console.warn('Failed to persist watering schedule:', err));
  }, []);

  const setCalibration = useCallback((key: SensorKey, value: Calibration) => {
    setCalibrationState((prev) => ({ ...prev, [key]: value }));
    updateCalibration(key, value).catch((err) => console.warn('Failed to persist calibration:', err));
  }, []);

  // manual roof
  const setRoof = useCallback(async (value: boolean) => {
    await setSwitch('roof', value);
    setSwitches((prev) => (prev ? { ...prev, roof: value } : prev));
    setHardwareSettings((prev) => (prev ? { ...prev, roofMode: 'manual' } : prev));
  }, []);

  const setSwitchValue = useCallback(async (key: 'timer' | 'skipRain', value: boolean) => {
    setSwitches((prev) => (prev ? { ...prev, [key]: value } : prev));
    try {
      await setSwitch(key, value);
    } catch (err) {
      setSwitches((prev) => (prev ? { ...prev, [key]: !value } : prev));
      throw err;
    }
  }, []);

  const saveHardwareSettings = useCallback(async (updates: Partial<HardwareSettings>) => {
    setHardwareSettings(await updateHardwareSettings(updates));
  }, []);

  // this week's watering plan
  const predictedWatering = useMemo(
    () =>
      weeklyWeatherMock.map((w) => {
        const plan = wateringSchedule[w.day];
        const on = !!switches?.timer && !!plan && plan.amountLiters > 0;
        return {
          day: w.day,
          watering: on,
          reason: !switches?.timer ? 'Schedule off' : plan && plan.amountLiters > 0 ? `${plan.time} · ${plan.amountLiters}L` : 'No watering set',
        };
      }),
    [wateringSchedule, switches?.timer]
  );

  const waterNow = useCallback(async (liters?: number) => {
    await runValve(liters);
    setDeviceStatus(await getDeviceStatus());
  }, []);

  const stopWatering = useCallback(async () => {
    await stopValve();
    setDeviceStatus(await getDeviceStatus());
  }, []);

  // poll server
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const [r, s, d, n] = await Promise.all([getLatestSensorReading(), getSwitches(), getDeviceStatus(), getNotifications()]);
        if (cancelled) return;

        setReading(r);
        setSwitches(s);
        setDeviceStatus(d);
        setNotifications(n);
      } catch (err) {
        console.warn('Failed to poll sensor reading:', err);
      }
    };

    tick();
    const id = setInterval(tick, POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [isLoggedIn]);

  // heat stress prediction
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshHeatStress();
    const id = setInterval(refreshHeatStress, HEAT_STRESS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn, refreshHeatStress]);

  const refreshUsers = useCallback(async () => {
    try {
      setAdminUsers(await listUsers());
    } catch (err) {
      console.warn('Failed to load users (likely not an admin account):', err);
    }
  }, []);

  const createUserRecord = useCallback(
    async (newUser: { name: string; email: string; password: string; role: 'Administrator' | 'User' }) => {
      await createUser(newUser);
      await refreshUsers();
    },
    [refreshUsers]
  );

  const updateUserRecord = useCallback(
    async (id: number, updates: Partial<{ name: string; email: string; role: string; disabled: boolean }>) => {
      await updateUser(id, updates);
      await refreshUsers();
    },
    [refreshUsers]
  );

  const deleteUserRecord = useCallback(
    async (id: number) => {
      await deleteUser(id);
      await refreshUsers();
    },
    [refreshUsers]
  );

  // load settings on login
  useEffect(() => {
    if (!isLoggedIn) return;

    getLogs('valve')
      .then((rows) => {
        const latest = rows[0] as { time?: string } | undefined;
        if (latest?.time) setLastWatering(latest.time);
      })
      .catch(() => {});

    getLifecycle()
      .then((l) => setLifecycleState({ ageDays: l.ageDays, setAt: l.updatedAt }))
      .catch((err) => console.warn('Failed to load lifecycle:', err));

    getAutomationLimits()
      .then(setAutomationLimitsState)
      .catch((err) => console.warn('Failed to load automation limits:', err));

    getWateringSchedule()
      .then(setWateringScheduleState)
      .catch((err) => console.warn('Failed to load watering schedule:', err));

    getCalibration()
      .then((c) => setCalibrationState(c as Record<SensorKey, Calibration>))
      .catch((err) => console.warn('Failed to load calibration:', err));

    getHardwareSettings()
      .then(setHardwareSettings)
      .catch((err) => console.warn('Failed to load hardware settings:', err));

    getNotifications()
      .then(setNotifications)
      .catch((err) => console.warn('Failed to load notifications:', err));

    getHealthLog()
      .then((rows) => setHealthLog(rows.map((r) => ({ id: String(r.id), rating: r.rating, loggedAt: r.created_at, note: r.note ?? undefined }))))
      .catch((err) => console.warn('Failed to load health log:', err));

    getLogs('lifecycle')
      .then((rows) => setLifecycleLogs(rows as unknown as LifecycleLogEntry[]))
      .catch((err) => console.warn('Failed to load lifecycle logs:', err));

    (Object.keys(SENSOR_LOG_TYPES) as SensorKey[]).forEach((key) => {
      getLogs(SENSOR_LOG_TYPES[key])
        .then((rows) => setSensorLogs((prev) => ({ ...prev, [key]: rows as unknown as SensorLogEntry[] })))
        .catch((err) => console.warn(`Failed to load ${key} log:`, err));
    });

    refreshUsers();
  }, [isLoggedIn, refreshUsers]);

  const stage = stageForAge(lifecycle.ageDays);
  const stageIndex = stageOrder.indexOf(stage);

  const sensorValues: Record<SensorKey, number | null> = {
    heatIndex: mockHeatIndex,
    soilMoisture: reading?.soilMoisture ?? null,
    airTemp: reading?.airTemp ?? null,
    waterLevel: reading?.waterLevel ?? null,
  };

  const outOfCalibration = useMemo(
    () =>
      (Object.keys(sensorValues) as SensorKey[]).filter((key) => {
        const value = sensorValues[key];
        const cal = calibration[key];
        return value != null && cal != null && (value < cal.min || value > cal.max);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reading, calibration]
  );

  return (
    <FarmDataContext.Provider
      value={{
        reading,
        lifecycle,
        stage,
        stageIndex,
        setLifecycle,
        healthLog,
        logHealth,
        editHealthLog,
        heatIndex: mockHeatIndex,
        waterLevel: reading?.waterLevel ?? 72,
        lastWatering,
        weeklyWeather: weeklyWeatherMock,
        predictedWatering,
        wateringSchedule,
        setDayWatering,
        automationLimits,
        setAutomationLimits,
        switches,
        setRoof,
        deviceStatus,
        waterNow,
        stopWatering,
        hardwareSettings,
        saveHardwareSettings,
        setSwitchValue,
        notifications,
        lifecycleLogs,
        adminUsers,
        refreshUsers,
        createUserRecord,
        updateUserRecord,
        deleteUserRecord,
        calibration,
        setCalibration,
        sensorLogs,
        outOfCalibration,
        sensorValues,
        heatStress,
      }}
    >
      {children}
    </FarmDataContext.Provider>
  );
}

export function useFarmData() {
  const ctx = useContext(FarmDataContext);
  if (!ctx) throw new Error('useFarmData must be used inside <FarmDataProvider>');
  return ctx;
}
