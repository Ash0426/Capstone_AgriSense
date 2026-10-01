# AgriSense ESP32 firmware

`agrisense_esp32/agrisense_esp32.ino` connects the ESP32 to the AgriSense server over Wi-Fi.
**The board decides nothing by itself.** Every rule is set in the app and worked out by the server:

| Set in the app | Where | What the hardware does |
|---|---|---|
| Soil moisture limit, temperature limit, override litres | Water Automation | Valve runs when a limit is crossed |
| Time + litres for each weekday | Weekly Weather | Valve runs at that time (Schedule switch on) |
| Skip when raining | Water Automation | Scheduled run skipped if rain sensor ≥ threshold |
| Sensor calibration (raw 0% / 100%) | Hardware Settings | Raw readings turned into % |
| Minimum tank level | Hardware Settings | No watering below it + refill alert |
| Roof auto/manual, close-above °C, close on rain | Hardware Settings | Servo moves to open/closed |
| Servo open / closed angle | Hardware Settings | The angles the servo moves to |
| Reading interval | Hardware Settings | How often the board sends sensors |

| Every | Request | Does |
|---|---|---|
| 2 s | `GET /api/device/commands` | Valve open/closed (GPIO 26), servo angle (GPIO 13), reading interval |
| N s (set in app) | `POST /api/sensors` | Sends RAW soil / tank / rain values + temperature |

Safety kept on the board: it closes the valve if the server goes quiet for 15 s, or if a run goes past the time the server gave it.

**Servo:** it moves only when the angle changes, then the signal is switched off (detached). That stops the constant buzzing/turning.

## Setup

1. **Libraries** (Arduino IDE → Tools → Manage Libraries): `ESP32Servo`, `ArduinoJson` (7.x).
   For a temperature sensor, also install `DHT sensor library` + `Adafruit Unified Sensor` (DHT11/22) or `OneWire` + `DallasTemperature` (DS18B20).
2. **Server `.env`**: `DEVICE_API_KEY`, `VALVE_FLOW_LPM`, `VALVE_MAX_SECONDS` (see `server/.env.example`), then restart the server.
3. **Sketch, section 1**: Wi-Fi name/password (2.4 GHz), `SERVER_URL` = laptop LAN IP + `:4000`, `DEVICE_KEY` = same as `DEVICE_API_KEY`.
4. **Sketch, section 2**: sensor pins (ADC1 only: 32–39) and `TEMP_SENSOR` type.
5. Upload, open Serial Monitor at **115200**.
6. Calibrate in the app: **Water Automation → Hardware Settings**.

## Troubleshooting

| Serial Monitor shows | Fix |
|---|---|
| `[wifi] failed` | Wrong SSID/password, or the network is 5 GHz only |
| `HTTP -1` | Wrong `SERVER_URL` IP, server not running, or Windows Firewall blocking port 4000 |
| `HTTP 401` | `DEVICE_KEY` ≠ `DEVICE_API_KEY` in `server/.env` (or the server wasn't restarted) |
| `HTTP 500` | `DEVICE_API_KEY` missing from `server/.env` |
| Valve opens at boot / works backwards | Set `VALVE_ACTIVE_HIGH` to `0` (active-LOW relay module) |
| Servo still twitches while moving | Power it from a separate 5 V supply, with GND shared with the ESP32 |
| Soil % always 0 or 100 | Sensor on an ADC2 pin, or calibration not done in the app |
