// api/deviceId.ts
// A random id generated once per app install and kept in AsyncStorage. The server uses it to
// tell whether a login comes from a device this account has already verified.
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
    // Storage unavailable: fall back to a per-launch id, which just means an OTP each launch.
    return (cached = randomId());
  }
}
