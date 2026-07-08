import React, { useState } from 'react';
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity } from 'react-native';

// Updated imports mapped to your new src/tabs/ folder
import Home from './src/tabs/Home';
import Profile from './src/tabs/Profile';
import Notification from './src/tabs/Notification';

export default function App() {
  const [activeTab, setActiveTab] = useState('home');
  
  // App-level state shared across screens
  const profileColors = ['#34d399', '#60a5fa', '#fbbf24', '#f87171', '#a78bfa'];
  const [userColor, setUserColor] = useState(profileColors[0]);

  // A reusable button component for our bottom tabs
  const TabButton = ({ id, icon, label }) => (
    <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(id)}>
      <Text style={[styles.navIcon, activeTab === id ? { opacity: 1 } : { opacity: 0.5 }]}>{icon}</Text>
      <Text style={[styles.navText, activeTab === id && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.appContainer}>
      
      {/* GLOBAL HEADER */}
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

      {/* DYNAMIC SCREEN RENDERING */}
      {activeTab === 'home' && <Home />}
      {activeTab === 'notification' && <Notification />}
      
      {/* Profile gets props so it can change the header color */}
      {activeTab === 'profile' && (
        <Profile 
          userColor={userColor} 
          setUserColor={setUserColor} 
          profileColors={profileColors} 
        />
      )}

      {/* GLOBAL BOTTOM NAVIGATION */}
      <View style={styles.bottomNav}>
        <TabButton id="home" icon="📊" label="Home" />
        <TabButton id="notification" icon="🔔" label="Alerts" />
        <TabButton id="profile" icon="🧑‍🌾" label="Profile" />
      </View>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1a3d2e' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogoBox: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerLogoText: { fontSize: 20 },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: 'rgba(255,255,255,0.6)', fontSize: 11 },
  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e7e5e4', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navIcon: { fontSize: 22, marginBottom: 4 },
  navText: { fontSize: 10, color: '#a8a29e', fontWeight: '600' },
  navTextActive: { color: '#1a3d2e' }
});