// data/mockData.ts
// App-wide vocabulary/config shared by multiple screens: lifecycle stages, health-rating
// options, sensor metadata, and the weekly weather mock (heatIndex is still a mock value here
// too, pending a weather API key — see FarmDataContext). Everything else that used to be
// seed data here now lives in the real database — see server/routes/farm.js.

export type LettuceStage = 'seedling' | 'growth' | 'mature';

export const stageOrder: LettuceStage[] = ['seedling', 'growth', 'mature'];
export const stageLabels: Record<LettuceStage, string> = {
  seedling: 'Seedling',
  growth: 'Growth',
  mature: 'Mature',
};

// Stage always follows the plant's age — Day 1-10 Seedling, 11-20 Growth, 21+ Mature.
// There is no manual stage picker; farmers only ever edit the age.
export function stageForAge(ageDays: number): LettuceStage {
  const age = Math.max(1, Math.round(ageDays));
  if (age <= 10) return 'seedling';
  if (age <= 20) return 'growth';
  return 'mature';
}

// Exact wording from the product spec — data-log health rating options, worst to best.
export const healthRatingOptions = [
  'Dried out',
  'Drooping',
  'Slight paleness',
  'Good color and firmness',
  'Vibrant green / firm and upright',
];

export const mockHeatIndex = 31; // °C — TODO: proxy a weather API (e.g. OpenWeather) server-side

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

export type Calibration = { min: number; max: number };

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

// Per-day watering plan — independent time + amount for each day of the week, editable from
// the Weekly Weather page. Keyed by the same short day name used in weeklyWeatherMock.
export type DayWatering = { time: string; amountLiters: number };
