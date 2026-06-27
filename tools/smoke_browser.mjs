import fs from 'node:fs/promises';
import path from 'node:path';
import { chromium } from 'playwright-core';

const root = process.cwd();
const chromeCandidates = [
  process.env.CHROME_PATH,
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
  '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
  '/Applications/Chromium.app/Contents/MacOS/Chromium',
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

const sourceSentenceCount = await page.locator('.source-sentence-list button').count();
if (sourceSentenceCount !== 50) {
  throw new Error(`Expected 50 source sentences, found ${sourceSentenceCount}.`);
}

const liveDockPlacement = await page.evaluate(() => {
  const rail = document.querySelector('.left-rail');
  const live = document.querySelector('.live-dock');
  const stepStack = document.querySelector('.step-stack');
  if (!rail || !live || !stepStack) return false;
  const children = Array.from(rail.children);
  return rail.contains(live) && children.indexOf(live) > children.indexOf(stepStack);
});
if (!liveDockPlacement) {
  throw new Error('Live Translate dock is not placed under the step selector.');
}

await page.screenshot({ path: path.join(artifactDir, 'desktop-workflow.png'), fullPage: true });

await page.getByRole('button', { name: '패턴 익히기' }).click();
await page.locator('.sentence-nav-top span', { hasText: '1/50' }).waitFor({ timeout: 5000 });
await page.locator('.sentence-nav p', { hasText: 'I stock up when Olive Young has a sale.' }).waitFor({ timeout: 5000 });

await page.getByRole('button', { name: '문장 만들기' }).click();
await page.locator('.prompt-box strong', { hasText: '올리브영이 세일하면 나는 몰아서 사.' }).waitFor({ timeout: 5000 });
await page.getByRole('button', { name: '정답 보기' }).click();
await page.getByRole('button', { name: '확인' }).click();
await page.getByText('100%').waitFor({ timeout: 5000 });

await page.getByRole('button', { name: '소리내어 말하기' }).click();
await page.locator('.sentence-nav-top span', { hasText: '1/50' }).waitFor({ timeout: 5000 });
await page.locator('.transcript-box span').waitFor({ timeout: 5000 });

await page.getByRole('button', { name: '질문에 대답하기' }).click();
await page.locator('.answer-question-card .sentence-nav-top span', { hasText: '1/10' }).waitFor({ timeout: 5000 });
const answerSentenceCards = await page.locator('.learning-pane .sentence-nav').count();
if (answerSentenceCards !== 0) {
  throw new Error(`Answer pane should not show 50-sentence cards, found ${answerSentenceCards}.`);
}
await page.locator('.question-box', { hasText: 'What do you usually do when you get home?' }).waitFor({ timeout: 5000 });
await page.getByPlaceholder('Answer in English').fill('I usually wash my hands when I get home.');
await page.getByRole('button', { name: '답변하기' }).click();
await page.getByText('맥락과 문법이 자연스럽다.').waitFor({ timeout: 5000 });
await page.getByPlaceholder('Answer in English').fill('I went to school yesterday.');
await page.getByRole('button', { name: '답변하기' }).click();
await page.getByText('추천 정답').waitFor({ timeout: 5000 });
await page.getByText('I usually wash my hands when I get home.').waitFor({ timeout: 5000 });

await page.setViewportSize({ width: 390, height: 900 });
await page.screenshot({ path: path.join(artifactDir, 'mobile-workflow.png'), fullPage: true });

if (consoleErrors.length > 0) {
  throw new Error(`Browser console errors: ${consoleErrors.join(' | ')}`);
}

await browser.close();
console.log('Smoke browser verification passed.');
console.log(`Screenshots: ${path.relative(root, path.join(artifactDir, 'desktop-workflow.png'))}, ${path.relative(root, path.join(artifactDir, 'mobile-workflow.png'))}`);
