// Starts Expo on the laptop's real Wi-Fi/Ethernet IP, ignoring virtual adapters (VMware, Hyper-V,
// WSL, Docker, VirtualBox) that otherwise get advertised to Expo Go and can't be reached by the phone.
const os = require('os');
const { spawn } = require('child_process');

const VIRTUAL = /vmware|vmnet|virtualbox|vbox|hyper-v|vethernet|wsl|docker|loopback|tailscale|zerotier|bluetooth/i;

function pickLanIp() {
  const found = [];
  for (const [name, addrs] of Object.entries(os.networkInterfaces())) {
    if (VIRTUAL.test(name)) continue;
    for (const a of addrs || []) {
      if (a.family === 'IPv4' && !a.internal && !a.address.startsWith('169.254.')) {
        found.push({ name, address: a.address });
      }
    }
  }
  return found.find((f) => /wi-?fi|wlan|wireless/i.test(f.name)) || found[0] || null;
}

const env = { ...process.env };
const lan = pickLanIp();
if (lan) {
  env.REACT_NATIVE_PACKAGER_HOSTNAME = lan.address;
  console.log(`[start] Using ${lan.name} (${lan.address}) for Expo`);
} else {
  console.warn('[start] No LAN adapter found, letting Expo choose');
}

const cmd = process.platform === 'win32' ? 'npx.cmd' : 'npx';
const child = spawn(cmd, ['expo', 'start', ...process.argv.slice(2)], { stdio: 'inherit', env, shell: process.platform === 'win32' });
child.on('exit', (code) => process.exit(code ?? 0));
