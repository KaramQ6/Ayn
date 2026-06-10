import { spawnSync } from 'node:child_process';

const npmCommand = process.platform === 'win32' ? 'npm.cmd' : 'npm';

function run(args, options = {}) {
  const result = spawnSync(npmCommand, args, {
    stdio: 'inherit',
    env: options.env || process.env,
  });

  if (result.status !== 0) {
    process.exit(result.status ?? 1);
  }
}

run(['--prefix', 'client', 'ci', '--include=dev']);
run(['--prefix', 'server', 'ci', '--omit=dev']);

const clientBuildEnv = { ...process.env };
delete clientBuildEnv.VITE_API_BASE_URL;
delete clientBuildEnv.VITE_WS_URL;

run(['--prefix', 'client', 'run', 'build'], { env: clientBuildEnv });
run(['run', 'copy-client-build']);
