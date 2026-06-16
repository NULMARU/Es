import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { execFile } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';
import { GoogleGenAI } from '@google/genai';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');
const publicDir = path.join(rootDir, 'public');
const distDir = path.join(rootDir, 'dist');
const materialsDataPath = path.join(publicDir, 'data', 'materials.json');
loadLocalEnv(rootDir);
const port = Number(process.env.PORT || 8787);
const host = process.env.HOST || '127.0.0.1';
const apiKey = process.env.GEMINI_API_KEY || process.env.GOOGLE_API_KEY || '';
const liveTranslateModel = 'gemini-3.5-live-translate-preview';
const execFileAsync = promisify(execFile);
const pdfNameRe = /^스텝\s*(\d+)_([12])\.pdf$/i;
let materialsBuildPromise = null;

const app = express();
app.use(express.json({ limit: '180mb' }));

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
            realtimeInputConfig: {
              automaticActivityDetection: {
                disabled: false,
                prefixPaddingMs: 200,
                silenceDurationMs: 800
              }
            },
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

app.get('/api/materials', async (_req, res) => {
  try {
    const manifest = await readMaterialsManifest();
    res.json(manifest);
  } catch (error) {
    res.status(500).json({
      error: error instanceof Error ? error.message : 'Failed to read learning materials.'
    });
  }
});

app.post('/api/materials/upload', async (req, res) => {
  try {
    const files = Array.isArray(req.body?.files) ? req.body.files : [];
    if (files.length === 0) {
      res.status(400).json({ error: 'PDF 파일을 선택해 주세요.' });
      return;
    }

    const uploadedSteps = new Set();
    for (const file of files) {
      const stepNumber = saveUploadedPdf(file);
      uploadedSteps.add(stepNumber);
    }

    await rebuildMaterials();
    const manifest = await readMaterialsManifest({ rebuildIfStale: false });
    res.json({
      uploadedSteps: [...uploadedSteps].sort((a, b) => a - b),
      manifest
    });
  } catch (error) {
    res.status(400).json({
      error: error instanceof Error ? error.message : 'PDF 추가 실패'
    });
  }
});

app.use('/materials', express.static(path.join(publicDir, 'materials')));
app.use('/data', express.static(path.join(publicDir, 'data')));

if (fs.existsSync(distDir)) {
  app.use(express.static(distDir));
  app.get(/.*/, (_req, res) => {
    res.sendFile(path.join(distDir, 'index.html'));
  });
}

app.listen(port, host, () => {
  console.log(`API server listening on http://${host}:${port}`);
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

async function readMaterialsManifest({ rebuildIfStale = true } = {}) {
  if (rebuildIfStale && materialsAreStale()) {
    await rebuildMaterials();
  }
  if (!fs.existsSync(materialsDataPath)) {
    throw new Error('materials.json not found. PDF 쌍을 먼저 추가해 주세요.');
  }
  return JSON.parse(fs.readFileSync(materialsDataPath, 'utf8'));
}

function materialsAreStale() {
  const pdfs = findMaterialPdfs();
  if (pdfs.length === 0) return !fs.existsSync(materialsDataPath);
  if (!fs.existsSync(materialsDataPath)) return true;
  const manifestTime = fs.statSync(materialsDataPath).mtimeMs;
  return pdfs.some((pdf) => fs.statSync(pdf.path).mtimeMs > manifestTime);
}

function findMaterialPdfs() {
  return fs.readdirSync(rootDir)
    .map((name) => {
      const normalized = name.normalize('NFC');
      const match = normalized.match(pdfNameRe);
      if (!match) return null;
      return {
        name,
        step: Number(match[1]),
        part: Number(match[2]),
        path: path.join(rootDir, name)
      };
    })
    .filter(Boolean);
}

async function rebuildMaterials() {
  if (!materialsBuildPromise) {
    materialsBuildPromise = runMaterialsBuild().finally(() => {
      materialsBuildPromise = null;
    });
  }
  return materialsBuildPromise;
}

async function runMaterialsBuild() {
  await execFileAsync(process.execPath, ['tools/build_materials.mjs'], {
    cwd: rootDir,
    timeout: 240000,
    maxBuffer: 1024 * 1024 * 12
  }).catch((error) => {
    throw formatBuildError(error);
  });
}

function formatBuildError(error) {
  const message = [error?.message, error?.stderr, error?.stdout].filter(Boolean).join('\n').trim();
  return new Error(message || '자료 생성 중 오류가 발생했습니다.');
}

function saveUploadedPdf(file) {
  const safeName = path.basename(String(file?.name || '')).normalize('NFC');
  const match = safeName.match(pdfNameRe);
  if (!match) {
    throw new Error('파일 이름은 스텝3_1.pdf, 스텝3_2.pdf 형식이어야 합니다.');
  }
  const rawData = String(file?.data || '').replace(/^data:application\/pdf;base64,/, '');
  const buffer = Buffer.from(rawData, 'base64');
  if (buffer.length < 5 || buffer.subarray(0, 5).toString('latin1') !== '%PDF-') {
    throw new Error(`${safeName} 파일이 올바른 PDF가 아닙니다.`);
  }
  fs.writeFileSync(resolveMaterialPdfPath(safeName), buffer);
  return Number(match[1]);
}

function resolveMaterialPdfPath(safeName) {
  const existing = fs.readdirSync(rootDir).find((name) => name.normalize('NFC') === safeName);
  return path.join(rootDir, existing || safeName);
}
