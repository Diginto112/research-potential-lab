// Optional visual/integration checks. Set PLAYWRIGHT_MODULE to a local Playwright package.
const assert = require('node:assert/strict');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const base = process.env.TEST_URL || 'http://localhost:8001';
const screenshots = process.env.QA_DIR;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  const context = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true });
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', e => errors.push(e.message));
  await page.goto(base);
  await page.waitForFunction(() => document.querySelector('#landingUnlockCount').textContent.includes('本机'));
  if (screenshots) await page.screenshot({ path: path.join(screenshots, 'phone-home.png'), fullPage: true });
  async function fits() {
    const size = await page.evaluate(() => ({ body: document.documentElement.scrollWidth, viewport: innerWidth }));
    assert.ok(size.body <= size.viewport, JSON.stringify(size));
  }
  const paths = [
    { types: Array(6).fill('slacker'), name: '究极摆烂·导师压力绝缘体', score: '46' },
    { types: Array(6).fill('grind'), name: '实验室永动机·究极卷王', score: '72' },
    { types: Array(6).fill('spark'), name: '学术物种·不可被同行理解', score: '77' },
    { types: Array(6).fill('rigorous'), name: '冉冉升起的科研巨星', score: '88' },
    { types: ['rigorous','rigorous','spark','spark','slacker','grind'], name: '中规中矩的科研牛马' }
  ];
  for (let run = 0; run < paths.length; run += 1) {
    if (run === 0) await page.click('#startButton'); else await page.click('#restartButton');
    assert.equal(await page.locator('#rerollButton').isDisabled(), false);
    const before = await page.locator('#quizTitle').innerText();
    await page.click('#rerollButton');
    assert.notEqual(await page.locator('#quizTitle').innerText(), before);
    assert.equal(await page.locator('#rerollButton').isDisabled(), true);
    await page.click('#acceptScenarioButton');
    assert.equal(await page.locator('#scenarioActions').isVisible(), false);
    const typeByText = await page.evaluate(async () => {
      const { allQuestions } = await import('/questions.js');
      return Object.fromEntries(allQuestions.flatMap(q => Object.entries(q.pools).flatMap(([type, pool]) => pool.map(o => [o.text, type]))));
    });
    for (const type of paths[run].types) {
      assert.equal(await page.locator('#nextButton').isDisabled(), true);
      const texts = await page.locator('.answer-copy').allTextContents();
      const index = texts.findIndex(text => typeByText[text] === type);
      assert.ok(index >= 0);
      await page.locator('.answer-option').nth(index).click();
      await fits();
      await page.click('#nextButton');
    }
    assert.equal(await page.locator('#resultTitle').innerText(), paths[run].name);
    if (paths[run].score) assert.equal(await page.locator('#overallScore').innerText(), paths[run].score);
    assert.ok((await page.locator('#resultUnlockNumber').innerText()).startsWith('本机'));
    assert.equal(await page.locator('#scenarioActions').isVisible(), false);
    await fits();
    if (screenshots && run === 0) await page.screenshot({ path: path.join(screenshots, 'phone-result.png'), fullPage: true });
  }
  await page.click('#resultStatsButton');
  assert.equal(await page.locator('#statCompletions').innerText(), '5');
  assert.equal(await page.locator('#statStarts').innerText(), '5');
  assert.equal(await page.locator('#statPersonas').innerText(), '5');
  assert.equal(await page.locator('#statRate').innerText(), '100%');
  await fits();
  if (screenshots) await page.screenshot({ path: path.join(screenshots, 'phone-stats.png') });
  await page.click('#closeStatsButton');
  await page.reload();
  await page.click('#startButton');
  assert.equal(await page.locator('#rerollButton').isDisabled(), false);
  await page.click('#acceptScenarioButton');
  for (const width of [360, 375, 768, 1365]) {
    await page.setViewportSize({ width, height: 900 });
    await fits();
  }
  if (screenshots) await page.screenshot({ path: path.join(screenshots, 'desktop-question.png'), fullPage: true });
  const blocked = await browser.newContext();
  await blocked.addInitScript(() => Object.defineProperty(window, 'localStorage', { get() { throw new Error('Storage denied'); } }));
  const blockedPage = await blocked.newPage();
  await blockedPage.goto(base); await blockedPage.click('#startButton'); await blockedPage.click('#acceptScenarioButton');
  assert.equal(await blockedPage.locator('.answer-option').count(), 4);
  assert.equal(await blockedPage.locator('#storageNotice').isVisible(), true);
  assert.deepEqual(errors, []);
  await browser.close();
  console.log('Browser checks passed: 5 scoring paths, reroll/reset, local persistence, stats, 360–1365px layouts, blocked storage, zero page errors.');
})().catch(error => { console.error(error); process.exit(1); });
