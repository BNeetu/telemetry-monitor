import { spawn } from 'node:child_process';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

const projectRoot = fileURLToPath(new URL('../', import.meta.url));
const frontendDirectory = join(projectRoot, 'frontend');
const frontendUrl = 'http://localhost:4200/';

try {
  const response = await fetch(frontendUrl, { signal: AbortSignal.timeout(1500) });
  const html = response.ok ? await response.text() : '';
  if (html.includes('<app-root')) {
    console.log(`Reusing Angular frontend at ${frontendUrl}`);
    const keepAlive = setInterval(() => {}, 60_000);
    await new Promise((resolve) => {
      process.once('SIGINT', resolve);
      process.once('SIGTERM', resolve);
    });
    clearInterval(keepAlive);
    process.exit(0);
  }
} catch {
  // Start Angular when no healthy local dev server is available.
}

const angularCli = join(frontendDirectory, 'node_modules', '@angular', 'cli', 'bin', 'ng.js');
const frontendProcess = spawn(process.execPath, [angularCli, 'serve'], {
  cwd: frontendDirectory,
  stdio: 'inherit',
});

for (const signal of ['SIGINT', 'SIGTERM']) {
  process.on(signal, () => frontendProcess.kill(signal));
}

frontendProcess.on('error', (error) => {
  console.error('Failed to start the Angular frontend:', error);
  process.exitCode = 1;
});

frontendProcess.on('exit', (code, signal) => {
  if (signal) {
    process.kill(process.pid, signal);
  } else {
    process.exitCode = code ?? 1;
  }
});