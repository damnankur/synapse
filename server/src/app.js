import cors from 'cors';
import express from 'express';
import authRoutes from './routes/auth.routes.js';
import userRoutes from './routes/user.routes.js';
import projectRoutes from './routes/project.routes.js';

const app = express();

function normalizeOrigin(origin = '') {
  return String(origin).trim().replace(/\/+$/, '');
}

function parseAllowedOrigins(value) {
  return String(value || '')
    .split(',')
    .map((entry) => normalizeOrigin(entry))
    .filter(Boolean);
}

const allowedOrigins = parseAllowedOrigins(
  process.env.CLIENT_ORIGINS || process.env.CLIENT_ORIGIN || 'http://localhost:5173'
);
const allowedOriginSet = new Set(allowedOrigins);

app.use(
  cors({
    origin(origin, callback) {
      // Allow non-browser requests (no Origin header), like server-to-server and health probes.
      if (!origin) {
        callback(null, true);
        return;
      }

      const normalizedIncomingOrigin = normalizeOrigin(origin);
      if (allowedOriginSet.has(normalizedIncomingOrigin)) {
        callback(null, true);
        return;
      }

      callback(new Error(`CORS blocked for origin: ${origin}`));
    },
    credentials: true,
  })
);
app.use(express.json({ limit: '1mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true, service: 'synapse-api' });
});

app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes);

app.use((err, _req, res, _next) => {
  const status = err?.statusCode || 500;
  const message = err?.message || 'Internal server error.';
  res.status(status).json({ message });
});

export default app;
