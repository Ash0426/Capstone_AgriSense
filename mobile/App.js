import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  SafeAreaView, 
  ScrollView, 
  TouchableOpacity, 
  TextInput,
  Modal,
  Switch
} from 'react-native';

export default function App() {
  // --- NAVIGATION STATE ---
  const [activeTab, setActiveTab] = useState('home');
  const [activeModal, setActiveModal] = useState(null); // 'automation', 'irrigation', 'logs'

  // --- HARDWARE / DASHBOARD STATE ---
  const [threshold, setThreshold] = useState(55);
  const [roofOpen, setRoofOpen] = useState(false);
  const [valveOpen, setValveOpen] = useState(false);
  const [autoWatering, setAutoWatering] = useState(true);

  // --- PROFILE STATE ---
  const profileColors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];
  const [userColor, setUserColor] = useState(profileColors[0]);
  const [userName, setUserName] = useState('Farmer');
  const [userEmail, setUserEmail] = useState('admin@agrisense.local');
  const [userPass, setUserPass] = useState('********');

  // --- HELPER COMPONENTS ---
  const TabButton = ({ id, icon, label }) => (
    <TouchableOpacity 
      style={styles.navItem} 
      onPress={() => setActiveTab(id)}
    >
      <Text style={[styles.navIcon, activeTab === id ? { opacity: 1 } : { opacity: 0.5 }]}>{icon}</Text>
      <Text style={[styles.navText, activeTab === id && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  // --- SUB-SCREENS (MODALS) ---
  const renderAutomationModal = () => (
    <Modal visible={activeModal === 'automation'} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.pageTitle}>Automation Overrides</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.card}>
            <View style={styles.listItem}>
              <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}><Text>🏠</Text></View>
              <View style={styles.listTextStack}>
                <Text style={styles.listTitle}>Auto Roof</Text>
                <Text style={styles.listDesc}>Closes when it gets too hot</Text>
              </View>
              <Switch value={roofOpen} onValueChange={setRoofOpen} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
            </View>
            <View style={styles.listItem}>
              <View style={[styles.iconWrapper, { backgroundColor: '#dbeafe' }]}><Text>💧</Text></View>
              <View style={styles.listTextStack}>
                <Text style={styles.listTitle}>Water Valve</Text>
                <Text style={styles.listDesc}>Opens to water the plants</Text>
              </View>
              <Switch value={valveOpen} onValueChange={setValveOpen} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
            </View>
            <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
              <View style={[styles.iconWrapper, { backgroundColor: '#d1fae5' }]}><Text>⏱️</Text></View>
              <View style={styles.listTextStack}>
                <Text style={styles.listTitle}>Watering Timer</Text>
                <Text style={styles.listDesc}>Waters on a schedule</Text>
              </View>
              <Switch value={autoWatering} onValueChange={setAutoWatering} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderIrrigationModal = () => (
    <Modal visible={activeModal === 'irrigation'} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.pageTitle}>Irrigation Controller</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
          <View style={styles.card}>
            <View style={styles.cardHeader}><Text style={styles.panelTitle}>Current Schedule</Text></View>
            <View style={styles.cardBody}>
              <View style={styles.flexRowBetween}>
                <View>
                  <Text style={styles.subLabel}>Next watering</Text>
                  <Text style={styles.metricValue}>06:30</Text>
                </View>
                <View>
                  <Text style={styles.subLabel}>Duration</Text>
                  <Text style={styles.metricValue}>12 min</Text>
                </View>
              </View>
            </View>
          </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  const renderLogsModal = () => (
    <Modal visible={activeModal === 'logs'} animationType="slide">
      <SafeAreaView style={styles.modalContainer}>
        <View style={styles.modalHeader}>
          <Text style={styles.pageTitle}>System Logs</Text>
          <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.modalBody}>
           <View style={styles.historyCard}>
             <View style={styles.historyRow}>
               <Text style={styles.historyTime}>08:32</Text>
               <Text style={styles.historyAction}>Valve Opened (Soil Dry)</Text>
             </View>
             <View style={styles.historyRow}>
               <Text style={styles.historyTime}>08:31</Text>
               <Text style={styles.historyAction}>Roof Closed (35.2°C)</Text>
             </View>
             <View style={styles.historyRow}>
               <Text style={styles.historyTime}>07:00</Text>
               <Text style={styles.historyAction}>System Online</Text>
             </View>
           </View>
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );

  // --- MAIN TABS ---
  const renderHome = () => (
    <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
      
      {/* 1. What's Happening Right Now */}
      <View style={styles.statusSummaryBox}>
        <Text style={styles.statusBigIcon}>{roofOpen ? '👐' : '🏠'}</Text>
        <Text style={styles.statusSummaryTitle}>Roof: {roofOpen ? 'Open' : 'Closed'}</Text>
        <Text style={styles.statusSummaryDesc}>
          {roofOpen ? 'Manually opened via dashboard' : "Closed automatically · it's 35.2°C outside"}
        </Text>
        <View style={styles.badgeCloud}>
          <View style={styles.cloudBadge}><View style={[styles.dot, roofOpen ? styles.bgBlue : styles.bgRed]} /><Text style={styles.cloudBadgeText}>Roof {roofOpen ? 'Open' : 'Closed'}</Text></View>
          <View style={styles.cloudBadge}><View style={[styles.dot, valveOpen ? styles.bgGreen : styles.bgGray]} /><Text style={styles.cloudBadgeText}>Valve {valveOpen ? 'Open' : 'Closed'}</Text></View>
          <View style={styles.cloudBadge}><View style={[styles.dot, styles.bgBlue]} /><Text style={styles.cloudBadgeText}>No Rain</Text></View>
        </View>
      </View>

      {/* 2. Live Sensor Readings Grid */}
      <Text style={styles.sectionTitle}>Live Sensor Readings</Text>
      <View style={styles.metricsGrid}>
        <View style={styles.metricCard}>
          <View style={styles.barTemp} />
          <View style={styles.metricCardBody}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardLabel}>Air Temp</Text>
              <View style={styles.badgeDanger}><Text style={styles.badgeDangerText}>Too Hot</Text></View>
            </View>
            <Text style={styles.metricValue}>35.2°C</Text>
          </View>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.barHumid} />
          <View style={styles.metricCardBody}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardLabel}>Humidity</Text>
              <View style={styles.badgeOk}><Text style={styles.badgeOkText}>Normal</Text></View>
            </View>
            <Text style={styles.metricValue}>72%</Text>
          </View>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.barSoil} />
          <View style={styles.metricCardBody}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardLabel}>Moisture</Text>
              <View style={styles.badgeWarn}><Text style={styles.badgeWarnText}>Dry</Text></View>
            </View>
            <Text style={styles.metricValue}>48%</Text>
          </View>
        </View>
        <View style={styles.metricCard}>
          <View style={styles.barRain} />
          <View style={styles.metricCardBody}>
            <View style={styles.cardHeaderFlex}>
              <Text style={styles.cardLabel}>Rain</Text>
              <View style={styles.badgeOk}><Text style={styles.badgeOkText}>Clear</Text></View>
            </View>
            <Text style={styles.metricValue}>0.0mm</Text>
          </View>
        </View>
      </View>

      {/* 3. When should watering start */}
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.panelTitle}>When should watering start?</Text>
          <Text style={styles.listDesc}>Valve opens when soil gets too dry</Text>
        </View>
        <View style={styles.cardBody}>
          <View style={styles.flexRowBetween}>
            <TouchableOpacity onPress={() => setThreshold(t => Math.max(20, t - 5))} style={styles.threshBtn}><Text style={styles.threshBtnText}>-</Text></TouchableOpacity>
            <View style={{alignItems: 'center'}}>
              <Text style={styles.subLabel}>Threshold</Text>
              <Text style={[styles.metricValue, {color: '#3d9970'}]}>{threshold}%</Text>
            </View>
            <TouchableOpacity onPress={() => setThreshold(t => Math.min(90, t + 5))} style={styles.threshBtn}><Text style={styles.threshBtnText}>+</Text></TouchableOpacity>
          </View>
          <View style={styles.thresholdFooter}>
            <Text style={styles.subLabel}>Right now: Soil is at 48%</Text>
            {48 < threshold && <Text style={{color: '#d97706', fontWeight: 'bold', fontSize: 12}}>Watering needed</Text>}
          </View>
        </View>
      </View>

      {/* 4. Action Buttons */}
      <View style={{ gap: 12, marginTop: 10 }}>
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

      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderProfile = () => (
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
        <View style={styles.historyRow}>
          <Text style={styles.historyTime}>Yesterday</Text>
          <Text style={styles.historyAction}>Manually opened roof</Text>
        </View>
      </View>

      <View style={{ gap: 12, marginTop: 20 }}>
        <TouchableOpacity style={styles.outlineButton}><Text style={styles.outlineButtonText}>⚙️ Settings</Text></TouchableOpacity>
        <TouchableOpacity style={styles.dangerButton}><Text style={styles.dangerButtonText}>🚪 Log Out</Text></TouchableOpacity>
      </View>
      
      <View style={{ height: 40 }} />
    </ScrollView>
  );

  const renderNotifications = () => (
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

  // --- MAIN APP RENDER ---
  return (
    <SafeAreaView style={styles.appContainer}>
      
      {/* HEADER */}
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={[styles.headerLogoBox, { backgroundColor: userColor }]}>
            <Text style={styles.headerLogoText}>🥬</Text>
          </View>
          <View>
            <Text style={styles.headerTitle}>AgriSense</Text>
            <Text style={styles.headerSub}>Lettuce Monitor</Text>
          </View>
        </View>
      </View>

      {/* DYNAMIC CONTENT */}
      {activeTab === 'home' && renderHome()}
      {activeTab === 'profile' && renderProfile()}
      {activeTab === 'notification' && renderNotifications()}

      {/* RENDER ACTIVE MODAL OVERLAYS */}
      {renderAutomationModal()}
      {renderIrrigationModal()}
      {renderLogsModal()}

      {/* BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TabButton id="home" icon="📊" label="Home" />
        <TabButton id="notification" icon="🔔" label="Alerts" />
        <TabButton id="profile" icon="🧑‍🌾" label="Profile" />
      </View>

    </SafeAreaView>
  );
}

// --- STYLESHEET ---
const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  
  // Header
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1a3d2e' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogoBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerLogoText: { fontSize: 20 },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  
  // Layouts
  screenContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1917', marginBottom: 16 },
  flexRowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  
  // Status Box Top
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

  // Metrics Grid
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden', marginBottom: 15 },
  metricCardBody: { padding: 12 },
  barTemp: { height: 4, backgroundColor: '#ef4444' },
  barHumid: { height: 4, backgroundColor: '#3b82f6' },
  barSoil: { height: 4, backgroundColor: '#fbbf24' },
  barRain: { height: 4, backgroundColor: '#a78bfa' },
  cardHeaderFlex: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 },
  cardLabel: { fontSize: 11, color: '#78716c', fontWeight: '600' },
  metricValue: { fontSize: 24, fontWeight: 'bold', color: '#1c1917' },
  subLabel: { fontSize: 11, color: '#a8a29e', fontWeight: '500', marginBottom: 4 },

  // Badges
  badgeDanger: { backgroundColor: '#fee2e2', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeDangerText: { color: '#dc2626', fontSize: 10, fontWeight: 'bold' },
  badgeOk: { backgroundColor: '#d1fae5', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeOkText: { color: '#065f46', fontSize: 10, fontWeight: 'bold' },
  badgeWarn: { backgroundColor: '#fef3c7', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4 },
  badgeWarnText: { color: '#92400e', fontSize: 10, fontWeight: 'bold' },

  // Cards & Lists
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', marginBottom: 20, overflow: 'hidden' },
  cardHeader: { padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  panelTitle: { fontSize: 14, fontWeight: '600', color: '#1c1917' },
  cardBody: { padding: 16 },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  iconWrapper: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  listTextStack: { flex: 1 },
  listTitle: { fontSize: 14, fontWeight: '500', color: '#1c1917' },
  listDesc: { fontSize: 11, color: '#a8a29e', marginTop: 2 },

  // Threshold controls
  threshBtn: { width: 40, height: 40, backgroundColor: '#f5f5f4', borderRadius: 20, justifyContent: 'center', alignItems: 'center' },
  threshBtnText: { fontSize: 20, fontWeight: 'bold', color: '#57534e' },
  thresholdFooter: { marginTop: 16, paddingTop: 16, borderTopWidth: 1, borderTopColor: '#f5f5f4', flexDirection: 'row', justifyContent: 'space-between' },

  // Profile
  avatarBig: { width: 80, height: 80, borderRadius: 40, justifyContent: 'center', alignItems: 'center', marginBottom: 16 },
  colorPickerRow: { flexDirection: 'row', gap: 12, marginTop: 8 },
  colorCircle: { width: 30, height: 30, borderRadius: 15, borderWidth: 2, borderColor: 'transparent' },
  colorCircleActive: { borderColor: '#1c1917' },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', marginBottom: 6, marginLeft: 4 },
  input: { backgroundColor: '#f5f5f4', borderWidth: 1, borderColor: '#e7e5e4', borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16, color: '#1c1917' },

  // History & Alerts
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 8 },
  historyRow: { flexDirection: 'row', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  historyTime: { fontSize: 12, color: '#a8a29e', width: 90 },
  historyAction: { fontSize: 13, color: '#1c1917', flex: 1 },
  alertBanner: { backgroundColor: '#fef3c7', borderWidth: 1, borderColor: '#fcd34d', padding: 16, borderRadius: 12, marginBottom: 16 },
  alertBannerTitle: { color: '#92400e', fontWeight: 'bold', marginBottom: 4 },
  alertBannerText: { color: '#b45309', fontSize: 13 },

  // Buttons
  primaryButton: { backgroundColor: '#3d9970', padding: 14, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  outlineButton: { borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#ffffff', padding: 14, borderRadius: 12, alignItems: 'center' },
  outlineButtonText: { color: '#57534e', fontWeight: '600', fontSize: 13 },
  dangerButton: { backgroundColor: '#fee2e2', padding: 14, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },

  // Bottom Navigation
  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e7e5e4', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 22, marginBottom: 4 },
  navText: { fontSize: 10, color: '#a8a29e', fontWeight: '600' },
  navTextActive: { color: '#1a3d2e' },

  // Modals
  modalContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  closeText: { color: '#3d9970', fontWeight: 'bold' },
  modalBody: { padding: 20 }
});