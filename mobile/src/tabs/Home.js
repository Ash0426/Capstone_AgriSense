import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, ScrollView, TouchableOpacity, Modal, Switch, SafeAreaView, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function Home({ userRole }) {
  const [activeModal, setActiveModal] = useState(null); 
  const [roofOpen, setRoofOpen] = useState(false);
  const [valveOpen, setValveOpen] = useState(false);

  // Weather States
  const [todayWeather, setTodayWeather] = useState(null);
  const [weekForecast, setWeekForecast] = useState([]);
  const [isLoadingWeather, setIsLoadingWeather] = useState(true);

  // Fetch Weather Data Safely
  useEffect(() => {
    const fetchWeather = async () => {
      try {
        const API_KEY = '648a544726ca6d9aeb011003890cd594'; 
        const CITY = 'Zamboanga,PH'; 
        
        if (API_KEY === '648a544726ca6d9aeb011003890cd594') {
          setIsLoadingWeather(false);
          return;
        }

        const currentRes = await fetch(`https://api.openweathermap.org/data/2.5/weather?q=${CITY}&appid=${API_KEY}&units=metric`);
        const currentData = await currentRes.json();
        
        if (currentData && currentData.main) {
          setTodayWeather({
            temp: Math.round(currentData.main.temp),
            condition: currentData.weather[0].main,
            desc: currentData.weather[0].description,
          });
        }

        const forecastRes = await fetch(`https://api.openweathermap.org/data/2.5/forecast?q=${CITY}&appid=${API_KEY}&units=metric`);
        const forecastData = await forecastRes.json();

        if (forecastData && forecastData.list) {
          const dailyData = forecastData.list.filter(reading => reading.dt_txt.includes("12:00:00"));
          
          // 🔴 FIX #1: Safe Date Formatting (No toLocaleDateString)
          const dayNames = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
          
          const formattedForecast = dailyData.map(day => {
            const date = new Date(day.dt * 1000);
            return {
              id: day.dt.toString(),
              day: dayNames[date.getDay()], // Safe mobile array lookup
              temp: Math.round(day.main.temp),
              condition: day.weather[0].main
            };
          });
          setWeekForecast(formattedForecast);
        }
      } catch (error) {
        console.log("Weather API Error:", error);
      } finally {
        setIsLoadingWeather(false);
      }
    };

    fetchWeather();
  }, []);

  const getWeatherIcon = (condition, size = 20, color = "#1e3a8a") => {
    switch(condition) {
      case 'Clear': return <Ionicons name="sunny" size={size} color="#eab308" />;
      case 'Clouds': return <Ionicons name="partly-sunny" size={size} color="#94a3b8" />;
      case 'Rain': return <Ionicons name="rainy" size={size} color="#3b82f6" />;
      case 'Thunderstorm': return <Ionicons name="thunderstorm" size={size} color="#4f46e5" />;
      default: return <Ionicons name="cloud" size={size} color={color} />;
    }
  };

  return (
    <View style={{ flex: 1, backgroundColor: '#f5f5f4' }}>
      <ScrollView style={styles.screenContent} showsVerticalScrollIndicator={false}>
        
        {/* WEATHER MODULE */}
        <View style={styles.weatherCard}>
          {isLoadingWeather ? (
             <ActivityIndicator size="small" color="#1e3a8a" />
          ) : (
            <>
              <View style={styles.todayRow}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.weatherTitle}>Current Weather</Text>
                  {todayWeather ? (
                    <Text style={styles.weatherSub}>{todayWeather.temp}°C | {todayWeather.condition}</Text>
                  ) : (
                    <Text style={styles.weatherSub}>Weather Offline</Text>
                  )}
                </View>
                {todayWeather ? getWeatherIcon(todayWeather.condition, 36) : <Ionicons name="cloud-offline" size={36} color="#94a3b8" />}
              </View>

              <View style={styles.divider} />

              <Text style={styles.forecastTitle}>5-Day Forecast</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.forecastScroll}>
                {weekForecast.length > 0 ? weekForecast.map((item) => (
                  <View key={item.id} style={styles.forecastDay}>
                    <Text style={styles.forecastDayText}>{item.day}</Text>
                    {getWeatherIcon(item.condition, 24)}
                    <Text style={styles.forecastTempText}>{item.temp}°C</Text>
                  </View>
                )) : (
                  <Text style={{ fontSize: 12, color: '#a8a29e' }}>Forecast data unavailable. Please check API Key.</Text>
                )}
              </ScrollView>
            </>
          )}
        </View>

        {/* LIVE SENSOR READINGS */}
        <Text style={styles.sectionTitle}>Live Sensor Readings</Text>
        <View style={styles.metricsGrid}>
          <View style={styles.metricCard}><View style={styles.barTemp} /><View style={styles.metricCardBody}><Text style={styles.cardLabel}>Air Temp</Text><Text style={styles.metricValue}>35.2°C</Text></View></View>
          <View style={styles.metricCard}><View style={styles.barHumid} /><View style={styles.metricCardBody}><Text style={styles.cardLabel}>Air Humidity</Text><Text style={styles.metricValue}>72%</Text></View></View>
          <View style={styles.metricCard}><View style={styles.barSoil} /><View style={styles.metricCardBody}><Text style={styles.cardLabel}>Soil Moisture</Text><Text style={styles.metricValue}>48%</Text></View></View>
          <View style={styles.metricCard}><View style={styles.barWater} /><View style={styles.metricCardBody}><Text style={styles.cardLabel}>Tank Water</Text><Text style={styles.metricValue}>85%</Text></View></View>
        </View>

        {/* ADMIN CONTROLS */}
        {userRole === 'admin' && (
          // 🔴 FIX #2: Removed 'gap: 12' and replaced with safe margins
          <View style={{ marginTop: 10, marginBottom: 40 }}>
            <TouchableOpacity style={[styles.outlineButton, { marginBottom: 12 }]} onPress={() => setActiveModal('override')}>
              <Ionicons name="hardware-chip-outline" size={20} color="#3d9970" style={{ marginRight: 8 }} />
              <Text style={styles.outlineButtonText}>Automation Override</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.outlineButton} onPress={() => setActiveModal('settings')}>
              <Ionicons name="options-outline" size={20} color="#3d9970" style={{ marginRight: 8 }} />
              <Text style={styles.outlineButtonText}>Components Automation Settings</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>

      {/* OVERRIDE MODAL */}
      <Modal visible={activeModal === 'override'} animationType="slide">
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <Text style={styles.pageTitle}>Automation Override</Text>
            <TouchableOpacity onPress={() => setActiveModal(null)}><Text style={styles.closeText}>Close</Text></TouchableOpacity>
          </View>
          <ScrollView style={styles.modalBody}>
            <View style={styles.card}>
              <View style={styles.listItem}>
                <View style={styles.listTextStack}><Text style={styles.listTitle}>Auto Roof</Text><Text style={styles.listDesc}>Force the roof open or closed</Text></View>
                <Switch value={roofOpen} onValueChange={setRoofOpen} trackColor={{ true: '#34d399', false: '#d6d3d1' }} />
              </View>
              <View style={[styles.listItem, { borderBottomWidth: 0 }]}>
                <View style={styles.listTextStack}><Text style={styles.listTitle}>Watering Valve</Text><Text style={styles.listDesc}>Force release water from tank</Text></View>
                <Switch value={valveOpen} onValueChange={setValveOpen} trackColor={{ true: '#3b82f6', false: '#d6d3d1' }} />
              </View>
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  screenContent: { flex: 1, padding: 20 },
  weatherCard: { backgroundColor: '#ffffff', padding: 16, borderRadius: 16, marginBottom: 20, borderWidth: 1, borderColor: '#e7e5e4' },
  todayRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  weatherTitle: { fontSize: 13, fontWeight: 'bold', color: '#78716c', marginBottom: 4 },
  weatherSub: { fontSize: 22, fontWeight: 'bold', color: '#1c1917' },
  divider: { height: 1, backgroundColor: '#f5f5f4', marginVertical: 16 },
  forecastTitle: { fontSize: 12, fontWeight: 'bold', color: '#a8a29e', marginBottom: 12, textTransform: 'uppercase' },
  forecastScroll: { flexDirection: 'row' },
  forecastDay: { alignItems: 'center', marginRight: 24 },
  forecastDayText: { fontSize: 13, fontWeight: '600', color: '#57534e', marginBottom: 8 },
  forecastTempText: { fontSize: 13, fontWeight: 'bold', color: '#1c1917', marginTop: 8 },
  sectionTitle: { fontSize: 20, fontWeight: 'bold', color: '#1c1917', marginBottom: 16 },
  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'space-between', marginBottom: 20 },
  metricCard: { width: '48%', backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden', marginBottom: 15 },
  metricCardBody: { padding: 16 },
  barTemp: { height: 4, backgroundColor: '#ef4444' },
  barHumid: { height: 4, backgroundColor: '#3b82f6' },
  barSoil: { height: 4, backgroundColor: '#fbbf24' },
  barWater: { height: 4, backgroundColor: '#34d399' },
  cardLabel: { fontSize: 11, color: '#78716c', fontWeight: '600', marginBottom: 6 },
  metricValue: { fontSize: 26, fontWeight: 'bold', color: '#1c1917' },
  outlineButton: { flexDirection: 'row', justifyContent: 'center', borderWidth: 1, borderColor: '#3d9970', backgroundColor: '#ffffff', padding: 14, borderRadius: 12, alignItems: 'center' },
  outlineButtonText: { color: '#3d9970', fontWeight: 'bold', fontSize: 14 },
  modalContainer: { flex: 1, backgroundColor: '#f5f5f4' },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, backgroundColor: '#ffffff', borderBottomWidth: 1, borderBottomColor: '#e7e5e4' },
  pageTitle: { fontSize: 18, fontWeight: 'bold', color: '#1c1917' },
  closeText: { color: '#3d9970', fontWeight: 'bold' },
  modalBody: { padding: 20 },
  card: { backgroundColor: '#ffffff', borderRadius: 16, borderWidth: 1, borderColor: '#e7e5e4', overflow: 'hidden' },
  listItem: { flexDirection: 'row', alignItems: 'center', padding: 16, borderBottomWidth: 1, borderBottomColor: '#f5f5f4' },
  listTextStack: { flex: 1 },
  listTitle: { fontSize: 15, fontWeight: '600', color: '#1c1917' },
  listDesc: { fontSize: 12, color: '#a8a29e', marginTop: 2 },
});