import fs from 'node:fs';
import path from 'node:path';
import process from 'node:process';

const root = process.cwd();
const dataPath = path.join(root, 'public', 'data', 'materials.json');
const errors = [];
const warnings = [];

loadLocalEnv(root);

function existsPublic(publicPath) {
  return fs.existsSync(path.join(root, 'public', publicPath.replace(/^\//, '')));
}

if (!fs.existsSync(dataPath)) {
  errors.push('Missing public/data/materials.json. Run npm run materials.');
} else {
  const manifest = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
  if (!Array.isArray(manifest.steps) || manifest.steps.length === 0) {
    errors.push('No steps were extracted from the PDF pairs.');
  }

  for (const step of manifest.steps || []) {
    if (!step.sourceFiles?.oddPages || !step.sourceFiles?.evenPages) {
      errors.push(`${step.id} is missing source file metadata.`);
    }
    if (!Array.isArray(step.spreads) || step.spreads.length === 0) {
      errors.push(`${step.id} has no merged page spreads.`);
    }
    for (const spread of step.spreads || []) {
      if (!existsPublic(spread.oddImage)) {
        errors.push(`${step.id} missing image ${spread.oddImage}`);
      }
      if (!existsPublic(spread.evenImage)) {
        errors.push(`${step.id} missing image ${spread.evenImage}`);
      }
    }
    if (!Array.isArray(step.sentences) || step.sentences.length < 8) {
      warnings.push(`${step.id} has only ${step.sentences?.length || 0} sentence candidates.`);
    }
    const ids = new Set();
    for (const sentence of step.sentences || []) {
      if (!sentence.id || ids.has(sentence.id)) {
        errors.push(`${step.id} has duplicate or empty sentence ids.`);
      }
      ids.add(sentence.id);
      if (!sentence.text || sentence.text.length < 6) {
        errors.push(`${step.id} has an empty sentence candidate.`);
      }
    }
  }
}

if (!process.env.GEMINI_API_KEY && !process.env.GOOGLE_API_KEY) {
  warnings.push('Gemini Live Translate token server is present, but GEMINI_API_KEY is not set.');
}

for (const warning of warnings) {
  console.warn(`WARN ${warning}`);
}

if (errors.length > 0) {
  for (const error of errors) {
    console.error(`ERROR ${error}`);
  }
  process.exit(1);
}

console.log('Validation passed.');

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
