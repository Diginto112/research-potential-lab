const assert = require('node:assert/strict');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
const { readFileSync } = require('node:fs');
const path = require('node:path');
const base = process.env.TEST_URL || 'http://localhost:8015';
const screenshots = process.env.QA_DIR;

(async () => {
  const browser = await chromium.launch({ executablePath: process.env.CHROME_PATH || 'C:/Program Files/Google/Chrome/Application/chrome.exe', headless: true });
  try {
    for (const viewport of [{ width: 320, height: 568, mobile: true }, { width: 390, height: 844, mobile: true }, { width: 1365, height: 900, mobile: false }]) {
      const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.mobile, hasTouch: viewport.mobile });
      await context.route('**/config.js*', route => route.fulfill({ contentType: 'text/javascript', body: "export const analyticsBaseUrl = '';" }));
      await context.addInitScript(supportsFileShare => {
        Object.defineProperty(Navigator.prototype, 'canShare', { configurable: true, value: data => supportsFileShare && Boolean(data.files?.length) });
        Object.defineProperty(Navigator.prototype, 'share', { configurable: true, value: async data => { window.__sharedFiles = data.files.map(file => ({ name: file.name, type: file.type, size: file.size })); window.__sharedText = data.text; } });
      }, viewport.mobile);
      await context.grantPermissions(['clipboard-read', 'clipboard-write']);
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      await page.goto(base);
      await page.evaluate(() => history.replaceState({}, '', `/${'x'.repeat(50)}`));
      await page.click('#startButton');
      await page.click('#acceptScenarioButton');
      const strategies = await page.evaluate(async () => {
        const { allQuestions } = await import('/questions.js');
        return Object.fromEntries(allQuestions.flatMap(question => Object.entries(question.pools).flatMap(([key, pool]) => pool.map(option => [option.text, key]))));
      });
      for (let index = 0; index < 6; index += 1) {
        const options = await page.locator('.answer-copy').allTextContents();
        const choice = options.findIndex(text => strategies[text] === 'spark');
        assert.notEqual(choice, -1, 'each question must include a spark response');
        await page.locator('.answer-option').nth(choice).click();
        await page.click('#nextButton');
      }
      await page.click('#shareButton');
      await page.waitForFunction(() => document.querySelector('#sharePreviewImage').naturalWidth === 1080);
      assert.equal(await page.locator('#sharePreviewModal').isVisible(), true);
      assert.ok(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      assert.equal(await page.locator('#shareImageButton').isVisible(), viewport.mobile);
      await page.addScriptTag({ content: readFileSync(path.resolve('tools/vendor/jsQR.js'), 'utf8') });
      const decodedUrl = await page.evaluate(() => {
        const image = document.querySelector('#sharePreviewImage');
        const canvas = document.createElement('canvas');
        canvas.width = image.naturalWidth;
        canvas.height = image.naturalHeight;
        const context = canvas.getContext('2d');
        context.drawImage(image, 0, 0);
        const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
        return jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' })?.data;
      });
      assert.match(decodedUrl, /\/x{50}\?from=share$/);
      assert.match(await page.locator('#shareDialogStatus').innerText(), viewport.mobile ? /可以分享图片/ : /不支持直接分享图片/);
      const allPersonasDecode = await page.evaluate(async () => {
        const { personas } = await import('/engine.js?v=0.3.3');
        const { buildShareCard } = await import('/share-card.js?v=0.3.4');
        const canvas = document.createElement('canvas');
        canvas.width = 1080; canvas.height = 1440;
        const context = canvas.getContext('2d');
        const results = [];
        for (const persona of Object.values(personas)) {
          const blob = await buildShareCard({ ...persona, score: 78, metrics: { innovation: 75, frontier: 80, feasibility: 70, resilience: 85 } }, location.href);
          const image = new Image(); image.src = URL.createObjectURL(blob); await image.decode();
          context.clearRect(0, 0, canvas.width, canvas.height); context.drawImage(image, 0, 0);
          const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
          results.push(jsQR(pixels.data, pixels.width, pixels.height, { inversionAttempts: 'dontInvert' })?.data === location.href);
          URL.revokeObjectURL(image.src);
        }
        return results;
      });
      assert.equal(allPersonasDecode.length, 8);
      assert.ok(allPersonasDecode.every(Boolean), 'every unlocked and hidden personality card must keep its QR code scannable');
      if (screenshots) await page.screenshot({ path: `${screenshots}/share-${viewport.mobile ? 'mobile' : 'desktop'}.png` });

      if (viewport.mobile) {
        await page.click('#shareImageButton');
        assert.deepEqual(await page.evaluate(() => window.__sharedFiles), [{ name: '科研人格-hiddenSpark.png', type: 'image/png', size: await page.locator('#sharePreviewImage').evaluate(async image => (await (await fetch(image.src)).blob()).size) }]);
        const shareText = await page.evaluate(() => window.__sharedText);
        assert.match(shareText, /我测出了「学术物种·不可被同行理解」/);
        assert.match(shareText, /http:\/\/localhost:\d+\/x{50}\?from=share/);
      }
      const shareCount = viewport.mobile ? '1' : '0';
      const [download] = await Promise.all([page.waitForEvent('download'), page.click('#saveShareImageButton')]);
      assert.equal(download.suggestedFilename(), '科研人格-hiddenSpark.png');
      if (viewport.mobile) assert.equal(await page.locator('#toast').innerText(), '结果图片已保存；可在微信聊天中发送这张图片。');
      await page.click('#closeSharePreviewButton');
      await page.click('#shareButton');
      await page.waitForFunction(() => document.querySelector('#sharePreviewImage').naturalWidth === 1080);
      await page.click('#copyShareLinkButton');
      assert.match(await page.evaluate(() => navigator.clipboard.readText()), /\/x{50}\?from=share/);
      await page.keyboard.press('Escape');
      assert.equal(await page.locator('#sharePreviewModal').isHidden(), true);
      await page.click('#resultStatsButton');
      assert.equal(await page.locator('#statShares').innerText(), String(Number(shareCount) + 1));
      await page.click('#closeStatsButton');

      assert.deepEqual(errors, []);
      await context.close();
      console.log(`${viewport.mobile ? 'Mobile' : 'Desktop'} result sharing passed: 8 scannable personality cards, native image share/fallback, save and copy actions, share stats, no page errors.`);
    }
  } finally { await browser.close(); }
})().catch(error => { console.error(error); process.exit(1); });
