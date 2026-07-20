// app/forgot-password.tsx
// OTP-based password reset — matches the Nodemailer OTP flow already built on the backend.
// Step 1: enter email, request code. Step 2: enter the 6-digit OTP + new password.
import React, { useState } from 'react';
import { View, Text, TextInput, StyleSheet, ScrollView, Alert } from 'react-native';
import { router } from 'expo-router';
import { colors, radius, spacing } from '../constants/theme';
import Button from '../components/ui/Button';
import ScreenHeader from '../components/ui/ScreenHeader';
import { requestPasswordOtp, resetPassword as resetPasswordApi } from '../api/endpoints';
import { ApiError } from '../api/client';

export default function ForgotPasswordScreen() {
  const [step, setStep] = useState<'email' | 'otp'>('email');
  const [email, setEmail] = useState('');
  const [otp, setOtp] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const requestOtp = async () => {
    if (!email) return Alert.alert('Missing email', 'Enter the email tied to your account.');
    setLoading(true);
    try {
      await requestPasswordOtp(email.trim());
      setStep('otp');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not send the code. Please try again.';
      Alert.alert('Something went wrong', message);
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async () => {
    if (!otp || !newPassword) return Alert.alert('Missing info', 'Enter the OTP and a new password.');
    setLoading(true);
    try {
      await resetPasswordApi(email.trim(), otp.trim(), newPassword);
      Alert.alert('Password updated', 'You can now log in with your new password.', [
        { text: 'OK', onPress: () => router.back() },
      ]);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not reset your password. Please try again.';
      Alert.alert('Something went wrong', message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <ScrollView contentContainerStyle={styles.scroll}>
      <ScreenHeader
        title="Reset password"
        subtitle={step === 'email' ? "We'll email you a one-time code" : `Enter the code sent to ${email}`}
      />

      {step === 'email' ? (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Email</Text>
            <TextInput
              style={styles.input}
              placeholder="you@example.com"
              placeholderTextColor={colors.textMuted}
              autoCapitalize="none"
              keyboardType="email-address"
              value={email}
              onChangeText={setEmail}
            />
          </View>
          <Button label="Send code" onPress={requestOtp} loading={loading} />
        </>
      ) : (
        <>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>6-digit code</Text>
            <TextInput
              style={styles.input}
              placeholder="123456"
              placeholderTextColor={colors.textMuted}
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
            />
          </View>
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>New password</Text>
            <TextInput
              style={styles.input}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry
              value={newPassword}
              onChangeText={setNewPassword}
            />
          </View>
          <Button label="Reset password" onPress={resetPassword} loading={loading} />
        </>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scroll: { flexGrow: 1, backgroundColor: colors.background, padding: spacing.xxl },
  field: { marginBottom: spacing.lg },
  fieldLabel: { fontSize: 13, fontWeight: '500', color: colors.textSecondary, marginBottom: 6 },
  input: {
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: 12,
    fontSize: 14,
    color: colors.textPrimary,
  },
});
