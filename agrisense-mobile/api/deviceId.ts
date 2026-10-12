// device id for otp check
import AsyncStorage from '@react-native-async-storage/async-storage';

const KEY = 'agrisense.deviceId';
let cached: string | null = null;

function randomId() {
  const part = () => Math.random().toString(16).slice(2, 10);
  return `${part()}${part()}${part()}${part()}`;
}

export async function getDeviceId(): Promise<string> {
  if (cached) return cached;
  try {
    const stored = await AsyncStorage.getItem(KEY);
    if (stored) return (cached = stored);
    const fresh = randomId();
    await AsyncStorage.setItem(KEY, fresh);
    return (cached = fresh);
  } catch {
    // fallback if storage fails
    return (cached = randomId());
  }
}
