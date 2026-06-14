import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const distDir = path.join(rootDir, 'dist');
loadLocalEnv(rootDir);
const port = Number(process.env.PORT || 8787);
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const liveTranslateModel = 'gemini-3.5-live-translate-preview';

const app = express();
app.use(express.json({ limit: '1mb' }));

app.get('/api/gemini/status', (_req, res) => {
  res.json({
    configured: Boolean(apiKey),
    model: liveTranslateModel,
    tokenEndpoint: '/api/gemini/live-token'
  });
});

app.get('/api/gemini/live-token', async (req, res) => {
  if (!apiKey) {
    res.status(501).json({
      error: 'GEMINI_API_KEY is not configured on the local server.',
      model: liveTranslateModel
    });
    return;
  }

  const targetLanguage = String(req.query.targetLanguage || 'ko').trim();
  if (!/^[a-z]{2,3}(-[A-Za-z]{2,8})?$/.test(targetLanguage)) {
    res.status(400).json({ error: 'Invalid BCP-47 target language code.' });
    return;
  }

  try {
    const client = new GoogleGenAI({ apiKey });
    const expireTime = new Date(Date.now() + 30 * 60 * 1000).toISOString();
    const newSessionExpireTime = new Date(Date.now() + 60 * 1000);

    const token = await client.authTokens.create({
      config: {
        uses: 1,
        expireTime,
        newSessionExpireTime,
        liveConnectConstraints: {
          model: liveTranslateModel,
          config: {
            responseModalities: ['AUDIO'],
            inputAudioTranscription: {},
            outputAudioTranscription: {},
            translationConfig: {
              targetLanguageCode: targetLanguage,
              echoTargetLanguage: true
            }
          }
        },
        httpOptions: {
          apiVersion: 'v1alpha'
        }
      }
    });

    res.json({
      token: token.name,
      model: liveTranslateModel,
      targetLanguage
    });
  } catch (error) {
    res.status(502).json({
      error: error instanceof Error ? error.message : 'Failed to create Gemini ephemeral token.',
      model: liveTranslateModel
    });
  }
});

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, '127.0.0.1', () => {
  console.log(`API server listening on http://127.0.0.1:${port}`);
});

function loadLocalEnv(baseDir) {
  for (const fileName of ['.env.local', '.env']) {
    const envPath = path.join(baseDir, fileName);
    if (!fs.existsSync(envPath)) continue;
    const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
    for (const line of lines) {
      const trimmed = line.trim();
      if (!trimmed || trimmed.startsWith('#')) continue;
      const match = trimmed.match(/^([A-Za-z_][A-Za-z0-9_]*)=(.*)$/);
      if (!match) continue;
      const [, key, rawValue] = match;
      if (process.env[key]) continue;
      process.env[key] = rawValue.replace(/^["']|["']$/g, '');
    }
  }
}
