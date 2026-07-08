import React from 'react';
import { StyleSheet, Text, View, ScrollView } from 'react-native';

export default function Notification() {
  return (
    <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
      <Text style={styles.sectionTitle}>Alert Notifications</Text>
      <View style={styles.alertBanner}>
        <Text style={styles.alertBannerTitle}>⚠️ Heat Warning</Text>
        <Text style={styles.alertBannerText}>Air temperature exceeded 35°C. Auto-roof protocol initiated.</Text>
      </View>
      <View style={styles.historyCard}>
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>06:00</Text>
          <Text style={styles.historyAction}>Scheduled watering completed.</Text>
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1917', marginBottom: 16 },
  alertBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', padding: 16, borderRadius: 12, marginBottom: 16 },
  alertBannerTitle: { color: '#92400e', fontWeight: 'bold', marginBottom: 4 },
  alertBannerText: { color: '#b45309', fontSize: 13 },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 8 },
  historyRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  historyTime: { fontSize: 12, color: '#a8a29e', width: 90 },
  historyAction: { fontSize: 13, color: '#1c1917', flex: 1 },
});