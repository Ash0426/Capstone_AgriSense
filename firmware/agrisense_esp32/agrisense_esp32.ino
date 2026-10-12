#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>
#include <ESPmDNS.h>
#include <WiFiMulti.h>
#include <WiFiManager.h>     // WiFiManager by tzapu
#include <Preferences.h>

// wifi networks (2.4GHz only)
struct WifiCred { const char* ssid; const char* pass; };
const WifiCred WIFI_NETWORKS[] = {
  { "TECNO SPARK 10 Pro", "mabagalnanga" },
  { "TP-Link_AC4C", "bismillah3" },
  // { "School WiFi",      "password" },
};
// laptop hostname, found using mDNS
const char* SERVER_HOST   = "LAPTOP-MI4PEUQO";
const int   SERVER_PORT   = 4000;
const char* DEVICE_KEY   = "6e437ac9914ff3fe4a0b3a5cd74e5b7fdb9d28aa09b3e351";

// pins
#define SERVO_PIN 13       
#define VALVE_PIN 26
// set to 0 if relay is active low
#define VALVE_ACTIVE_HIGH 1

// use ADC1 pins only, ADC2 doesnt work with wifi on
#define SOIL_PIN        34
#define WATER_LEVEL_PIN 35   // -1 if not used
#define RAIN_PIN        -1   // -1 if not used

// 0 = none, 1 = DHT11, 2 = DHT22, 3 = DS18B20
#define TEMP_SENSOR 0
#define TEMP_PIN    4

// timings
const unsigned long POLL_MS        = 2000;
const unsigned long FAILSAFE_MS    = 15000; // close valve if server is lost
const unsigned long GRACE_MS       = 3000;
const unsigned long SERVO_MOVE_MS  = 800;
unsigned long sensorIntervalMs     = 30000; // updated from the app

#if TEMP_SENSOR == 1 || TEMP_SENSOR == 2
  #include <DHT.h>
  DHT dht(TEMP_PIN, TEMP_SENSOR == 1 ? DHT11 : DHT22);
#elif TEMP_SENSOR == 3
  #include <OneWire.h>
  #include <DallasTemperature.h>
  OneWire oneWire(TEMP_PIN);
  DallasTemperature ds18b20(&oneWire);
#endif

Servo roofServo;

bool valveOpen = false;
int  servoAngle = -1;
unsigned long lastGoodPoll = 0;
unsigned long valveDeadline = 0;
unsigned long lastPoll = 0, lastSensor = 0;
bool sentFirstReading = false;

void setValve(bool open) {
  if (open == valveOpen) return;
  valveOpen = open;
  digitalWrite(VALVE_PIN, (open == (bool)VALVE_ACTIVE_HIGH) ? HIGH : LOW);
  Serial.printf("[valve] %s\n", open ? "OPEN" : "CLOSED");
}

// detach after moving so the servo doesnt keep buzzing
void moveServo(int angle) {
  angle = constrain(angle, 0, 180);
  if (angle == servoAngle) return;

  roofServo.attach(SERVO_PIN, 500, 2400);
  roofServo.write(angle);
  delay(SERVO_MOVE_MS);
  roofServo.detach();
  pinMode(SERVO_PIN, OUTPUT);
  digitalWrite(SERVO_PIN, LOW);

  Serial.printf("[servo] moved %d -> %d deg\n", servoAngle, angle);
  servoAngle = angle;
}

int readAvg(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) { sum += analogRead(pin); delay(5); }
  return sum / 10;
}

String serverUrl = "";
unsigned long lastResolve = 0;

bool resolveServer() {
  lastResolve = millis();
  IPAddress ip = MDNS.queryHost(SERVER_HOST, 3000);
  if (ip == IPAddress((uint32_t)0)) {
    Serial.printf("[server] could not find %s.local on this network\n", SERVER_HOST);
    return false;
  }
  serverUrl = "http://" + ip.toString() + ":" + String(SERVER_PORT);
  Serial.printf("[server] %s.local -> %s\n", SERVER_HOST, serverUrl.c_str());
  return true;
}

WiFiMulti wifiMulti;
WiFiManager wm;
Preferences wifiPrefs;
bool wifiListLoaded = false;
bool portalOn = false;
unsigned long portalStart = 0;
int wifiFailures = 0;
const int  MAX_SAVED = 8;
const unsigned long PORTAL_MS = 180000;

// save networks added from the setup page
void saveNetwork(const String& ssid, const String& pass) {
  int n = wifiPrefs.getUChar("n", 0);
  for (int i = 0; i < n; i++) {
    if (wifiPrefs.getString(("s" + String(i)).c_str()) == ssid) {
      wifiPrefs.putString(("p" + String(i)).c_str(), pass);
      return;
    }
  }
  int slot = n < MAX_SAVED ? n : 0;
  wifiPrefs.putString(("s" + String(slot)).c_str(), ssid);
  wifiPrefs.putString(("p" + String(slot)).c_str(), pass);
  if (n < MAX_SAVED) wifiPrefs.putUChar("n", n + 1);
}

void loadNetworks() {
  wifiPrefs.begin("wifi", false);
  for (const WifiCred& n : WIFI_NETWORKS) wifiMulti.addAP(n.ssid, n.pass);
  int n = wifiPrefs.getUChar("n", 0);
  for (int i = 0; i < n; i++) {
    String s = wifiPrefs.getString(("s" + String(i)).c_str());
    String p = wifiPrefs.getString(("p" + String(i)).c_str());
    if (s.length()) wifiMulti.addAP(s.c_str(), p.c_str());
  }
  wifiListLoaded = true;
}

void onWifiConnected() {
  Serial.printf("[wifi] connected to %s, ESP32 IP %s\n", WiFi.SSID().c_str(), WiFi.localIP().toString().c_str());
  MDNS.begin("agrisense-esp32");
  serverUrl = "";
  wifiFailures = 0;
}

// non blocking so the failsafe still runs
void connectWiFi() {
  if (!wifiListLoaded) loadNetworks();

  if (portalOn) {
    wm.process();
    if (WiFi.status() == WL_CONNECTED) {
      saveNetwork(WiFi.SSID(), WiFi.psk());
      wifiMulti.addAP(WiFi.SSID().c_str(), WiFi.psk().c_str());
      wm.stopConfigPortal();
      portalOn = false;
      onWifiConnected();
    } else if (millis() - portalStart > PORTAL_MS) {
      wm.stopConfigPortal();
      portalOn = false;
      wifiFailures = 0;
      Serial.println("[wifi] setup page closed, retrying known networks");
    }
    return;
  }

  if (WiFi.status() == WL_CONNECTED) return;

  Serial.println("[wifi] scanning for a known network...");
  if (wifiMulti.run(10000) == WL_CONNECTED) {
    onWifiConnected();
    return;
  }

  if (++wifiFailures >= 2) {
    Serial.println("[wifi] no known network in range. On your phone, join Wi-Fi \"AgriSense-Setup\" and pick the network.");
    wm.setConfigPortalBlocking(false);
    wm.startConfigPortal("AgriSense-Setup");
    portalOn = true;
    portalStart = millis();
  }
}

void pollCommands() {
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(serverUrl + "/api/device/commands");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.GET();

  if (code == 200) {
    JsonDocument doc;
    if (!deserializeJson(doc, http.getString())) {
      // valve
      bool wantOpen = doc["valveOpen"] | false;
      int secondsLeft = doc["valveSecondsLeft"] | 0;
      if (wantOpen && secondsLeft > 0) {
        valveDeadline = millis() + (unsigned long)secondsLeft * 1000UL + GRACE_MS;
        setValve(true);
      } else {
        setValve(false);
      }

      // roof servo
      if (!doc["roofAngle"].isNull()) moveServo(doc["roofAngle"].as<int>());

      // sensor interval
      int intervalSec = doc["sensorIntervalSec"] | 30;
      sensorIntervalMs = (unsigned long)constrain(intervalSec, 5, 3600) * 1000UL;

      lastGoodPoll = millis();
    }
  } else {
    Serial.printf("[poll] HTTP %d %s\n", code, code == 401 ? "(DEVICE_KEY doesn't match server/.env)" : "");
    if (code < 0) serverUrl = "";
  }
  http.end();
}

void sendReadings() {
  JsonDocument doc;

  // raw values, server converts to %
  doc["soilRaw"] = readAvg(SOIL_PIN);
  if (WATER_LEVEL_PIN >= 0) doc["waterRaw"] = readAvg(WATER_LEVEL_PIN);
  if (RAIN_PIN >= 0) doc["rainRaw"] = readAvg(RAIN_PIN);

#if TEMP_SENSOR == 1 || TEMP_SENSOR == 2
  float t = dht.readTemperature(), h = dht.readHumidity();
  if (!isnan(t)) doc["airTemp"] = round(t * 10) / 10.0;
  if (!isnan(h)) doc["airHumidity"] = round(h);
#elif TEMP_SENSOR == 3
  ds18b20.requestTemperatures();
  float t = ds18b20.getTempCByIndex(0);
  if (t != DEVICE_DISCONNECTED_C) doc["airTemp"] = round(t * 10) / 10.0;
#endif

  String body;
  serializeJson(doc, body);

  HTTPClient http;
  http.setTimeout(3000);
  http.begin(serverUrl + "/api/sensors");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.POST(body);
  Serial.printf("[sensor] sent %s -> HTTP %d %s\n", body.c_str(), code, code == 201 ? http.getString().c_str() : "");
  http.end();
}

void setup() {
  // keep valve closed on boot
  pinMode(VALVE_PIN, OUTPUT);
  digitalWrite(VALVE_PIN, VALVE_ACTIVE_HIGH ? LOW : HIGH);

  pinMode(SERVO_PIN, OUTPUT);
  digitalWrite(SERVO_PIN, LOW);

  Serial.begin(115200);
  delay(200);
  Serial.println("\nAgriSense ESP32 starting");

  analogReadResolution(12);
#if TEMP_SENSOR == 1 || TEMP_SENSOR == 2
  dht.begin();
#elif TEMP_SENSOR == 3
  ds18b20.begin();
#endif

  connectWiFi();
}

void loop() {
  unsigned long now = millis();

  // failsafe
  if (valveOpen && (now - lastGoodPoll > FAILSAFE_MS || (long)(now - valveDeadline) > 0)) {
    Serial.println("[safety] closing valve (lost server or run overdue)");
    setValve(false);
  }

  if (WiFi.status() != WL_CONNECTED || portalOn) {
    connectWiFi();
    if (WiFi.status() != WL_CONNECTED) return;
  }

  if (serverUrl.length() == 0) {
    if (now - lastResolve >= 5000 || lastResolve == 0) resolveServer();
    if (serverUrl.length() == 0) return;
  }

  if (now - lastPoll >= POLL_MS) {
    lastPoll = now;
    pollCommands();
  }

  if (!sentFirstReading || now - lastSensor >= sensorIntervalMs) {
    sentFirstReading = true;
    lastSensor = now;
    sendReadings();
  }
}
