import { mkdirSync, writeFileSync } from 'node:fs';

const configuredUrl = process.env.TELEMETRY_API_URL?.trim().replace(/\/+$/, '');
const productionApiUrl = 'https://telemetry-monitor-api.onrender.com';
const localApiUrl = 'http://localhost:3000';
const apiBaseUrl = configuredUrl || (process.env.VERCEL ? productionApiUrl : localApiUrl);
const parsedUrl = new URL(apiBaseUrl);

if (process.env.VERCEL && parsedUrl.protocol !== 'https:') {
  throw new Error('The production telemetry API URL must use HTTPS on Vercel.');
}

const outputDirectory = new URL('../src/environments/', import.meta.url);
mkdirSync(outputDirectory, { recursive: true });
writeFileSync(
  new URL('../src/environments/environment.production.ts', import.meta.url),
  `export const environment = { apiBaseUrl: ${JSON.stringify(apiBaseUrl)} };\n`
);