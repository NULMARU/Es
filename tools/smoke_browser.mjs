import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const chromeCandidates = [
  process.env.CHROME_PATH,
  'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
  'C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe'
].filter(Boolean);

async function findExecutable() {
  for (const candidate of chromeCandidates) {
    try {
      await fs.access(candidate);
      return candidate;
    } catch {
      // Try next browser.
    }
  }
  throw new Error('Chrome or Edge executable was not found.');
}

const executablePath = await findExecutable();
const artifactDir = path.join(root, 'artifacts');
const appUrl = process.env.APP_URL || 'http://127.0.0.1:8787';
await fs.mkdir(artifactDir, { recursive: true });

const browser = await chromium.launch({ executablePath, headless: true });
const page = await browser.newPage({ viewport: { width: 1440, height: 1000 } });
const consoleErrors = [];
page.on('console', (message) => {
  if (message.type() === 'error') consoleErrors.push(message.text());
});
page.on('pageerror', (error) => consoleErrors.push(error.message));

await page.goto(appUrl, { waitUntil: 'networkidle' });
await page.getByText('Pattern Lab').waitFor({ timeout: 15000 });
await page.getByText('Gemini Live 3.5').waitFor({ timeout: 15000 });

const visibleImages = await page.locator('.spread-pages img').evaluateAll((images) =>
  images.map((image) => ({
    src: image.getAttribute('src'),
    width: image.naturalWidth,
    height: image.naturalHeight,
    complete: image.complete
  }))
);
if (visibleImages.length < 2 || visibleImages.some((image) => !image.complete || image.width < 300)) {
  throw new Error(`Source spread images did not render correctly: ${JSON.stringify(visibleImages)}`);
}

await page.screenshot({ path: path.join(artifactDir, 'desktop-workflow.png'), fullPage: true });

await page.getByRole('button', { name: '문장 만들기' }).click();
await page.getByRole('button', { name: '정답 보기' }).click();
await page.getByRole('button', { name: '확인' }).click();
await page.getByText('100%').waitFor({ timeout: 5000 });

await page.getByRole('button', { name: '소리내어 말하기' }).click();
await page.locator('.transcript-box span').waitFor({ timeout: 5000 });

await page.setViewportSize({ width: 390, height: 900 });
await page.screenshot({ path: path.join(artifactDir, 'mobile-workflow.png'), fullPage: true });

if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
}

await browser.close();
console.log('Smoke browser verification passed.');
console.log(`Screenshots: ${path.relative(root, path.join(artifactDir, 'desktop-workflow.png'))}, ${path.relative(root, path.join(artifactDir, 'mobile-workflow.png'))}`);
