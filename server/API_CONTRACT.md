# AgriSense API Contract

Base URL: `http://<YOUR_COMPUTER_IP>:4000/api` (set in `config.js` on the frontend)

All request/response bodies are JSON. Protected routes require:
`Authorization: Bearer <token>` (token returned from login).

---

## Auth

### POST /auth/login
Request: `{ "email": string, "password": string }`
Response 200: `{ "token": string, "user": { "id": number, "name": string, "email": string, "role": string, "color": string } }`
Response 401: `{ "error": "Invalid email or password" }`

### POST /auth/forgot-password/request
Sends a 6-digit OTP to the email via Nodemailer (valid 10 minutes).
Request: `{ "email": string }`
Response 200: `{ "message": "OTP sent" }`

### POST /auth/forgot-password/reset
Request: `{ "email": string, "otp": string, "newPassword": string }`
Response 200: `{ "message": "Password updated" }`
Response 400: `{ "error": "Invalid or expired OTP" }`

### POST /auth/login/request-otp
Step-up verification sent after a correct email+password when the last login was 24h+ ago.
Sends a 6-digit OTP to the email via Nodemailer (valid 10 minutes). Same `otps` table as
forgot-password, different email copy.
Request: `{ "email": string }`
Response 200: `{ "message": "OTP sent" }`

### POST /auth/login/verify-otp
Request: `{ "email": string, "otp": string }`
Response 200: `{ "message": "Verified" }`
Response 400: `{ "error": "Invalid or expired OTP" }`

---

## Sensors

### GET /sensors/latest  (protected)
Response 200:
```json
{
  "airTemp": 35.2, "airTempStatus": "danger",
  "airHumidity": 72, "airHumidityStatus": "ok",
  "soilMoisture": 48, "soilMoistureStatus": "warn",
  "rain": 0.0, "rainStatus": "ok",
  "waterLevel": 72,
  "updatedAt": "2026-07-17T08:30:00.000Z"
}
```
`waterLevel` falls back to the last reading that reported one (or 72) if the latest row didn't include it — hardware doesn't have to report it every time.

### POST /sensors  (ESP32 only — requires `X-Device-Key: <DEVICE_API_KEY>` header)
Request: any of `{ "soilRaw", "waterRaw", "rainRaw" }` (raw analog 0-4095, converted to % with the
calibration from `/hardware-settings`) and/or `{ "airTemp", "airHumidity", "soilMoisture", "rain", "waterLevel" }`.
Fields not sent carry over from the previous reading.
Response 201: `{ "message": "Reading stored", "soilMoisture"?, "waterLevel"?, "rain"? }` · 401 if the device key is wrong.
Then the farmer's rules run on the server (lib/automation.js): tank-low alert (below `tankMinLevel`),
roof auto rules (if `roofMode` is `auto`), and limit watering (soil below `soilMoistureLimit` or temp
above `tempLimit` → one timed run of `overrideAmountLiters` per breach).
Status labels (`Too Hot`, `Dry`, ...) use the ranges from `/calibration`.

---

## Hardware link (ESP32)

### GET /device/commands  (ESP32 only — `X-Device-Key` header)
Polled every ~2 s.
Response 200: `{ "valveOpen": boolean, "valveSecondsLeft": number, "roofOpen": boolean, "roofAngle": number, "sensorIntervalSec": number }`
`roofAngle` is `servoOpenAngle` or `servoClosedAngle`; the board only moves the servo when it changes.

### GET /device/status  (protected)
Response 200: `{ "online": boolean, "lastSeen": string | null, "valveOpen": boolean, "valveSecondsLeft": number, "valveReason": string | null, "raw": { "soil": number | null, "water": number | null, "rain": number | null } }`

### GET /hardware-settings · PATCH /hardware-settings  (protected)
`PATCH` body: any subset of
`{ soilDryRaw, soilWetRaw, waterEmptyRaw, waterFullRaw, rainDryRaw, rainWetRaw` (0-4095),
`tankMinLevel, rainThreshold` (0-100 %), `roofMode` ("manual" | "auto"), `roofCloseTemp` (°C),
`roofCloseOnRain` (boolean), `servoOpenAngle, servoClosedAngle` (0-180), `sensorIntervalSec` (5-3600) `}`.
Both return the full settings object. 400 with a message if a value is out of range.

### Watering schedule (runs on the server)
Every 20 s the server checks today's row of `/watering-schedule`. At that time (up to 15 min late),
if the `timer` switch is on, it waters `amountLiters` once for the day — skipped (and logged) if
the `skipRain` switch is on and the rain sensor is at/above `rainThreshold`. Never waters when the
tank is below `tankMinLevel`.

### POST /valve/run  (protected)
Request: `{ "liters"?: number }` (defaults to the saved override amount). Valve opens for
`liters / VALVE_FLOW_LPM` minutes, capped at `VALVE_MAX_SECONDS`, then the server closes it.
Response 201: `{ "liters": number, "seconds": number }` · 409 if a run is already going or the tank is below `tankMinLevel`.

### POST /valve/stop  (protected)
Response 200: `{ "valveOpen": false }`

---

## Switches

### GET /switches  (protected)
Response 200: `{ "roof": true, "valve": false, "timer": true, "notifications": true, "skipRain": true }`

### PATCH /switches/:key  (protected)
Request: `{ "value": boolean }`
Response 200: `{ "key": "roof", "value": true }`
`valve: true` opens the valve until switched off, capped at `VALVE_MAX_SECONDS`.
`roof` moves the roof now and sets `roofMode` to `manual`. `timer` = run the weekly schedule, `skipRain` = skip it when raining.

---

## Logs

### GET /logs/:type  (protected)
`:type` is one of `temp-humidity`, `soil`, `valve`, `roof`, `lifecycle`, `sensor-heatIndex`, `sensor-soilMoisture`, `sensor-airTemp`, `sensor-waterLevel`
Response 200: `[{ "time": "...", ... type-specific fields } ]` — `valve`/`roof` rows also include `"by": "<user name>"`, the account that made the change (manual toggle or an automation running under a logged-in session).

### POST /logs/lifecycle  (protected)
The only client-writable log type — lifecycle age/health-rating changes aren't tied to a
sensor POST or a switch toggle, so nothing else creates these server-side.
Request: `{ "action": string, "statusType": "ok" | "warn" | "danger" }`
Response 201: `{ "time": "...", "action": "...", "statusType": "..." }`

---

## Farm settings (lifecycle, automation limits, watering schedule, calibration, notifications)

Farm-wide, not per-user — same model as switches/sensor_readings/logs. All protected.

### GET /lifecycle · PATCH /lifecycle
`PATCH` body: `{ "ageDays": number }` (>= 1). Both return `{ "ageDays": number, "updatedAt": "..." }`.

### GET /automation-limits · PATCH /automation-limits
`PATCH` body: any subset of `{ "soilMoistureLimit": number, "tempLimit": number, "overrideAmountLiters": number }`.
Both return `{ "soilMoistureLimit": number, "tempLimit": number, "overrideAmountLiters": number }`.

### GET /watering-schedule
Response 200: `{ "Mon": { "time": "06:00", "amountLiters": 2 }, "Tue": { ... }, ... }` (one entry per day, Mon-Sun).

### PATCH /watering-schedule/:day
`:day` is one of `Mon`..`Sun`. Body: `{ "time": string, "amountLiters": number }`.
Response 200: `{ "day": "Mon", "time": "...", "amountLiters": number }`.

### GET /calibration
Response 200: `{ "heatIndex": { "min": 15, "max": 35 }, "soilMoisture": { ... }, "airTemp": { ... }, "waterLevel": { ... } }`.

### PATCH /calibration/:key
`:key` is one of `heatIndex`, `soilMoisture`, `airTemp`, `waterLevel`. Body: `{ "min": number, "max": number }` (min < max).
Response 200: `{ "key": "...", "min": number, "max": number }`.

### GET /notifications
Response 200: `[{ "id": 1, "category": "watered" | "tank-low" | "limit-exceeded" | "daily-status" | "lifecycle-change", "icon": "...", "iconBg": "...", "title": "...", "desc": "...", "time": "..." }]` (newest first).

### POST /notifications
Request: `{ "category": string, "icon": string, "iconBg": string, "title": string, "desc": string }`
Response 201: same shape as a `GET /notifications` row.

---

## Users / Profile

### GET /users/me  (protected)
Response 200: `{ "id": 1, "name": "Farmer", "email": "...", "role": "Administrator", "color": "#3d9970" }`

### PATCH /users/me  (protected)
Request: `{ "name"?: string, "email"?: string, "password"?: string, "role"?: string, "color"?: string }`
Response 200: updated user object

### GET /users/me/activity  (protected)
Response 200: `[{ "id": 1, "action": "...", "time": "..." }]`

### GET /users  (admin only)
Response 200: `[{ "id": 1, "name": "...", "email": "...", "role": "Administrator" | "User", "password_hash": "...", "disabled": boolean, "created_at": "..." }]`
Response 403: `{ "error": "Admin access required" }`

### POST /users  (admin only)
Request: `{ "name": string, "email": string, "password": string, "role"?: "Administrator" | "User" }`
Response 201: same shape as a `GET /users` row
Response 409: `{ "error": "A user with that email already exists" }`

### PATCH /users/:id  (admin only)
Request: `{ "name"?: string, "email"?: string, "role"?: string, "disabled"?: boolean }`
Response 200: same shape as a `GET /users` row

### DELETE /users/:id  (admin only)
Response 200: `{ "message": "User deleted" }`
Response 400: `{ "error": "You can't delete your own account" }`

---

## Lettuce Health / Heat Stress ML

### POST /health-log  (protected)
Persists a farmer-submitted health rating with a snapshot of the latest sensor reading —
this is the labeled training data for the heat-stress model below.
Request: `{ "rating": "Dried out" | "Drooping" | "Slight paleness" | "Good color and firmness" | "Vibrant green / firm and upright" }`
Response 201: `{ "id": 1, "user_id": 1, "rating": "...", "stressed": 0 | 1, "air_temp": 35.2, "air_humidity": 72, "soil_moisture": 48, "created_at": "..." }`

### GET /health-log  (protected)
Response 200: `[{ "id": 1, "rating": "...", "stressed": 0, ... }]`

### GET /ml/heat-stress  (protected)
Trains a Random Forest classifier (`ml-random-forest`, in-process, retrained per request) on
all `health_logs` rows and predicts risk for the latest sensor reading. Requires at least 20
logged ratings with at least 5 of each class (stressed / not stressed) before it predicts —
until then it honestly reports that it doesn't have enough data yet, no fabricated numbers.
Response 200 (not enough data): `{ "status": "insufficient-data", "collected": 6, "required": 20 }`
Response 200 (ready): `{ "status": "ok", "risk": "low" | "moderate" | "high", "probability": 0.42, "trainedOn": 23, "topFactor": "Air Temperature", "latestReading": { "airTemp": 35.2, "airHumidity": 72, "soilMoisture": 48 } }`
