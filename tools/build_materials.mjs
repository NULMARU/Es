import { execFile } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);
const __filename = fileURLToPath(import.meta.url);
const toolsDir = path.dirname(__filename);
const rootDir = path.resolve(toolsDir, '..');
const venvDir = path.join(rootDir, '.venv');
const pythonBin = process.platform === 'win32'
  ? path.join(venvDir, 'Scripts', 'python.exe')
  : path.join(venvDir, 'bin', 'python');

async function main() {
  await ensurePythonRuntime();
  await ensureTesseract();
  const result = await execFileAsync(pythonBin, ['tools/build_materials.py'], {
    cwd: rootDir,
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 12
  }).catch((error) => {
    throw formatError(error);
  });
  if (result.stdout) process.stdout.write(result.stdout);
  if (result.stderr) process.stderr.write(result.stderr);
}

async function ensurePythonRuntime() {
  if (!fs.existsSync(pythonBin)) {
    await execFileAsync('python3', ['-m', 'venv', venvDir], {
      cwd: rootDir,
      timeout: 120000,
      maxBuffer: 1024 * 1024 * 8
    }).catch((error) => {
      throw new Error(`Python 가상환경을 만들 수 없습니다.\n${formatError(error).message}`);
    });
  }

  const ready = await pythonPackagesReady();
  if (ready) return;

  await execFileAsync(pythonBin, ['-m', 'pip', 'install', '-r', 'tools/requirements.txt'], {
    cwd: rootDir,
    timeout: 180000,
    maxBuffer: 1024 * 1024 * 12
  }).catch((error) => {
    throw new Error(`자료 생성용 Python 패키지 설치 실패\n${formatError(error).message}`);
  });
}

async function pythonPackagesReady() {
  try {
    await execFileAsync(pythonBin, ['-c', 'import PIL, pypdf, pytesseract'], {
      cwd: rootDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
    return true;
  } catch {
    return false;
  }
}

async function ensureTesseract() {
  const command = process.platform === 'win32' ? 'where' : 'which';
  try {
    await execFileAsync(command, ['tesseract'], {
      cwd: rootDir,
      timeout: 30000,
      maxBuffer: 1024 * 1024
    });
  } catch {
    throw new Error('Tesseract OCR이 필요합니다. macOS에서는 `brew install tesseract`를 먼저 실행해 주세요.');
  }
  const { stdout } = await execFileAsync('tesseract', ['--list-langs'], {
    cwd: rootDir,
    timeout: 30000,
    maxBuffer: 1024 * 1024
  });
  const langs = new Set(stdout.split(/\r?\n/).map((line) => line.trim()));
  if (!langs.has('kor')) {
    throw new Error('한국어 프롬프트 OCR을 위해 Tesseract 한국어 언어팩이 필요합니다. macOS에서는 `brew install tesseract-lang`를 실행해 주세요.');
  }
}

function formatError(error) {
  const message = [error?.message, error?.stderr, error?.stdout].filter(Boolean).join('\n').trim();
  return new Error(message || '자료 생성 중 오류가 발생했습니다.');
}

main().catch((error) => {
  console.error(error.message);
  process.exit(1);
});
