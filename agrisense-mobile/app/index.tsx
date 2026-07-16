// app/index.tsx
// First route the app opens to. Right now it always sends the user to /login.
// Once real auth exists, check for a stored session token here and redirect
// straight to "/(tabs)/home" if the user is already logged in.
import { Redirect } from 'expo-router';

export default function Index() {
  return <Redirect href="/login" />;
}
