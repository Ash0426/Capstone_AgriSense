// app/login.tsx
// Login screen. Email + password (or, once an email is typed, a quick-login PIN) validate
// against the real /auth/login endpoint. The server asks for an emailed OTP only when this is
// a new device or the account hasn't logged in for 3+ days — see AuthContext.login().
// The form sits in a white card floating over a static, light mint-to-pale-yellow gradient.
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
import { LinearGradient } from 'expo-linear-gradient';
import { colors, radius, spacing } from '../constants/theme';
import Button from '../components/ui/Button';
import Checkbox from '../components/ui/Checkbox';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../api/client';

const GRADIENT_COLORS = ['#cdecd2', '#edfabe', '#fbf9a0'] as const;

function BackgroundGradient() {
  return (
    <LinearGradient
      colors={GRADIENT_COLORS}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={StyleSheet.absoluteFill}
    />
  );
}

function BrandLockup() {
  return (
    <View style={styles.logoWrap}>
      <Image source={require('../assets/images/logo-straight.png')} style={styles.brandLogoImage} resizeMode="contain" />
    </View>
  );
}

export default function LoginScreen() {
  const [step, setStep] = useState<'credentials' | 'otp'>('credentials');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [usePin, setUsePin] = useState(false);
  const [pin, setPin] = useState('');
  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, verifyStepUp, resendStepUpOtp } = useAuth();

  const emailEntered = email.includes('@');

  const handleLogin = async () => {
    const secret = usePin ? pin : password;
    if (!email || !secret) {
      Alert.alert('Missing info', usePin ? 'Please enter your email and PIN.' : 'Please enter your email and password.');
      return;
    }
    if (!agreed) {
      Alert.alert('Terms required', 'Please accept the Terms & Conditions to continue.');
      return;
    }
    setLoading(true);
    try {
      const { requiresStepUp } = await login(email.trim(), usePin ? { pin } : { password });
      if (requiresStepUp) {
        setOtp('');
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
      await verifyStepUp(otp.trim());
      router.replace('/(tabs)/home');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not verify the code. Please try again.';
      Alert.alert('Verification failed', message);
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    try {
      await resendStepUpOtp();
      Alert.alert('Code sent', 'We emailed you a new code.');
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Could not resend the code.';
      Alert.alert('Resend failed', message);
    }
  };

  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
        <BackgroundGradient />
        <KeyboardAvoidingView style={styles.transparentFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
            <View style={styles.card}>
              <BrandLockup />

              <Text style={styles.heading}>Verify it's you</Text>
              <Text style={styles.subheading}>
                This is a new device or it's been 3 or more days since your last login. We emailed a 6-digit code to {email}.
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

              <TouchableOpacity onPress={handleResendOtp} style={[styles.forgotLink, { alignSelf: 'center', marginTop: spacing.lg, marginBottom: spacing.sm }]}>
                <Text style={styles.forgotText}>Resend code</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={() => setStep('credentials')} style={[styles.forgotLink, { alignSelf: 'center', marginBottom: 0 }]}>
                <Text style={styles.forgotText}>Back to login</Text>
              </TouchableOpacity>
            </View>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.flex} edges={['top', 'bottom']}>
      <BackgroundGradient />
      <KeyboardAvoidingView style={styles.transparentFlex} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView contentContainerStyle={styles.scroll} keyboardShouldPersistTaps="handled">
          <View style={styles.card}>
            <BrandLockup />

            <Text style={styles.heading}>Welcome back</Text>
            <Text style={styles.subheading}>Log in to monitor your farm</Text>

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

            {usePin ? (
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>PIN</Text>
                <View style={styles.passwordRow}>
                  <TextInput
                    style={styles.passwordInput}
                    placeholder="4-6 digit PIN"
                    placeholderTextColor={colors.textMuted}
                    secureTextEntry={!showPassword}
                    keyboardType="number-pad"
                    maxLength={6}
                    value={pin}
                    onChangeText={(t) => setPin(t.replace(/[^0-9]/g, ''))}
                  />
                  <TouchableOpacity onPress={() => setShowPassword(!showPassword)} hitSlop={8}>
                    <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={18} color={colors.textMuted} />
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
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
            )}

            <View style={styles.methodRow}>
              {emailEntered ? (
                <TouchableOpacity onPress={() => { setUsePin(!usePin); setPassword(''); setPin(''); }}>
                  <Text style={styles.forgotText}>{usePin ? 'Use password instead' : 'Use PIN instead'}</Text>
                </TouchableOpacity>
              ) : (
                <View />
              )}
              {!usePin && (
                <TouchableOpacity onPress={() => router.push('/forgot-password')}>
                  <Text style={styles.forgotText}>Forgot password?</Text>
                </TouchableOpacity>
              )}
            </View>

            <View style={styles.termsRow}>
              <Checkbox checked={agreed} onToggle={() => setAgreed(!agreed)} />
              <Text style={styles.termsText}>
                I agree to the{' '}
                <Text style={styles.termsLink} onPress={() => router.push('/terms')}>
                  Terms &amp; Conditions
                </Text>{' '}
                and Privacy Policy
              </Text>
            </View>

            <Button label="Log In" onPress={handleLogin} loading={loading} style={{ marginTop: spacing.lg }} />
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  flex: { flex: 1, backgroundColor: colors.background },
  transparentFlex: { flex: 1 },
  scroll: { flexGrow: 1, padding: spacing.xxl, justifyContent: 'center' },
  card: {
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.xxl,
    shadowColor: '#1c1917',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.08,
    shadowRadius: 24,
    elevation: 6,
  },
  logoWrap: { alignItems: 'center', marginBottom: spacing.xxl },
  brandLogoImage: { width: 200, height: 39, marginBottom: spacing.xs },
  heading: { fontSize: 24, fontWeight: '700', color: colors.textDarkGreen, marginBottom: 4, textAlign: 'center' },
  subheading: { fontSize: 14, color: colors.textSecondary, marginBottom: spacing.xxl, textAlign: 'center' },
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
  methodRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.lg },
  forgotText: { fontSize: 13, color: colors.mint, fontWeight: '500' },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: spacing.sm },
  termsText: { flex: 1, fontSize: 12, color: colors.textSecondary, lineHeight: 17 },
  termsLink: { color: colors.mint, fontWeight: '600' },
});
