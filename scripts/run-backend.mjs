import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const backendDirectory = join(projectRoot, 'backend');
const apiUrl = `http://localhost:${process.env.PORT || 3000}/api/health`;

try {
  const response = await fetch(apiUrl, { signal: AbortSignal.timeout(1500) });
  const health = response.ok ? await response.json() : null;
  if (health?.status === 'ok') {
    console.log(`Reusing telemetry backend at ${apiUrl}`);
    const keepAlive = setInterval(() => {}, 60_000);
    await new Promise((resolve) => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });
    clearInterval(keepAlive);
    process.exit(0);
  }
} catch {
  // Start the backend when no healthy local instance is available.
}

const backendEntry = process.env.NODE_ENV === 'production'
  ? join(backendDirectory, 'dist', 'server.js')
  : join(backendDirectory, 'node_modules', 'ts-node', 'dist', 'bin.js');
const backendArgs = process.env.NODE_ENV === 'production'
  ? [backendEntry]
  : [backendEntry, 'src/server.ts'];
const backendProcess = spawn(process.execPath, backendArgs, {
  cwd: backendDirectory,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => backendProcess.kill(signal));
}

backendProcess.on('error', (error) => {
  console.error('Failed to start the telemetry backend:', error);
  process.exitCode = 1;
});

backendProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});