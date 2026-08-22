// context/FarmDataContext.tsx
// Shared farm state: lettuce lifecycle, live sensor reading, water automation limits,
// notifications, and logs — all in one place so screens can read/react to the same data
// (e.g. saving the lifecycle stage or crossing an automation limit pushes a notification
// AND a log entry at the same time). Memory-only, same durability as AuthContext — resets
// on a full app close. Reuses real endpoints where they exist (sensors, switches, valve logs);
// everything else (lifecycle, weather, limits, admin users) is local state with a TODO for
// the real backend field/endpoint it should eventually read from.
import React, { createContext, useContext, useState, useCallback, useEffect, useMemo, useRef } from 'react';
import { useAuth } from './AuthContext';
import {
  getLatestSensorReading,
  getSwitches,
  setSwitch,
  getLogs,
  logHealthRating,
  getHeatStressPrediction,
  SensorReading,
  SwitchesState,
  HeatStressPrediction,
} from '../api/endpoints';
import {
  defaultLifecycle,
  stageOrder,
  stageLabels,
  healthRatingOptions,
  mockHeatIndex,
  mockWaterLevel,
  weeklyWeatherMock,
  defaultAutomationLimits,
  initialNotifications,
  initialLifecycleLogs,
  initialAdminUsers,
  sensorMeta,
  initialSensorLogs,
  initialCalibration,
  LettuceStage,
  DurationUnit,
  NotificationItem,
  NotificationCategory,
  AdminUser,
  SensorKey,
  SensorLogEntry,
  Calibration,
} from '../data/mockData';

const LOW_WATER_THRESHOLD = 20;
const POLL_INTERVAL_MS = 30000;
const HEAT_STRESS_POLL_INTERVAL_MS = 120000;

function now() {
  return new Date().toLocaleString('en-US', { month: 'short', day: '2-digit', hour: 'numeric', minute: '2-digit' }).replace(',', ' ·');
}

function nowParts() {
  const d = new Date();
  return {
    date: d.toLocaleDateString('en-US', { month: 'short', day: '2-digit' }),
    time: d.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }),
  };
}

function healthSeverity(rating: string): 'ok' | 'warn' | 'danger' {
  const i = healthRatingOptions.indexOf(rating);
  if (i <= 1) return 'danger';
  if (i === 2) return 'warn';
  return 'ok';
}

type Lifecycle = { stage: LettuceStage; durationValue: number; durationUnit: DurationUnit; setAt: string };
type HealthLogEntry = { id: string; rating: string; loggedAt: string };
type LifecycleLogEntry = { time: string; action: string; statusType: 'ok' | 'warn' | 'danger' };
type AutomationLimits = { soilMoistureLimit: number; tempLimit: number };

type FarmDataContextValue = {
  reading: SensorReading | null;

  lifecycle: Lifecycle;
  stageIndex: number;
  setLifecycle: (stage: LettuceStage, durationValue: number, durationUnit: DurationUnit) => void;

  healthLog: HealthLogEntry[];
  logHealth: (rating: string) => void;

  heatIndex: number;
  waterLevel: number;
  lastWatering: string | null;

  weeklyWeather: typeof weeklyWeatherMock;
  predictedWatering: { day: string; watering: boolean; reason: string }[];

  automationLimits: AutomationLimits;
  setAutomationLimits: (partial: Partial<AutomationLimits>) => void;

  switches: SwitchesState | null;
  setRoof: (value: boolean) => Promise<void>;

  notifications: NotificationItem[];
  lifecycleLogs: LifecycleLogEntry[];

  adminUsers: AdminUser[];
  addAdminUser: (user: Omit<AdminUser, 'id' | 'createdAt'>) => void;

  calibration: Record<SensorKey, Calibration>;
  setCalibration: (key: SensorKey, value: Calibration) => void;
  sensorLogs: Record<SensorKey, SensorLogEntry[]>;
  outOfCalibration: SensorKey[];
  sensorValues: Record<SensorKey, number | null>;

  heatStress: HeatStressPrediction | null;
};

const FarmDataContext = createContext<FarmDataContextValue | null>(null);

export function FarmDataProvider({ children }: { children: React.ReactNode }) {
  const { isLoggedIn } = useAuth();

  const [reading, setReading] = useState<SensorReading | null>(null);
  const [lifecycle, setLifecycleState] = useState<Lifecycle>(defaultLifecycle);
  const [healthLog, setHealthLog] = useState<HealthLogEntry[]>([]);
  const [waterLevel] = useState(mockWaterLevel); // TODO: read from /sensors/latest once hardware reports it
  const [lastWatering, setLastWatering] = useState<string | null>(null);
  const [automationLimits, setAutomationLimitsState] = useState<AutomationLimits>(defaultAutomationLimits);
  const [switches, setSwitches] = useState<SwitchesState | null>(null);
  const [notifications, setNotifications] = useState<NotificationItem[]>(initialNotifications);
  const [lifecycleLogs, setLifecycleLogs] = useState<LifecycleLogEntry[]>(initialLifecycleLogs);
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>(initialAdminUsers);
  const [calibration, setCalibrationState] = useState<Record<SensorKey, Calibration>>(initialCalibration);
  const [sensorLogs, setSensorLogs] = useState<Record<SensorKey, SensorLogEntry[]>>(initialSensorLogs);
  const [heatStress, setHeatStress] = useState<HeatStressPrediction | null>(null);

  const wateringActiveRef = useRef(false);
  const breachActiveRef = useRef(false);
  const tankLowNotifiedRef = useRef(false);
  const prevReadingRef = useRef<SensorReading | null>(null);

  const addNotification = useCallback(
    (category: NotificationCategory, icon: string, iconBg: 'green' | 'blue' | 'amber', title: string, desc: string) => {
      setNotifications((prev) => [
        { id: `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`, category, icon, iconBg, title, desc, time: now() },
        ...prev,
      ]);
    },
    []
  );

  const addLifecycleLog = useCallback((action: string, statusType: 'ok' | 'warn' | 'danger') => {
    setLifecycleLogs((prev) => [{ time: now(), action, statusType }, ...prev]);
  }, []);

  const setLifecycle = useCallback(
    (stage: LettuceStage, durationValue: number, durationUnit: DurationUnit) => {
      setLifecycleState({ stage, durationValue, durationUnit, setAt: new Date().toISOString() });
      const label = `Stage set to ${stageLabels[stage]} (${durationUnit === 'day' ? 'Day' : 'Week'} ${durationValue})`;
      addNotification('lifecycle-change', 'leaf', 'green', 'Lifecycle stage updated', label);
      addLifecycleLog(label, 'ok');
      // TODO: PATCH the real lifecycle to your backend + a scheduler that re-checks
      // daily/weekly (per durationUnit) to auto-advance the stage.
    },
    [addNotification, addLifecycleLog]
  );

  const refreshHeatStress = useCallback(async () => {
    try {
      setHeatStress(await getHeatStressPrediction());
    } catch (err) {
      console.warn('Failed to load heat-stress prediction:', err);
    }
  }, []);

  const logHealth = useCallback(
    (rating: string) => {
      setHealthLog((prev) => [{ id: `${Date.now()}`, rating, loggedAt: new Date().toISOString() }, ...prev]);
      addNotification('daily-status', 'sunny', 'amber', 'Daily crop status', `Health logged: ${rating}`);
      addLifecycleLog(`Health rated: ${rating}`, healthSeverity(rating));
      logHealthRating(rating)
        .then(() => refreshHeatStress())
        .catch((err) => console.warn('Failed to persist health rating:', err));
    },
    [addNotification, addLifecycleLog, refreshHeatStress]
  );

  const setAutomationLimits = useCallback((partial: Partial<AutomationLimits>) => {
    setAutomationLimitsState((prev) => ({ ...prev, ...partial }));
    // TODO: PATCH /automation/limits once that endpoint exists — for now this only
    // persists in memory for the current app session.
  }, []);

  const addSensorLog = useCallback((key: SensorKey, value: number) => {
    const { date, time } = nowParts();
    setSensorLogs((prev) => ({ ...prev, [key]: [{ value, time, date }, ...prev[key]] }));
  }, []);

  const setCalibration = useCallback((key: SensorKey, value: Calibration) => {
    setCalibrationState((prev) => ({ ...prev, [key]: value }));
    // TODO: PATCH the real calibration to your backend once /calibration exists.
  }, []);

  const setRoof = useCallback(async (value: boolean) => {
    await setSwitch('roof', value);
    setSwitches((prev) => (prev ? { ...prev, roof: value } : prev));
  }, []);

  const predictedWatering = useMemo(
    () =>
      weeklyWeatherMock.map((w) => {
        const skip = w.condition === 'rain' || w.rainChance >= 60;
        return { day: w.day, watering: !skip, reason: skip ? 'Skipped — rain forecast' : 'Scheduled' };
      }),
    []
  );

  const waterNow = useCallback(
    async (reason: string) => {
      if (wateringActiveRef.current) return;
      wateringActiveRef.current = true;
      try {
        await setSwitch('valve', true);
        await setSwitch('valve', false);
        setLastWatering(now());
        addNotification('watered', 'water', 'blue', 'Crop watered', reason);
      } catch (err) {
        console.warn('Auto-watering failed:', err);
      } finally {
        wateringActiveRef.current = false;
      }
    },
    [addNotification]
  );

  // Poll the real sensor endpoint and run the limit-based auto-watering + tank-low checks.
  useEffect(() => {
    if (!isLoggedIn) return;

    let cancelled = false;

    const tick = async () => {
      try {
        const [r, s] = await Promise.all([getLatestSensorReading(), getSwitches()]);
        if (cancelled) return;

        const prev = prevReadingRef.current;
        if (prev) {
          if (Math.abs(r.soilMoisture - prev.soilMoisture) >= sensorMeta.soilMoisture.changeThreshold) {
            addSensorLog('soilMoisture', r.soilMoisture);
          }
          if (Math.abs(r.airTemp - prev.airTemp) >= sensorMeta.airTemp.changeThreshold) {
            addSensorLog('airTemp', r.airTemp);
          }
        }
        prevReadingRef.current = r;

        setReading(r);
        setSwitches(s);

        const soilBreach = r.soilMoisture < automationLimits.soilMoistureLimit;
        const tempBreach = r.airTemp > automationLimits.tempLimit;
        if (soilBreach || tempBreach) {
          // Only notify + water once per breach — otherwise every 30s poll while the
          // reading stays over/under the limit would spam a fresh notification.
          if (!breachActiveRef.current) {
            breachActiveRef.current = true;
            const reason = soilBreach
              ? `Soil moisture (${r.soilMoisture}%) is below the ${automationLimits.soilMoistureLimit}% limit`
              : `Temperature (${r.airTemp}°C) is above the ${automationLimits.tempLimit}°C limit`;
            addNotification('limit-exceeded', 'warning', 'amber', 'Automation limit exceeded', reason);
            waterNow(reason);
          }
        } else {
          breachActiveRef.current = false;
        }
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
  }, [isLoggedIn, automationLimits, addNotification, waterNow, addSensorLog]);

  // Heat-stress prediction: fetch on login, then on a slow cadence — retraining every 30s
  // like the sensor poll would be wasteful even though each request is individually cheap.
  useEffect(() => {
    if (!isLoggedIn) return;
    refreshHeatStress();
    const id = setInterval(refreshHeatStress, HEAT_STRESS_POLL_INTERVAL_MS);
    return () => clearInterval(id);
  }, [isLoggedIn, refreshHeatStress]);

  // One-time hydration: seed "last watering" from the real valve log, and check tank level.
  useEffect(() => {
    if (!isLoggedIn) return;
    getLogs('valve')
      .then((rows) => {
        const latest = rows[0] as { time?: string } | undefined;
        if (latest?.time) setLastWatering(latest.time);
      })
      .catch(() => {});

    if (waterLevel < LOW_WATER_THRESHOLD && !tankLowNotifiedRef.current) {
      tankLowNotifiedRef.current = true;
      addNotification('tank-low', 'alert-circle', 'amber', 'Water tank level low', `Tank at ${waterLevel}% — refill soon`);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isLoggedIn]);

  const stageIndex = stageOrder.indexOf(lifecycle.stage);

  const addAdminUser = useCallback((user: Omit<AdminUser, 'id' | 'createdAt'>) => {
    setAdminUsers((prev) => [...prev, { ...user, id: `${Date.now()}`, createdAt: new Date().toISOString() }]);
    // TODO: POST /users once a real admin-create-user endpoint exists.
  }, []);

  const sensorValues: Record<SensorKey, number | null> = {
    heatIndex: mockHeatIndex,
    soilMoisture: reading?.soilMoisture ?? null,
    airTemp: reading?.airTemp ?? null,
    waterLevel,
  };

  const outOfCalibration = useMemo(
    () =>
      (Object.keys(sensorValues) as SensorKey[]).filter((key) => {
        const value = sensorValues[key];
        const cal = calibration[key];
        return value != null && cal != null && (value < cal.min || value > cal.max);
      }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [reading, waterLevel, calibration]
  );

  return (
    <FarmDataContext.Provider
      value={{
        reading,
        lifecycle,
        stageIndex,
        setLifecycle,
        healthLog,
        logHealth,
        heatIndex: mockHeatIndex,
        waterLevel,
        lastWatering,
        weeklyWeather: weeklyWeatherMock,
        predictedWatering,
        automationLimits,
        setAutomationLimits,
        switches,
        setRoof,
        notifications,
        lifecycleLogs,
        adminUsers,
        addAdminUser,
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
