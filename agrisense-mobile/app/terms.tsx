// terms and conditions
import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, spacing } from '../constants/theme';
import Card from '../components/ui/Card';
import ScreenHeader from '../components/ui/ScreenHeader';

const TERMS: { title: string; body: string }[] = [
  {
    title: '1. Acceptance of Terms',
    body: 'By logging in to or using AgriSense, you agree to these Terms & Conditions and the Privacy Policy below. If you do not agree, do not use the app.',
  },
  {
    title: '2. What AgriSense Does',
    body: 'AgriSense monitors lettuce-growing conditions (soil moisture, temperature, humidity, water level), records crop health, and can control a water valve and roof shade through an ESP32 device. It is a decision-support and automation aid for your farm, not a substitute for your own judgment.',
  },
  {
    title: '3. Accounts and Access',
    body: 'Accounts are created by an administrator. You are responsible for keeping your password and PIN private and for all activity under your account. Do not share your credentials. For your protection, AgriSense asks for an emailed one-time code when you log in from a new device or after 3 or more days without logging in. Tell an administrator right away if you suspect unauthorized access.',
  },
  {
    title: '4. Acceptable Use',
    body: 'Use AgriSense only for lawful farm management. Do not attempt to access other users\' accounts, interfere with the server or device, reverse engineer the system, or send false data to it. Administrators may disable accounts that misuse the system.',
  },
  {
    title: '5. Automation and Equipment Safety',
    body: 'Watering and roof control follow the limits, schedules, and rules that you set. You are responsible for choosing safe values and for keeping the valve, tank, wiring, and power supply in good working condition. The device is built to close the valve if it loses contact with the server, but you should not rely on software alone to prevent over-watering, flooding, or equipment damage. Inspect your system regularly.',
  },
  {
    title: '6. Sensor Data and Predictions',
    body: 'Readings depend on correctly installed and calibrated sensors and can be inaccurate or delayed. Weather information, watering suggestions, and heat-stress predictions are estimates based on available data. They may be wrong. Verify important conditions in person before acting on them.',
  },
  {
    title: '7. Your Data',
    body: 'AgriSense stores your account details (name, email, hashed password and PIN), activity history, sensor readings, watering and roof logs, lettuce health ratings, and any notes you add. This data is used only to operate the app, show your farm\'s history, and improve the heat-stress prediction for your farm. Passwords and PINs are stored as one-way hashes and cannot be read back.',
  },
  {
    title: '8. Privacy and Sharing',
    body: 'We do not sell your data. Data is shared only with users of the same farm account, and with email services used to send verification codes. Administrators can see user activity logs. Data is kept for as long as your account exists, and an administrator can remove your account and its records on request.',
  },
  {
    title: '9. Notifications and Email',
    body: 'AgriSense sends in-app notifications about watering, tank level, limits, and crop status, and emails verification codes to your registered address. Make sure your email address is correct and that you can receive messages from it.',
  },
  {
    title: '10. Availability',
    body: 'The system depends on your Wi-Fi, power, server, and device being online. We do not guarantee uninterrupted service. During outages, automation may pause and data may be missing for that period.',
  },
  {
    title: '11. Limitation of Liability',
    body: 'AgriSense is provided "as is" without warranties of any kind. To the fullest extent allowed by law, its developers are not liable for crop loss, water waste, equipment damage, or other losses caused by the use of, or inability to use, the system, including sensor errors, incorrect predictions, or connectivity failures.',
  },
  {
    title: '12. Changes to These Terms',
    body: 'These terms may be updated as the system changes. Continuing to use AgriSense after an update means you accept the new terms.',
  },
];

export default function TermsScreen() {
  return (
    <SafeAreaView style={styles.flex} edges={['top']}>
      <ScrollView contentContainerStyle={styles.scroll}>
        <ScreenHeader title="Terms & Conditions" subtitle="AgriSense — please read before using the app" showBack />

        <Card style={styles.card}>
          <View style={styles.body}>
            {TERMS.map((t, i) => (
              <View key={t.title} style={[styles.item, i === TERMS.length - 1 && styles.lastItem]}>
                <Text style={styles.itemTitle}>{t.title}</Text>
                <Text style={styles.itemBody}>{t.body}</Text>
              </View>
            ))}
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { padding: spacing.lg, paddingBottom: 40 },
  card: { marginBottom: spacing.lg },
  body: { padding: spacing.lg },
  item: { marginBottom: spacing.lg },
  lastItem: { marginBottom: 0 },
  itemTitle: { fontSize: 14, fontWeight: '700', color: colors.textDarkGreen, marginBottom: 4 },
  itemBody: { fontSize: 13, color: colors.textBody, lineHeight: 19 },
});
