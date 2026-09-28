import { mkdirSync, writeFileSync } from 'node:fs';

const configuredUrl = process.env.TELEMETRY_API_URL?.trim().replace(/\/+$/, '');

if (process.env.VERCEL && !configuredUrl) {
  throw new Error('Set TELEMETRY_API_URL in the Vercel project environment variables.');
}

const apiBaseUrl = configuredUrl || 'http://localhost:3000';
const parsedUrl = new URL(apiBaseUrl);

if (process.env.VERCEL && parsedUrl.protocol !== 'https:') {
  throw new Error('TELEMETRY_API_URL must use HTTPS on Vercel.');
}

const outputDirectory = new URL('../src/environments/', import.meta.url);
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  new URL('../src/environments/environment.production.ts', import.meta.url),
  `export const environment = { apiBaseUrl: ${JSON.stringify(apiBaseUrl)} };\n`
);