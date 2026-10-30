// Optional browser/server integration check using the bundled Node SQLite API.
const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { readFileSync } = require('node:fs');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:8001';
(async () => {
  const { default: worker } = await import(pathToFileURL(path.resolve('backend/worker.js')));
  const db = new DatabaseSync(':memory:');
  db.exec(readFileSync('backend/migrations/0001_init.sql', 'utf8'));
  const wrap = (sql, values = []) => ({ bind: (...next) => wrap(sql, next), first: async () => db.prepare(sql).get(...values) || null, all: async () => ({ results: db.prepare(sql).all(...values) }), run: async () => db.prepare(sql).run(...values) });
  const env = { SITE_ORIGIN: base, ADMIN_TOKEN: 'integration-test-admin-token', DB: { prepare: wrap } };
  let offline = true, loseCompletionResponse = true;
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const page = await browser.newPage();
  await page.route('**/config.js', route => route.fulfill({ contentType: 'text/javascript', body: "export const analyticsBaseUrl = 'https://stats.test';" }));
  await page.route('https://stats.test/**', async route => {
    const req = route.request();
    if (offline) return route.abort('failed');
    const body = req.postData();
    const headers = new Headers(req.headers()); headers.set('Origin', base);
    const response = await worker.fetch(new Request(req.url(), { method: req.method(), headers, ...(body ? { body } : {}) }), env);
    if (body && JSON.parse(body).type === 'complete' && loseCompletionResponse) {
      loseCompletionResponse = false;
      return route.abort('failed');
    }
    await route.fulfill({ status: response.status, headers: Object.fromEntries(response.headers), body: await response.text() });
  });
  await page.goto(base); await page.click('#startButton'); await page.click('#acceptScenarioButton');
  const map = await page.evaluate(async () => { const { allQuestions } = await import('/questions.js'); return Object.fromEntries(allQuestions.flatMap(q => Object.entries(q.pools).flatMap(([key,pool]) => pool.map(o => [o.text,key])))); });
  for (let i = 0; i < 6; i++) {
    const options = await page.locator('.answer-copy').allTextContents();
    await page.locator('.answer-option').nth(options.findIndex(x => map[x] === 'spark')).click();
    await page.click('#nextButton');
  }
  assert.ok((await page.locator('#resultUnlockNumber').innerText()).startsWith('本机'));
  await page.waitForTimeout(100);
  offline = false;
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => JSON.parse(localStorage.getItem('research-lab-v2')).outbox.length === 1);
  assert.equal(db.prepare("SELECT COUNT(*) n FROM events WHERE type='complete'").get().n, 1);
  await page.waitForTimeout(100);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await page.waitForFunction(() => document.querySelector('#resultUnlockNumber').textContent.startsWith('全站'));
  assert.equal(await page.locator('#resultUnlockNumber').innerText(), '全站第 1 次解锁该人格');
  assert.equal(db.prepare("SELECT COUNT(*) n FROM events WHERE type='complete'").get().n, 1);
  await page.click('#resultStatsButton');
  assert.equal(await page.locator('#statCompletions').innerText(), '1');
  const queued = await page.evaluate(() => JSON.parse(localStorage.getItem('research-lab-v2')).outbox.length);
  assert.equal(queued, 0);
  await browser.close();
  console.log('Statistics integration passed: offline play, persistent queue, reconnect, response loss, retry deduplication, real server persona ordinal.');
})().catch(error => { console.error(error); process.exit(1); });
