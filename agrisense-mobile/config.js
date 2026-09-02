// config.js
// Single place to point the whole app at your Express server.
//
// Auto-detects your computer's current LAN IP from Expo's own dev-server connection info —
// whatever IP your phone used to load this app's JS bundle IS your computer's current IP, so
// there's no need to hand-edit this file every time your network/IP changes. Tries a few
// different Expo-provided sources (some are only populated in certain run modes) before
// falling back to a hardcoded IP. Logs what it found so this is debuggable from the Metro
// terminal if the auto-detected IP is ever wrong.
import Constants from 'expo-constants';

const FALLBACK_SERVER_IP = '192.168.1.84'; // only used if every auto-detection source below fails
export const SERVER_PORT = 4000;

function hostFromUri(uri) {
  if (!uri) return null;
  // Strip a scheme if present (e.g. "exp://192.168.1.112:8081" -> "192.168.1.112:8081").
  const withoutScheme = uri.includes('://') ? uri.split('://')[1] : uri;
  const host = withoutScheme.split('/')[0].split(':')[0];
  return host && host !== 'localhost' && host !== '127.0.0.1' ? host : null;
}

function detectServerIp() {
  const candidates = [
    ['expoConfig.hostUri', Constants.expoConfig?.hostUri],
    ['experienceUrl', Constants.experienceUrl],
    ['linkingUri', Constants.linkingUri],
  ];

  for (const [source, value] of candidates) {
    const host = hostFromUri(value);
    if (host) {
      console.log(`[config] Detected server IP "${host}" from ${source} (raw: "${value}")`);
      return host;
    }
  }

  console.warn(
    '[config] Could not auto-detect your computer\'s IP from Expo (checked expoConfig.hostUri, experienceUrl, linkingUri — all empty or localhost). ' +
      `Falling back to the hardcoded FALLBACK_SERVER_IP in config.js: "${FALLBACK_SERVER_IP}". ` +
      'Raw values — hostUri: ' + JSON.stringify(Constants.expoConfig?.hostUri) +
      ', experienceUrl: ' + JSON.stringify(Constants.experienceUrl) +
      ', linkingUri: ' + JSON.stringify(Constants.linkingUri)
  );
  return FALLBACK_SERVER_IP;
}

export const SERVER_IP = detectServerIp();

export const API_BASE_URL = `http://${SERVER_IP}:${SERVER_PORT}/api`;
console.log(`[config] API_BASE_URL = ${API_BASE_URL}`);
