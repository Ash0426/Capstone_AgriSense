import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, TextInput, Modal, SafeAreaView, Alert } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Profile({ userRole, userEmail, onLogout, onUpdateUser, currentUser }) {
  // 🔴 SYNC THIS IP
  const SERVER_IP = '192.168.1.112'; 

  // Profile Edit State
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [userName, setUserName] = useState(currentUser?.username || 'User');
  const [email, setEmail] = useState(userEmail);
  const [password, setPassword] = useState(currentUser?.password || ''); 
  const [showPassword, setShowPassword] = useState(false);

  // Admin Data States
  const [usersList, setUsersList] = useState([]);
  const [activityLogs, setActivityLogs] = useState([]);
  
  // Admin Create User State
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newUName, setNewUName] = useState('');
  const [newUEmail, setNewUEmail] = useState('');
  const [newUPass, setNewUPass] = useState('');
  const [isCreating, setIsCreating] = useState(false);

  // Admin Edit User State
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editOtp, setEditOtp] = useState('');
  const [editStep, setEditStep] = useState('form'); 

  useEffect(() => {
    fetchLogs();
    if (userRole === 'admin') fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}:3000/api/users`);
      const data = await res.json();
      setUsersList(data);
    } catch (e) { console.log(e); }
  };

  const fetchLogs = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}:3000/api/logs`);
      const data = await res.json();
      setActivityLogs(data);
    } catch (e) { console.log(e); }
  };

  // 🔴 FIX #1: Safe Mobile Time Formatter (No toLocaleTimeString crashes)
  const formatTime = (isoString) => {
    if (!isoString) return '';
    const d = new Date(isoString);
    let h = d.getHours();
    let m = d.getMinutes();
    const ampm = h >= 12 ? 'PM' : 'AM';
    h = h % 12;
    h = h ? h : 12; 
    m = m < 10 ? '0' + m : m;
    return `${h}:${m} ${ampm}`;
  };

  // --- SAVE PERSONAL PROFILE ---
  const handleSaveProfile = async () => {
    if (!userName || !email || !password) return Alert.alert('Error', 'Please fill in all fields.');
    
    Alert.alert(
      "Save Changes",
      "Are you sure you want to save these profile changes?",
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Save", 
          onPress: async () => {
            setIsSaving(true);
            try {
              const response = await fetch(`http://${SERVER_IP}:3000/api/update-profile`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ currentEmail: userEmail, username: userName, email: email, password: password })
              });
              const data = await response.json();
              if (response.ok) {
                Alert.alert('Success', data.message);
                setIsEditing(false);
                onUpdateUser({ username: userName, email: email, password: password });
                fetchLogs();
              } else {
                Alert.alert('Error', data.error);
              }
            } catch (error) { Alert.alert('Error', 'Network Error'); } 
            finally { setIsSaving(false); }
          }
        }
      ]
    );
  };

  // --- CREATE NEW USER ---
  const handleCreateUser = async () => {
    if (!newUName || !newUEmail || !newUPass) return Alert.alert('Error', 'Please fill in all fields');
    setIsCreating(true);
    try {
      const response = await fetch(`http://${SERVER_IP}:3000/api/create-user`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: newUName.trim(), email: newUEmail.trim().toLowerCase(), password: newUPass })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'User Created!');
        setShowCreateModal(false);
        setNewUName(''); setNewUEmail(''); setNewUPass('');
        fetchUsers();
        fetchLogs();
      } else {
         Alert.alert('Error', data.error || 'Failed to create user');
      }
    } catch (error) { Alert.alert('Error', 'Error creating user'); }
    finally { setIsCreating(false); }
  };

  // --- ADMIN EDIT USER (STEP 1: Request OTP) ---
  const handleRequestEditOtp = async () => {
    Alert.alert(
      "Send Verification",
      `Save changes? An OTP will be sent to ${editingUser.originalEmail} to verify.`,
      [
        { text: "Cancel", style: "cancel" },
        { 
          text: "Send OTP", 
          onPress: async () => {
            try {
              const res = await fetch(`http://${SERVER_IP}:3000/api/request-admin-edit`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ oldEmail: editingUser.originalEmail })
              });
              if (res.ok) setEditStep('otp');
            } catch (e) { Alert.alert('Error', 'Error requesting OTP'); }
          }
        }
      ]
    );
  };

  // --- ADMIN EDIT USER (STEP 2: Verify & Save) ---
  const handleCommitUserEdit = async () => {
    try {
      const res = await fetch(`http://${SERVER_IP}:3000/api/verify-admin-edit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          oldEmail: editingUser.originalEmail, 
          otp: editOtp, 
          newName: editingUser.username, 
          newEmail: editingUser.email, 
          newPassword: editingUser.password 
        })
      });
      const data = await res.json();
      if (res.ok) {
        Alert.alert('Success', 'User updated securely!');
        setShowEditUserModal(false);
        setEditStep('form');
        setEditOtp('');
        fetchUsers();
        fetchLogs();
      } else {
        Alert.alert('Error', data.error);
      }
    } catch (e) { Alert.alert('Error', 'Error verifying OTP'); }
  };

  return (
    <View style={{ flex: 1 }}>
      <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
        
        {/* --- PERSONAL INFO --- */}
        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
          <Text style={styles.sectionTitle}>Personal Info</Text>
          {!isEditing && (
            <TouchableOpacity style={styles.editBtn} onPress={() => setIsEditing(true)}>
              <Ionicons name="pencil" size={14} color="#3d9970" style={{ marginRight: 4 }} />
              <Text style={styles.editBtnText}>Edit Profile</Text>
            </TouchableOpacity>
          )}
        </View>

        <View style={styles.card}>
          <View style={styles.cardBody}>
            <Text style={styles.inputLabel}>Role (Locked)</Text>
            {/* 🔴 FIX #2: Safe Uppercase fallback */}
            <TextInput style={[styles.input, styles.inputLocked]} value={userRole ? userRole.toUpperCase() : 'USER'} editable={false} />

            <Text style={styles.inputLabel}>Username</Text>
            <TextInput style={isEditing ? styles.inputActive : styles.inputLocked} value={userName} onChangeText={setUserName} editable={isEditing} />
            
            <Text style={styles.inputLabel}>Email Address</Text>
            <TextInput style={isEditing ? styles.inputActive : styles.inputLocked} value={email} onChangeText={setEmail} keyboardType="email-address" autoCapitalize="none" editable={isEditing} />
            
            <Text style={styles.inputLabel}>Password</Text>
            <View style={[styles.passwordContainer, isEditing ? styles.inputActive : styles.inputLocked]}>
              <TextInput style={styles.passwordInput} value={password} onChangeText={setPassword} secureTextEntry={!showPassword} editable={isEditing} />
              <TouchableOpacity onPress={() => setShowPassword(!showPassword)}>
                <Text style={styles.toggleText}>{showPassword ? 'Hide' : 'Show'}</Text>
              </TouchableOpacity>
            </View>

            {isEditing && (
              <View style={styles.actionRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={() => setIsEditing(false)}><Text style={styles.cancelBtnText}>Cancel</Text></TouchableOpacity>
                <TouchableOpacity style={styles.saveBtn} onPress={handleSaveProfile} disabled={isSaving}><Text style={styles.saveBtnText}>{isSaving ? 'Saving...' : 'Save Changes'}</Text></TouchableOpacity>
              </View>
            )}
          </View>
        </View>

        {/* --- ADMIN: SYSTEM USERS --- */}
        {userRole === 'admin' && (
          <>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginTop: 10, marginBottom: 16 }}>
              <Text style={styles.sectionTitle}>Manage Users</Text>
              <TouchableOpacity style={styles.editBtn} onPress={() => setShowCreateModal(true)}>
                <Ionicons name="add" size={14} color="#3d9970" />
                <Text style={styles.editBtnText}>Create User</Text>
              </TouchableOpacity>
            </View>
            
            {usersList.map((usr) => (
              <View key={usr.id} style={styles.userRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logUser}>{usr.username}</Text>
                  <Text style={styles.logAction}>{usr.email}</Text>
                </View>
                <TouchableOpacity style={styles.outlineButton} onPress={() => {
                  setEditingUser({ ...usr, originalEmail: usr.email });
                  setEditStep('form');
                  setShowEditUserModal(true);
                }}>
                  <Ionicons name="pencil" size={16} color="#3d9970" />
                </TouchableOpacity>
              </View>
            ))}
          </>
        )}

        {/* --- ACTIVITY LOGS --- */}
        <Text style={[styles.sectionTitle, { marginTop: 20, marginBottom: 10 }]}>System Activity Logs</Text>
        <View style={styles.historyCard}>
          {activityLogs.length === 0 ? <Text style={{padding: 10}}>No activity yet.</Text> : 
            activityLogs.map((log) => (
              <View key={log.id} style={styles.historyRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.logUser}>{log.user_email}</Text>
                  <Text style={styles.logAction}>{log.action}</Text>
                </View>
                {/* 🔴 FIX #1 APPLIED: Safe Mobile Formatting */}
                <Text style={styles.historyTime}>{formatTime(log.timestamp)}</Text>
              </View>
            ))
          }
        </View>

        {/* --- SETTINGS --- */}
        <View style={{ marginTop: 30, marginBottom: 40 }}>
          <TouchableOpacity style={styles.dangerButton} onPress={onLogout}>
            <Ionicons name="log-out-outline" size={20} color="#dc2626" style={{ marginRight: 8 }} />
            <Text style={styles.dangerButtonText}>Log Out</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>

      {/* --- ADMIN CREATE USER MODAL --- */}
      <Modal visible={showCreateModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>Create User</Text>
            <TouchableOpacity onPress={() => setShowCreateModal(false)}><Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
             <Text style={styles.inputLabel}>New Username</Text>
             <TextInput style={styles.inputActive} value={newUName} onChangeText={setNewUName} />
             
             <Text style={styles.inputLabel}>Email Address</Text>
             <TextInput style={styles.inputActive} value={newUEmail} onChangeText={setNewUEmail} keyboardType="email-address" autoCapitalize="none" />

             <Text style={styles.inputLabel}>Temporary Password</Text>
             <TextInput style={styles.inputActive} value={newUPass} onChangeText={setNewUPass} />

             <TouchableOpacity style={styles.primaryButton} onPress={handleCreateUser} disabled={isCreating}>
               <Text style={styles.primaryButtonText}>{isCreating ? 'Creating...' : 'Create Account'}</Text>
             </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* --- ADMIN EDIT USER MODAL --- */}
      <Modal visible={showEditUserModal} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>Edit User</Text>
            <TouchableOpacity onPress={() => setShowEditUserModal(false)}><Text style={{ color: '#ef4444', fontWeight: 'bold' }}>Cancel</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
             {editStep === 'form' ? (
               <>
                 <Text style={styles.inputLabel}>Username</Text>
                 <TextInput style={styles.inputActive} value={editingUser?.username} onChangeText={(t) => setEditingUser({...editingUser, username: t})} />
                 <Text style={styles.inputLabel}>Email Address</Text>
                 <TextInput style={styles.inputActive} value={editingUser?.email} onChangeText={(t) => setEditingUser({...editingUser, email: t})} />
                 <Text style={styles.inputLabel}>Password</Text>
                 <TextInput style={styles.inputActive} value={editingUser?.password} onChangeText={(t) => setEditingUser({...editingUser, password: t})} />
                 <TouchableOpacity style={styles.primaryButton} onPress={handleRequestEditOtp}>
                   <Text style={styles.primaryButtonText}>Save & Send OTP</Text>
                 </TouchableOpacity>
               </>
             ) : (
               <>
                 <Text style={styles.inputLabel}>Enter OTP sent to {editingUser?.originalEmail}</Text>
                 <TextInput style={styles.inputActive} value={editOtp} onChangeText={setEditOtp} keyboardType="numeric" />
                 <TouchableOpacity style={styles.primaryButton} onPress={handleCommitUserEdit}>
                   <Text style={styles.primaryButtonText}>Verify & Update User</Text>
                 </TouchableOpacity>
               </>
             )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </View>
  );
}

// 🔴 FIX #3: All 'gap' properties removed safely using margins!
const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1917', marginBottom: 0 },
  editBtn: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#d1fae5', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8 },
  editBtnText: { color: '#3d9970', fontSize: 12, fontWeight: 'bold' },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', marginBottom: 20 },
  cardBody: { padding: 16 },
  inputLabel: { fontSize: 12, fontWeight: '600', color: '#57534e', marginBottom: 6, marginLeft: 4 },
  input: { borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 },
  inputLocked: { backgroundColor: '#f5f5f4', borderColor: '#e7e5e4', color: '#78716c' },
  inputActive: { backgroundColor: '#ffffff', borderColor: '#3d9970', color: '#1c1917', borderWidth: 1, borderRadius: 12, padding: 14, fontSize: 14, marginBottom: 16 },
  passwordContainer: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 14, marginBottom: 16 },
  passwordInput: { flex: 1, paddingVertical: 14, fontSize: 14, color: '#1c1917' },
  toggleText: { fontSize: 13, fontWeight: 'bold', color: '#3d9970', paddingHorizontal: 4 },
  actionRow: { flexDirection: 'row', justifyContent: 'space-between', marginTop: 10 },
  cancelBtn: { flex: 1, marginRight: 5, padding: 14, borderRadius: 12, alignItems: 'center', borderWidth: 1, borderColor: '#e7e5e4' },
  cancelBtnText: { color: '#57534e', fontWeight: 'bold', fontSize: 14 },
  saveBtn: { flex: 1, marginLeft: 5, backgroundColor: '#3d9970', padding: 14, borderRadius: 12, alignItems: 'center' },
  saveBtnText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  primaryButton: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#3d9970', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  primaryButtonText: { color: '#ffffff', fontWeight: 'bold', fontSize: 14 },
  outlineButton: { flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#e7e5e4', backgroundColor: '#ffffff', padding: 10, borderRadius: 8, alignItems: 'center' },
  dangerButton: { flexDirection: 'row', justifyContent: 'center', backgroundColor: '#fee2e2', padding: 14, borderRadius: 12, alignItems: 'center' },
  dangerButtonText: { color: '#dc2626', fontWeight: 'bold', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1917' },
  modalBody: { padding: 20 },
  userRow: { flexDirection: 'row', backgroundColor: '#fff', padding: 12, borderRadius: 12, borderWidth: 1, borderColor: '#e7e5e4', marginBottom: 8, alignItems: 'center' },
  logUser: { fontSize: 13, fontWeight: 'bold', color: '#1e40af', marginBottom: 2 },
  logAction: { fontSize: 12, color: '#1c1917' },
  historyTime: { fontSize: 11, color: '#a8a29e' },
  historyCard: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', padding: 8 },
  historyRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, paddingHorizontal: 12, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
});