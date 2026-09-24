import cors from 'cors';
import express from 'express';
import { telemetrySimulator } from './telemetry';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(cors());
app.use(express.json());

app.get('/api/dashboard', (_req, res) => {
  res.json(telemetrySimulator.getDashboard());
});

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.listen(PORT, () => {
  console.log(`Telemetry backend running on http://localhost:${PORT}`);
});
