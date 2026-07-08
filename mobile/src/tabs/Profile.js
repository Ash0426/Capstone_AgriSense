import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput } from 'react-native';

export default function Profile({ userColor, setUserColor, profileColors }) {
  const [userName, setUserName] = useState('Farmer');
  const [userEmail, setUserEmail] = useState('admin@agrisense.local');
  const [userPass, setUserPass] = useState('********');

  return (
    <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Edit Profile</Text>
      
      <View style={styles.card}>
        <View style={styles.cardBody}>
          <View style={{ alignItems: 'center', marginBottom: 20 }}>
            <View style={[styles.avatarBig, { backgroundColor: userColor }]}><Text style={{fontSize: 40}}>🧑‍🌾</Text></View>
            <Text style={styles.subLabel}>Choose Theme Color</Text>
            <View style={styles.colorPickerRow}>
              {profileColors.map(color => (
                <TouchableOpacity 
                  key={color} 
                  style={[styles.colorCircle, { backgroundColor: color }, userColor === color && styles.colorCircleActive]} 
                  onPress={() => setUserColor(color)} 
                />
              ))}
            </View>
          </View>

          <Text style={styles.inputLabel}>Name</Text>
          <TextInput style={styles.input} value={userName} onChangeText={setUserName} />
          
          <Text style={styles.inputLabel}>Email</Text>
          <TextInput style={styles.input} value={userEmail} onChangeText={setUserEmail} keyboardType="email-address" />
          
          <Text style={styles.inputLabel}>Password</Text>
          <TextInput style={styles.input} value={userPass} onChangeText={setUserPass} secureTextEntry />
          
          <Text style={styles.inputLabel}>User Type</Text>
          <TextInput style={[styles.input, { backgroundColor: '#e7e5e4', color: '#78716c' }]} value="Administrator" editable={false} />
          
          <TouchableOpacity style={styles.primaryButton}><Text style={styles.primaryButtonText}>Save Changes</Text></TouchableOpacity>
        </View>
      </View>

      <Text style={[styles.sectionTitle, { marginTop: 20 }]}>User Activity Log</Text>
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>Today · 08:32</Text>
          <Text style={styles.historyAction}>Changed Threshold to 55%</Text>
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 20 }}>
        <TouchableOpacity style={styles.dangerButton}><Text style={styles.dangerButtonText}>🚪 Log Out</Text></TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1917', marginBottom: 16 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', marginBottom: 20 },
  cardBody: { padding: 16 },
  avatarBig: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  colorPickerRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  colorCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#1c1917' },
  subLabel: { fontSize: 11, color: '#a8a29e', fontWeight: '500', marginBottom: 4 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16, color: '#1c1917' },
  primaryButton: { backgroundColor: '#3d9970', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  dangerButton: { backgroundColor: '#fee2e2', padding: 14, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 8 },
  historyRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  historyTime: { fontSize: 12, color: '#a8a29e', width: 90 },
  historyAction: { fontSize: 13, color: '#1c1917', flex: 1 },
});