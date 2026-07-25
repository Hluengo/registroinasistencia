import fs from 'node:fs';
import path from 'node:path';
import dotenv from 'dotenv';
import express from 'express';
import cors from 'cors';
import timeout from 'connect-timeout';
import rateLimit from 'express-rate-limit';
import { GoogleGenAI } from '@google/genai';

const envLocalPath = path.resolve(process.cwd(), '.env.local');
const envPath = fs.existsSync(envLocalPath)
  ? envLocalPath
  : path.resolve(process.cwd(), '.env');
dotenv.config({ path: envPath });

const app = express();
const port = Number(process.env.PORT ?? 8787);
const isProd = process.env.NODE_ENV === 'production';

const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(',').map((o) => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173'];

if (!process.env.ALLOWED_ORIGINS || process.env.ALLOWED_ORIGINS.trim() === '') {
  console.warn('[CORS] ALLOWED_ORIGINS not set — using default localhost origins. Set ALLOWED_ORIGINS env var for production.');
}

// Middleware
app.use(express.json({ limit: '1mb' }));
app.use(cors({
  origin: (origin, callback) => {
    // Allow requests with no origin (curl, server-to-server, same-origin)
    if (!origin || allowedOrigins.includes('*')) {
      callback(null, true);
    } else if (allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ['GET', 'POST'],
  allowedHeaders: ['Content-Type'],
  credentials: true,
}));
app.use(timeout('30s')); // 30 seconds timeout

// Rate limiting for Gemini endpoint
const geminiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 10, // 10 requests per minute per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: 'Too many requests, please try again later.' },
});

// Halt on timeouts
app.use(haltOnTimedout);

function haltOnTimedout(req, res, next) {
  if (!req.timedout) next();
}

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.post('/api/gemini', geminiLimiter, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GEMINI_API_KEY is missing on the server.',
    });
  }

  const prompt = typeof req.body?.prompt === 'string' ? req.body.prompt.trim() : '';
  const ALLOWED_MODELS = ['gemini-2.5-flash', 'gemini-2.0-flash'];
  const model = typeof req.body?.model === 'string' && req.body.model.trim()
    ? req.body.model.trim()
    : 'gemini-2.5-flash';

  if (!ALLOWED_MODELS.includes(model)) {
    return res.status(400).json({ error: `Model '${model}' is not allowed. Use: ${ALLOWED_MODELS.join(', ')}` });
  }

  if (!prompt) {
    return res.status(400).json({ error: 'prompt is required' });
  }

  try {
    const ai = new GoogleGenAI({ apiKey });
    const response = await ai.models.generateContent({
      model,
      contents: prompt,
    });

    const text = response.text?.trim() ?? '';
    if (!text) {
      return res.status(502).json({ error: 'Gemini returned an empty response.' });
    }

    return res.json({ text });
  } catch (error) {
    console.error('Gemini API error:', error);
    return res.status(502).json({
      error: isProd ? 'Failed to generate content.' : (error as Error).message,
    });
  }
});

app.listen(port, () => {
  console.log(`API server listening on http://localhost:${port}`);
});
