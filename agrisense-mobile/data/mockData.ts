// shared data and sample weather

export type LettuceStage = 'seedling' | 'thinning' | 'soil-planting' | 'mature';

export const stageOrder: LettuceStage[] = ['seedling', 'thinning', 'soil-planting', 'mature'];
export const stageLabels: Record<LettuceStage, string> = {
  seedling: 'Seedling',
  thinning: 'Thinning',
  'soil-planting': 'Soil Planting',
  mature: 'Mature',
};
export const stageDays: Record<LettuceStage, string> = {
  seedling: 'Days 1-15',
  thinning: 'Days 16-30',
  'soil-planting': 'Days 31-45',
  mature: 'Days 46-60',
};

// stage based on age
export function stageForAge(ageDays: number): LettuceStage {
  const age = Math.max(1, Math.round(ageDays));
  if (age <= 15) return 'seedling';
  if (age <= 30) return 'thinning';
  if (age <= 45) return 'soil-planting';
  return 'mature';
}

// health ratings
export const healthRatingOptions = [
  'Dried out',
  'Drooping',
  'Slight paleness',
  'Good color and firmness',
  'Vibrant green / firm and upright',
];

// calendar colors
export const healthRatingColors: Record<string, string> = {
  'Dried out': '#dc2626',
  'Drooping': '#f97316',
  'Slight paleness': '#f59e0b',
  'Good color and firmness': '#84cc16',
  'Vibrant green / firm and upright': '#15803d',
};

export const mockHeatIndex = 31;

export type SensorKey = 'heatIndex' | 'soilMoisture' | 'airTemp' | 'waterLevel';

// sensor info
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

// watering per day
export type DayWatering = { time: string; amountLiters: number };
