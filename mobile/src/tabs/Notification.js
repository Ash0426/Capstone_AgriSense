import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function Notification() {
  return (
    <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. Threshold Warnings */}
      <Text style={styles.sectionTitle}>Threshold Warnings</Text>
      <View style={styles.alertBanner}>
        <Text style={styles.alertBannerTitle}>⚠️ Heat Warning Triggered</Text>
        <Text style={styles.alertBannerText}>Air temperature exceeded 35°C threshold.</Text>
      </View>
      <View style={[styles.alertBanner, { backgroundColor: '#fee2e2', borderColor: '#fca5a5' }]}>
        <Text style={[styles.alertBannerTitle, { color: '#991b1b' }]}>🚨 Soil Critically Dry</Text>
        <Text style={[styles.alertBannerText, { color: '#991b1b' }]}>Moisture dropped below 40%.</Text>
      </View>

      {/* 2. System Logs */}
      <Text style={[styles.sectionTitle, { marginTop: 10 }]}>System Logs</Text>
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>08:31</Text>
          <Text style={styles.historyAction}>Auto-roof protocol initiated (Closing)</Text>
        </View>
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>06:00</Text>
          <Text style={styles.historyAction}>Scheduled watering executed (1.5L)</Text>
        </View>
      </View>

      {/* 3. Alert Logs */}
      <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Alert Logs (History)</Text>
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>Yesterday</Text>
          <Text style={styles.historyAction}>Rain detected. Auto-watering suspended.</Text>
        </View>
      </View>

      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1917', marginBottom: 12 },
  alertBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', padding: 16, borderRadius: 12, marginBottom: 12 },
  alertBannerTitle: { fontWeight: 'bold', marginBottom: 4 },
  alertBannerText: { fontSize: 13 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 8 },
  historyRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  historyTime: { fontSize: 12, color: '#a8a29e', width: 70 },
  historyAction: { fontSize: 13, color: '#1c1917', flex: 1 },
});