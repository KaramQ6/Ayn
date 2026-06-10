import { randomBytes } from 'node:crypto';
import { spawn } from 'node:child_process';

process.env.NODE_ENV ||= 'production';
process.env.DEMO_MODE ||= 'true';
process.env.ACTIVE_COUNTRIES ||= 'JO';

if (!process.env.CORS_ORIGIN && process.env.RAILWAY_PUBLIC_DOMAIN) {
  process.env.CORS_ORIGIN = `https://${process.env.RAILWAY_PUBLIC_DOMAIN}`;
}

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  process.env.JWT_SECRET = randomBytes(48).toString('hex');
  console.warn('JWT_SECRET was not set. Generated an ephemeral secret for this Railway process.');
}

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';
const child = spawn(npmCommand, ['--prefix', 'server', 'start'], {
  stdio: 'inherit',
  env: process.env,
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => child.kill(signal));
}

child.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
    return;
  }
  process.exit(code ?? 0);
});
