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

## Schedule

### GET /schedule  (protected)
Response 200: `{ "morningTime": "06:03", "durationMinutes": 12 }`

### PUT /schedule  (protected)
Request: `{ "morningTime": "06:03", "durationMinutes": 12 }`
Response 200: `{ "morningTime": "06:03", "durationMinutes": 12 }`

---

## Logs

### GET /logs/:type  (protected)
`:type` is one of `temp-humidity`, `soil`, `valve`, `roof`
Response 200: `[{ "time": "...", ... type-specific fields } ]`

---

## Notifications

### GET /notifications  (protected)
Response 200: `[{ "id": 1, "icon": "thermometer", "iconBg": "amber", "title": "...", "desc": "...", "time": "..." }]`

---

## Users / Profile

### GET /users/me  (protected)
Response 200: `{ "id": 1, "name": "Farmer", "email": "...", "role": "Administrator", "color": "#3d9970" }`

### PATCH /users/me  (protected)
Request: `{ "name"?: string, "email"?: string, "password"?: string, "role"?: string, "color"?: string }`
Response 200: updated user object

### GET /users/me/activity  (protected)
Response 200: `[{ "id": 1, "action": "...", "time": "..." }]`
