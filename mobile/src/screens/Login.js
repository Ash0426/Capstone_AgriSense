import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TextInput, TouchableOpacity, Alert, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';

export default function Login({ onLoginSuccess }) {
  // Main fields
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [termsAccepted, setTermsAccepted] = useState(false);
  
  // Reset process fields
  const [resetEmail, setResetEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [showNewPassword, setShowNewPassword] = useState(false);
  
  // Navigation & verification states
  const [step, setStep] = useState('login'); 
  const [otp, setOtp] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // 🔴 CHANGE THIS TO YOUR LAPTOP IP OR 'localhost'
  const SERVER_IP = '192.168.1.112'; 

  const handleInput = (setter, value) => {
    setErrorMessage('');
    setter(value);
  };

  const handleLoginPress = async () => {
    setErrorMessage(''); 
    if (!email || !password) return setErrorMessage('Please fill in all fields.');
    if (!termsAccepted) return setErrorMessage('You must accept the Terms & Conditions.');
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://${SERVER_IP}:3000/api/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), password: password })
      });
      const data = await response.json();

      if (response.ok) {
        // --- 1-HOUR BYPASS CHECK ---
        const lastLoginStr = localStorage.getItem(`last_login_${email.trim()}`);
        if (lastLoginStr) {
          const timeSinceLastLogin = Date.now() - parseInt(lastLoginStr);
          const ONE_HOUR = 60 * 60 * 1000;
          if (timeSinceLastLogin < ONE_HOUR) {
             // Skip OTP, log them straight in!
             onLoginSuccess({ email: email.trim(), role: data.role, username: data.username, password: password });
             return;
          }
        }
        
        setStep('otp');
        setErrorMessage('');
      } else {
        setErrorMessage(data.error || 'Login failed. Please check your credentials.');
      }
    } catch (error) {
      setErrorMessage('Network Error. Could not connect to the server.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerifyOTP = async () => {
    setErrorMessage('');
    if (otp.length < 4) return setErrorMessage('Please enter a valid 4-digit OTP.');
    
    setIsLoading(true);
    try {
      const response = await fetch(`http://${SERVER_IP}:3000/api/verify-otp`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: email.trim(), otp: otp })
      });
      const data = await response.json();

      if (response.ok) {
        setErrorMessage('');
        // Save the timestamp of this successful OTP verification
        localStorage.setItem(`last_login_${email.trim()}`, Date.now().toString());
        
        onLoginSuccess({ email: email.trim(), role: data.role, username: data.username, password: password });
      } else {
        setErrorMessage(data.error || 'Verification failed.');
      }
    } catch (error) {
      setErrorMessage('Network Error. Could not verify code.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRequestReset = async () => {
    setErrorMessage('');
    if (!resetEmail) return setErrorMessage('Please provide your email address.');

    setIsLoading(true);
    try {
      const response = await fetch(`http://${SERVER_IP}:3000/api/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim() })
      });
      const data = await response.json();

      if (response.ok) {
        setStep('forgot_otp');
        setErrorMessage('');
      } else {
        setErrorMessage(data.error || 'Request failed.');
      }
    } catch (error) {
      setErrorMessage('Network Error. Could not communicate request.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleExecuteReset = async () => {
    setErrorMessage('');
    if (otp.length < 4) return setErrorMessage('Please enter the 4-digit code.');
    if (!newPassword || newPassword.length < 4) return setErrorMessage('Please type a valid new password (min 4 chars).');

    setIsLoading(true);
    try {
      const response = await fetch(`http://${SERVER_IP}:3000/api/reset-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: resetEmail.trim(), otp: otp, newPassword: newPassword })
      });
      const data = await response.json();

      if (response.ok) {
        Alert.alert('Success', data.message);
        setOtp('');
        setNewPassword('');
        setErrorMessage('');
        setStep('login');
      } else {
        setErrorMessage(data.error || 'Reset failed.');
      }
    } catch (error) {
      setErrorMessage('Network Error. Failed to commit new password.');
    } finally {
      setIsLoading(false);
    }
  };

  // STEP: Normal Login OTP
  if (step === 'otp') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Enter Verification Code</Text>
          <Text style={styles.subText}>We sent a security OTP to {email}</Text>
          
          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <TextInput style={styles.input} placeholder="Enter 4-digit OTP" keyboardType="numeric" value={otp} onChangeText={(v) => handleInput(setOtp, v)} maxLength={4} />
          <TouchableOpacity style={styles.primaryBtn} onPress={handleVerifyOTP} disabled={isLoading}>
            <Text style={styles.btnText}>{isLoading ? 'Verifying...' : 'Verify & Login'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP: Request Forgot Password Email Form
  if (step === 'forgot_email') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Reset Password</Text>
          <Text style={styles.subText}>Provide your account email to receive a recovery token.</Text>
          
          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>Account Email Address</Text>
          <TextInput style={styles.input} placeholder="yourname@domain.com" value={resetEmail} onChangeText={(v) => handleInput(setResetEmail, v)} autoCapitalize="none" keyboardType="email-address" />
          
          <TouchableOpacity style={styles.primaryBtn} onPress={handleRequestReset} disabled={isLoading}>
            <Text style={styles.btnText}>{isLoading ? 'Sending Token...' : 'Send Recovery Code'}</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => { setStep('login'); setErrorMessage(''); }} style={styles.backLink}>
            <Text style={styles.forgotText}>Back to Login</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // STEP: Verify Forgot Password OTP & Set New Password Combination
  if (step === 'forgot_otp') {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.card}>
          <Text style={styles.title}>Create New Password</Text>
          <Text style={styles.subText}>Enter the recovery code sent to {resetEmail} and select a new password string.</Text>
          
          {errorMessage ? (
            <View style={styles.errorBox}>
              <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
              <Text style={styles.errorText}>{errorMessage}</Text>
            </View>
          ) : null}

          <Text style={styles.label}>4-Digit Recovery Code</Text>
          <TextInput style={styles.input} placeholder="Enter Code" keyboardType="numeric" value={otp} onChangeText={(v) => handleInput(setOtp, v)} maxLength={4} />

          <Text style={styles.label}>New System Password</Text>
          <View style={styles.passwordContainer}>
            <TextInput style={styles.passwordInput} placeholder="Enter new password" value={newPassword} onChangeText={(v) => handleInput(setNewPassword, v)} secureTextEntry={!showNewPassword} />
            <TouchableOpacity onPress={() => setShowNewPassword(!showNewPassword)}>
              <Text style={styles.toggleText}>{showNewPassword ? 'Hide' : 'Show'}</Text>
            </TouchableOpacity>
          </View>
          
          <TouchableOpacity style={[styles.primaryBtn, { marginTop: 15 }]} onPress={handleExecuteReset} disabled={isLoading}>
            <Text style={styles.btnText}>{isLoading ? 'Updating Account...' : 'Update Password & Login'}</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  // DEFAULT BASE STEP: Normal Login Screen
  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.card}>
        <View style={styles.logoBox}>
          <MaterialCommunityIcons name="leaf" size={32} color="#059669" />
        </View>
        <Text style={styles.title}>AgriSense Portal</Text>
        
        {errorMessage ? (
          <View style={styles.errorBox}>
            <MaterialCommunityIcons name="alert-circle" size={18} color="#dc2626" />
            <Text style={styles.errorText}>{errorMessage}</Text>
          </View>
        ) : null}
        
        <Text style={styles.label}>Email Address</Text>
        <TextInput style={styles.input} placeholder="admin@agrisense.com" value={email} onChangeText={(v) => handleInput(setEmail, v)} autoCapitalize="none" keyboardType="email-address" />
        
        <Text style={styles.label}>Password</Text>
        <View style={styles.passwordContainer}>
          <TextInput style={styles.passwordInput} placeholder="Enter password" value={password} onChangeText={(v) => handleInput(setPassword, v)} secureTextEntry={!showPassword} />
          <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
            <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity style={{ alignSelf: 'flex-end', marginBottom: 20 }} onPress={() => { setStep('forgot_email'); setErrorMessage(''); }}>
          <Text style={styles.forgotText}>Forgot Password?</Text>
        </TouchableOpacity>

        <View style={styles.termsRow}>
          <Switch value={termsAccepted} onValueChange={(v) => { setTermsAccepted(v); setErrorMessage(''); }} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
          <Text style={styles.termsText}>I accept the Terms and Conditions</Text>
        </View>

        <TouchableOpacity style={styles.primaryBtn} onPress={handleLoginPress} disabled={isLoading}>
          <Text style={styles.btnText}>{isLoading ? 'Authenticating...' : 'Login'}</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a3d2e', justifyContent: 'center', padding: 20 },
  card: { backgroundColor: '#ffffff', padding: 24, borderRadius: 20, shadowColor: '#000', shadowOpacity: 0.1, shadowRadius: 10 },
  logoBox: { width: 60, height: 60, backgroundColor: '#d1fae5', borderRadius: 16, justifyContent: 'center', alignItems: 'center', alignSelf: 'center', marginBottom: 16 },
  title: { fontSize: 24, fontWeight: 'bold', color: '#1c1917', textAlign: 'center', marginBottom: 24 },
  subText: { textAlign: 'center', color: '#78716c', marginBottom: 20, fontSize: 13, lineHeight: 18 },
  label: { fontSize: 12, fontWeight: '600', color: '#57534e', marginBottom: 6 },
  input: { backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16, color: '#1c1917' },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, paddingHorizontal: 14, marginBottom: 8 },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1c1917' },
  toggleText: { fontSize: 13, fontWeight: 'bold', color: '#3d9970', paddingHorizontal: 4 },
  forgotText: { color: '#3d9970', fontSize: 12, fontWeight: '600' },
  termsRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 24 },
  termsText: { fontSize: 12, color: '#57534e', marginLeft: 10 },
  primaryBtn: { backgroundColor: '#3d9970', padding: 16, borderRadius: 12, alignItems: 'center' },
  btnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 16 },
  backLink: { alignSelf: 'center', marginTop: 20, padding: 5 },
  errorBox: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#fee2e2', padding: 12, borderRadius: 8, marginBottom: 20 },
  errorText: { color: '#dc2626', fontSize: 13, marginLeft: 8, fontWeight: '500', flex: 1 },
});