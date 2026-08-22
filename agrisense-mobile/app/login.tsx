// app/login.tsx
// Login screen. Email/password validate against the real /auth/login endpoint. If the
// account's last successful login was 24h+ ago (or this is the first login this session),
// a step-up OTP screen is shown before access is granted — see AuthContext.login().
import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  Image,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, spacing } from '../constants/theme';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';
import { sendLoginStepUpOtp, verifyLoginStepUpOtp } from '../api/endpoints';

export default function LoginScreen() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, completeStepUp } = useAuth();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert('Missing info', 'Please enter your email and password.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms required', 'Please accept the Terms & Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      const { requiresStepUp } = await login(email.trim(), password);
      if (requiresStepUp) {
        await sendLoginStepUpOtp(email.trim());
        setStep('otp');
      } else {
        router.replace('/(tabs)/home');
      }
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Something went wrong. Please try again.';
      Alert.alert('Login failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp) {
      Alert.alert('Missing code', 'Enter the code we emailed you.');
      return;
    }
    setLoading(true);
    try {
      await verifyLoginStepUpOtp(email.trim(), otp.trim());
      completeStepUp();
      router.replace('/(tabs)/home');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not verify the code. Please try again.';
      Alert.alert('Verification failed', message);
    } finally {
      setLoading(false);
    }
  };

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.brandRow}>
              <Image source={require('../assets/images/logo-straight.png')} style={styles.brandLogoImage} resizeMode="contain" />
              <Text style={styles.brandSub}>Lettuce Monitor</Text>
            </View>

            <Text style={styles.heading}>Verify it's you</Text>
            <Text style={styles.subheading}>
              It's been a while since your last login — we emailed a 6-digit code to {email}
            </Text>

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

            <Button label="Verify & Log In" onPress={handleVerifyOtp} loading={loading} />

            <TouchableOpacity onPress={() => setStep('credentials')} style={styles.forgotLink}>
              <Text style={styles.forgotText}>Back to login</Text>
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
    <KeyboardAvoidingView
      style={styles.flex}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
        <View style={styles.brandRow}>
          <Image source={require('../assets/images/logo-straight.png')} style={styles.brandLogoImage} resizeMode="contain" />
          <Text style={styles.brandSub}>Lettuce Monitor</Text>
        </View>

        <Text style={styles.heading}>Welcome back</Text>
        <Text style={styles.subheading}>Log in to monitor your farm</Text>

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Admin Email</Text>
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

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Password</Text>
          <View style={styles.passwordRow}>
            <TextInput
              style={styles.passwordInput}
              placeholder="••••••••"
              placeholderTextColor={colors.textMuted}
              secureTextEntry={!showPassword}
              value={password}
              onChangeText={setPassword}
            />
            <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
            </TouchableOpacity>
          </View>
        </View>

        <TouchableOpacity onPress={() => router.push('/forgot-password')} style={styles.forgotLink}>
          <Text style={styles.forgotText}>Forgot password?</Text>
        </TouchableOpacity>

        <View style={styles.termsRow}>
          <Checkbox checked={agreed} onToggle={() => setAgreed(!agreed)} />
          <Text style={styles.termsText}>
            I agree to the <Text style={styles.termsLink}>Terms &amp; Conditions</Text> and Privacy Policy
          </Text>
        </View>

        <Button label="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.lg }} />
      </ScrollView>
    </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  scroll: { flexGrow: 1, padding: spacing.xxl, justifyContent: 'center' },
  brandRow: { alignItems: 'flex-start', marginBottom: spacing.xxxl },
  brandLogoImage: { width: 190, height: 37, marginBottom: spacing.xs },
  brandSub: { fontSize: 12, color: colors.textMuted },
  heading: { fontSize: 24, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xxl },
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
  passwordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.card,
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
  },
  passwordInput: { flex: 1, paddingVertical: 12, fontSize: 14, color: colors.textPrimary },
  forgotLink: { alignSelf: 'flex-end', marginBottom: spacing.lg },
  forgotText: { fontSize: 13, color: colors.mint, fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  termsText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  termsLink: { color: colors.mint, fontWeight: '600' },
});
