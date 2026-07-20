// config.js
// Single place to point the whole app at your Express server.
// This matches the config.js pattern you're already using for the server IP.
//
// - iOS Simulator: http://localhost:4000 works fine
// - Android Emulator: use http://10.0.2.2:4000 (localhost on the host machine)
// - Physical phone (Expo Go): use your computer's LAN IP, e.g. http://192.168.1.23:4000
//   Find it with `ipconfig` (Windows) or `ifconfig`/`ipconfig getifaddr en0` (Mac).
//   Your phone and computer must be on the same Wi-Fi network.

export const SERVER_IP = '192.168.1.112'; // <-- change this to your computer's LAN IP
export const SERVER_PORT = 4000;

export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;
