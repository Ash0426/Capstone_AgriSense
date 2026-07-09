import React, { useState } from 'react';
// 🔴 ADDED 'Alert' to the imports for safe mobile pop-ups
import { StyleSheet, Text, View, SafeAreaView, TouchableOpacity, Alert } from 'react-native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';

import Login from './src/screens/Login';
import Home from './src/tabs/Home';
import Profile from './src/tabs/Profile';
import Notification from './src/tabs/Notification';

export default function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [activeTab, setActiveTab] = useState('home');

  // 🔴 FIXED: Replaced window.confirm with mobile-safe Alert
  const handleLogout = () => {
    Alert.alert(
      "Log Out",
      "Are you sure you want to log out of AgriSense?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Log Out", 
          style: "destructive",
          onPress: () => {
            setCurrentUser(null);
            setActiveTab('home');
          } 
        }
      ]
    );
  };

  const handleUpdateUser = (updatedData) => {
    setCurrentUser(prev => ({ ...prev, ...updatedData }));
  };

  if (!currentUser) {
    return <Login onLoginSuccess={(userData) => setCurrentUser(userData)} />;
  }

  const getIconName = (id, isActive) => {
    if (id === 'home') return isActive ? 'home' : 'home-outline';
    if (id === 'notification') return isActive ? 'notifications' : 'notifications-outline';
    if (id === 'profile') return isActive ? 'person' : 'person-outline';
  };

  const TabButton = ({ id, label }) => (
    <TouchableOpacity style={styles.navItem} onPress={() => setActiveTab(id)}>
      <Ionicons 
        name={getIconName(id, activeTab === id)} 
        size={24} 
        color={activeTab === id ? '#1a3d2e' : '#a8a29e'} 
        style={{ marginBottom: 4 }} 
      />
      <Text style={[styles.navText, activeTab === id && styles.navTextActive]}>{label}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.appContainer}>
      <View style={styles.appHeader}>
        <View style={styles.headerLeft}>
          <View style={styles.headerLogoBox}>
            <MaterialCommunityIcons name="leaf" size={24} color="#059669" />
          </View>
          <View>
            <Text style={styles.headerTitle}>AgriSense</Text>
            {/* 🔴 FIXED: Added safe fallbacks so it never crashes on an empty string */}
            <Text style={styles.headerSub}>Logged in as {currentUser?.role ? currentUser.role.toUpperCase() : 'USER'}</Text>
          </View>
        </View>
      </View>

      {/* 🔴 FIXED: Safely passing the role to components */}
      {activeTab === 'home' && <Home userRole={currentUser?.role} />}
      {activeTab === 'notification' && <Notification />}
      {activeTab === 'profile' && (
        <Profile 
          userRole={currentUser?.role} 
          userEmail={currentUser?.email}
          currentUser={currentUser}           
          onLogout={handleLogout} 
          onUpdateUser={handleUpdateUser}       
        />
      )}

      <View style={styles.bottomNav}>
        <TabButton id="home" label="Home" />
        <TabButton id="notification" label="Alerts" />
        <TabButton id="profile" label="Profile" />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  appContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  appHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 16, backgroundColor: '#1a3d2e' },
  headerLeft: { flexDirection: 'row', alignItems: 'center' },
  headerLogoBox: { width: 40, height: 40, backgroundColor: '#d1fae5', borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  headerTitle: { color: '#ffffff', fontSize: 16, fontWeight: 'bold' },
  headerSub: { color: '#6ee7b7', fontSize: 10, fontWeight: 'bold' },
  bottomNav: { flexDirection: 'row', backgroundColor: '#ffffff', borderTopWidth: 1, borderTopColor: '#e7e5e4', paddingBottom: 20, paddingTop: 10 },
  navItem: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  navText: { fontSize: 10, color: '#a8a29e', fontWeight: '600' },
  navTextActive: { color: '#1a3d2e', fontWeight: 'bold' }
});