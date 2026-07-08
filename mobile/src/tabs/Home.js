import React, { useState } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Switch, SafeAreaView } from 'react-native';

export default function Home() {
  const [activeModal, setActiveModal] = useState(null); 
  const [threshold, setThreshold] = useState(55);
  const [roofOpen, setRoofOpen] = useState(false);
  const [valveOpen, setValveOpen] = useState(false);
  const [autoWatering, setAutoWatering] = useState(true);

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
        
        {/* Status Box */}
        <View style={styles.statusSummaryBox}>
          <Text style={styles.statusBigIcon}>{roofOpen ? '👐' : '🏠'}</Text>
          <Text style={styles.statusSummaryTitle}>Roof: {roofOpen ? 'Open' : 'Closed'}</Text>
          <Text style={styles.statusSummaryDesc}>
            {roofOpen ? 'Manually opened via dashboard' : "Closed automatically · it's 35.2°C outside"}
          </Text>
          <View style={styles.badgeCloud}>
            <View style={styles.cloudBadge}><View style={[styles.dot, roofOpen ? styles.bgBlue : styles.bgRed]} /><Text style={styles.cloudBadgeText}>Roof {roofOpen ? 'Open' : 'Closed'}</Text></View>
            <View style={styles.cloudBadge}><View style={[styles.dot, valveOpen ? styles.bgGreen : styles.bgGray]} /><Text style={styles.cloudBadgeText}>Valve {valveOpen ? 'Open' : 'Closed'}</Text></View>
          </View>
        </View>

        {/* Action Buttons */}
        <View style={{ gap: 12, marginTop: 10, marginBottom: 20 }}>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setActiveModal('automation')}>
            <Text style={styles.outlineButtonText}>⚙️ Automations & Overrides</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setActiveModal('irrigation')}>
            <Text style={styles.outlineButtonText}>💧 Irrigation Controller</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineButton} onPress={() => setActiveModal('logs')}>
            <Text style={styles.outlineButtonText}>📋 System Logs</Text>
          </TouchableOpacity>
        </View>

      </ScrollView>

      {/* --- MODALS --- */}
      <Modal visible={activeModal === 'automation'} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>Automation Overrides</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.card}>
              <View style={styles.listItem}>
                <View style={styles.iconWrapper}><Text>🏠</Text></View>
                <View style={styles.listTextStack}>
                  <Text style={styles.listTitle}>Auto Roof</Text>
                  <Text style={styles.listDesc}>Closes when it gets too hot</Text>
                </View>
                <Switch value={roofOpen} onValueChange={setRoofOpen} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={activeModal === 'irrigation'} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>Irrigation Controller</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
             <Text style={styles.listTitle}>Watering starts at: {threshold}%</Text>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      <Modal visible={activeModal === 'logs'} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>System Logs</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  statusSummaryBox: { backgroundColor: '#ffffff', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 16, padding: 20, alignItems: 'center', marginBottom: 20 },
  statusBigIcon: { fontSize: 50, marginBottom: 8 },
  statusSummaryTitle: { fontSize: 14, fontWeight: 'bold', color: '#1c1917', textTransform: 'uppercase' },
  statusSummaryDesc: { fontSize: 12, color: '#a8a29e', marginTop: 4, marginBottom: 16, textAlign: 'center' },
  badgeCloud: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  cloudBadge: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 20, paddingHorizontal: 12, paddingVertical: 6 },
  cloudBadgeText: { fontSize: 11, fontWeight: '600', color: '#57534e', marginLeft: 6 },
  dot: { width: 8, height: 8, borderRadius: 4 },
  bgRed: { backgroundColor: '#ef4444' },
  bgGreen: { backgroundColor: '#34d399' },
  bgBlue: { backgroundColor: '#3b82f6' },
  bgGray: { backgroundColor: '#a8a29e' },
  outlineButton: { borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#ffffff', padding: 14, borderRadius: 12, alignItems: 'center' },
  outlineButtonText: { color: '#57534e', fontWeight: '600', fontSize: 13 },
  modalContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1917' },
  closeText: { color: '#3d9970', fontWeight: 'bold' },
  modalBody: { padding: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16 },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12, backgroundColor: '#d1fae5' },
  listTextStack: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '500', color: '#1c1917' },
  listDesc: { fontSize: 11, color: '#a8a29e', marginTop: 2 },
});