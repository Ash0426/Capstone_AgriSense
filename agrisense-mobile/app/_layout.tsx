// app/_layout.tsx
// Root stack. "login" is the first screen a user sees; once logged in they land on the
// (tabs) group. Screens pushed on top of the tabs (automation, system-logs, user-log,
// lifecycle, sensor/[key]) are declared here too so any tab can navigate to them.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
import { FarmDataProvider } from '../context/FarmDataContext';

export default function RootLayout() {
  return (
    <AuthProvider>
      <FarmDataProvider>
        <StatusBar style="dark" />
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="login" />
          <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
          <Stack.Screen name="terms" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="automation" />
          <Stack.Screen name="system-logs" />
          <Stack.Screen name="user-log" />
          <Stack.Screen name="lifecycle" />
          <Stack.Screen name="sensor/[key]" />
          <Stack.Screen name="weekly-weather" />
          <Stack.Screen name="hardware-settings" />
        </Stack>
      </FarmDataProvider>
    </AuthProvider>
  );
}

