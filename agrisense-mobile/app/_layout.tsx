// app/_layout.tsx
// Root stack. "login" is the first screen a user sees; once logged in they land on the
// (tabs) group. Screens pushed on top of the tabs (automation, irrigation, system-logs,
// edit-profile, user-log) are declared here too so any tab can navigate to them.
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { AuthProvider } from '../context/AuthContext';
 
export default function RootLayout() {
  return (
    <AuthProvider>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="login" />
        <Stack.Screen name="forgot-password" options={{ presentation: 'modal' }} />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="automation" />
        <Stack.Screen name="irrigation" />
        <Stack.Screen name="system-logs" />
        <Stack.Screen name="edit-profile" options={{ presentation: 'modal' }} />
        <Stack.Screen name="user-log" />
      </Stack>
    </AuthProvider>
  );
}
 
