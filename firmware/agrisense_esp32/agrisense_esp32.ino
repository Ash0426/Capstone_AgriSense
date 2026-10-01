
#include <WiFi.h>
#include <HTTPClient.h>
#include <ArduinoJson.h>
#include <ESP32Servo.h>

// ============ 1. EDIT THESE (same values you used before) ===============================
const char* WIFI_SSID     = "TECNO SPARK 10 Pro";      
const char* WIFI_PASSWORD = "mabagalnanga";
const char* SERVER_URL    = "http://10.72.54.142:4000"; 
const char* DEVICE_KEY    = "6e437ac9914ff3fe4a0b3a5cd74e5b7fdb9d28aa09b3e351";

// ============ 2. PINS (only change if your wiring is different) =========================
#define SERVO_PIN 13
#define VALVE_PIN 26
// Relay modules are often "active LOW" (the relay clicks ON when the pin is LOW).
// If the valve opens at boot or behaves backwards, change this to 0.
#define VALVE_ACTIVE_HIGH 1

// Analog sensors MUST be on ADC1 pins (32, 33, 34, 35, 36, 39). ADC2 pins stop working
// for analogRead() once WiFi is on.
#define SOIL_PIN        34
#define WATER_LEVEL_PIN 35   // -1 if you don't have a tank level sensor wired
#define RAIN_PIN        -1   // ADC1 pin (e.g. 32) if your 2nd water sensor is a rain sensor

// Temperature sensor type: 0 = none, 1 = DHT11, 2 = DHT22, 3 = DS18B20
#define TEMP_SENSOR 0
#define TEMP_PIN    4        // data pin for the DHT / DS18B20

// Calibration, limits, schedule, roof rules and servo angles are ALL set in the app now
// (Automation -> Hardware Settings). Nothing else to edit here.

// ============ timings ==================================================================
const unsigned long POLL_MS        = 2000;
const unsigned long FAILSAFE_MS    = 15000; // no good poll for this long -> close valve
const unsigned long GRACE_MS       = 3000;  // extra time allowed past the server's run length
const unsigned long SERVO_MOVE_MS  = 800;   // time the servo gets to reach its angle before the signal is cut
unsigned long sensorIntervalMs     = 30000; // replaced by the value set in the app

// =======================================================================================
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
int  servoAngle = -1;             // last angle we moved to (-1 = not moved yet since boot)
unsigned long lastGoodPoll = 0;
unsigned long valveDeadline = 0;  // millis() by which the valve must be closed
unsigned long lastPoll = 0, lastSensor = 0;
bool sentFirstReading = false;

void setValve(bool open) {
  if (open == valveOpen) return;
  valveOpen = open;
  digitalWrite(VALVE_PIN, (open == (bool)VALVE_ACTIVE_HIGH) ? HIGH : LOW);
  Serial.printf("[valve] %s\n", open ? "OPEN" : "CLOSED");
}

// Move ONLY when the angle changes. Attach -> move -> wait -> detach, so no signal is left
// running on the pin (that's what made the servo keep buzzing/turning).
void moveServo(int angle) {
  angle = constrain(angle, 0, 180);
  if (angle == servoAngle) return;

  roofServo.attach(SERVO_PIN, 500, 2400);
  roofServo.write(angle);
  delay(SERVO_MOVE_MS);
  roofServo.detach();
  pinMode(SERVO_PIN, OUTPUT);
  digitalWrite(SERVO_PIN, LOW);   // hold the signal line quiet

  Serial.printf("[servo] moved %d -> %d deg\n", servoAngle, angle);
  servoAngle = angle;
}

int readAvg(int pin) {
  long sum = 0;
  for (int i = 0; i < 10; i++) { sum += analogRead(pin); delay(5); }
  return sum / 10;
}

void connectWiFi() {
  if (WiFi.status() == WL_CONNECTED) return;
  Serial.printf("[wifi] connecting to %s", WIFI_SSID);
  WiFi.begin(WIFI_SSID, WIFI_PASSWORD);
  unsigned long start = millis();
  while (WiFi.status() != WL_CONNECTED && millis() - start < 10000) { delay(300); Serial.print("."); }
  if (WiFi.status() == WL_CONNECTED) Serial.printf("\n[wifi] connected, ESP32 IP %s\n", WiFi.localIP().toString().c_str());
  else Serial.println("\n[wifi] failed, will retry");
}

void pollCommands() {
  HTTPClient http;
  http.setTimeout(3000);
  http.begin(String(SERVER_URL) + "/api/device/commands");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.GET();

  if (code == 200) {
    JsonDocument doc;
    if (!deserializeJson(doc, http.getString())) {
      // Valve
      bool wantOpen = doc["valveOpen"] | false;
      int secondsLeft = doc["valveSecondsLeft"] | 0;
      if (wantOpen && secondsLeft > 0) {
        valveDeadline = millis() + (unsigned long)secondsLeft * 1000UL + GRACE_MS;
        setValve(true);
      } else {
        setValve(false);
      }

      // Servo — angle set in the app
      if (!doc["roofAngle"].isNull()) moveServo(doc["roofAngle"].as<int>());

      // How often to send readings — set in the app
      int intervalSec = doc["sensorIntervalSec"] | 30;
      sensorIntervalMs = (unsigned long)constrain(intervalSec, 5, 3600) * 1000UL;

      lastGoodPoll = millis();
    }
  } else {
    Serial.printf("[poll] HTTP %d %s\n", code, code == 401 ? "(DEVICE_KEY doesn't match server/.env)" : "");
  }
  http.end();
}

void sendReadings() {
  JsonDocument doc;

  // Raw values (0-4095). The server converts them to % with the calibration from the app.
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
  http.begin(String(SERVER_URL) + "/api/sensors");
  http.addHeader("Content-Type", "application/json");
  http.addHeader("X-Device-Key", DEVICE_KEY);
  int code = http.POST(body);
  // The reply includes the % values the server worked out, so you can see them here too.
  Serial.printf("[sensor] sent %s -> HTTP %d %s\n", body.c_str(), code, code == 201 ? http.getString().c_str() : "");
  http.end();
}

void setup() {
  // Valve closed before anything else happens.
  pinMode(VALVE_PIN, OUTPUT);
  digitalWrite(VALVE_PIN, VALVE_ACTIVE_HIGH ? LOW : HIGH);

  // Servo signal quiet until the app says where it should be.
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

  // --- safety: runs every loop, even with WiFi down ---
  if (valveOpen && (now - lastGoodPoll > FAILSAFE_MS || (long)(now - valveDeadline) > 0)) {
    Serial.println("[safety] closing valve (lost server or run overdue)");
    setValve(false);
  }

  if (WiFi.status() != WL_CONNECTED) {
    connectWiFi();
    return;
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
