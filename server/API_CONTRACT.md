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
  "updatedAt": "2026-07-17T08:30:00.000Z"
}
```

### POST /sensors  (used by the ESP32 to push a new reading — protect with a device API key in production)
Request: `{ "airTemp": number, "airHumidity": number, "soilMoisture": number, "rain": number }`
Response 201: `{ "message": "Reading stored" }`

---

## Switches

### GET /switches  (protected)
Response 200: `{ "roof": true, "valve": false, "timer": true, "notifications": true, "skipRain": true }`

### PATCH /switches/:key  (protected)
Request: `{ "value": boolean }`
Response 200: `{ "key": "roof", "value": true }`

---

## Logs

### GET /logs/:type  (protected)
`:type` is one of `temp-humidity`, `soil`, `valve`, `roof`
Response 200: `[{ "time": "...", ... type-specific fields } ]` — `valve`/`roof` rows also include `"by": "<user name>"`, the account that made the change (manual toggle or an automation running under a logged-in session).

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
