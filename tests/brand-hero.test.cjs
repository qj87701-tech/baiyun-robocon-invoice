const fs = require('fs');
const path = require('path');
const mergedRepoPlaywright = path.resolve(__dirname, '../../../work/node_modules/playwright');
const worktreePlaywright = path.resolve(__dirname, '../../../../../work/node_modules/playwright');
const { chromium } = require(fs.existsSync(mergedRepoPlaywright) ? mergedRepoPlaywright : worktreePlaywright);

const baseUrl = (process.argv[2] || 'http://127.0.0.1:43111/baiyun-robocon-invoice').replace(/\/$/, '');
const screenshotDir = path.resolve(__dirname, '..', '..', 'verification');
const expected = {
  title: '广东白云学院机器人队票据助手',
  brand: '广东白云学院机器人队',
  subbrand: 'ROBOCON票据助手',
  eyebrow: ['广东白云学院机器人队', 'ROBOCON · 赛季财务工作流'],
  slogan: '拒绝平庸，挑战极限',
  footer: '广东白云学院机器人队 / ROBOCON票据助手',
};

let browser;
(async () => {
  fs.mkdirSync(screenshotDir, { recursive: true });
  browser = await chromium.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: true,
  });

  for (const profile of [
    { name: 'desktop', width: 1600, height: 1000 },
    { name: 'mobile', width: 390, height: 844 },
  ]) {
    const page = await browser.newPage({ viewport: profile });
    const photoResponses = [];
    page.on('response', (response) => {
      if (response.url().includes('gbyu-robocon-team.jpg')) photoResponses.push(response.status());
    });
    await page.goto(`${baseUrl}/?brand-check=${profile.name}-${Date.now()}`, {
      waitUntil: 'domcontentloaded',
      timeout: 60_000,
    });
    await page.locator('#personal-title').waitFor({ state: 'visible', timeout: 60_000 });
    await page.waitForTimeout(1_000);

    const bodyText = await page.locator('body').innerText();
    if ((await page.title()) !== expected.title) throw new Error(`${profile.name}: wrong title`);
    if ((await page.locator('.brand > span').nth(1).textContent()) !== expected.brand) throw new Error(`${profile.name}: wrong brand`);
    if (profile.name === 'desktop' && (await page.locator('.brand small').textContent()) !== expected.subbrand) throw new Error('desktop: wrong subbrand');
    if ((await page.locator('.rc-monogram').textContent()) !== 'RC') throw new Error(`${profile.name}: RC monogram missing`);
    if ((await page.locator('.crt-logo').count()) !== 0) throw new Error(`${profile.name}: old CRT logo remains`);
    const eyebrow = await page.locator('.hero .eyebrow span').allTextContents();
    if (JSON.stringify(eyebrow) !== JSON.stringify(expected.eyebrow)) throw new Error(`${profile.name}: wrong eyebrow ${JSON.stringify(eyebrow)}`);
    if ((await page.locator('.hero h1').textContent()) !== expected.slogan) throw new Error(`${profile.name}: wrong slogan`);
    if ((await page.locator('footer span').first().textContent()) !== expected.footer) throw new Error(`${profile.name}: wrong footer`);
    for (const forbidden of ['HITCRT', '哈工大竞技机器人队', 'RoboMaster']) {
      if (bodyText.includes(forbidden)) throw new Error(`${profile.name}: legacy copy remains: ${forbidden}`);
    }

    const heroStyle = await page.locator('.hero').evaluate((element) => {
      const style = getComputedStyle(element);
      return { backgroundImage: style.backgroundImage, backgroundPosition: style.backgroundPosition };
    });
    if (!heroStyle.backgroundImage.includes('gbyu-robocon-team.jpg')) throw new Error(`${profile.name}: wrong hero image`);
    if (!heroStyle.backgroundPosition.includes('52%')) throw new Error(`${profile.name}: wrong crop ${heroStyle.backgroundPosition}`);
    if (!photoResponses.includes(200)) throw new Error(`${profile.name}: hero photo did not return HTTP 200`);

    const tabCount = await page.locator('[role="tab"]').count();
    if (tabCount < 2) throw new Error(`${profile.name}: work modes failed to hydrate`);
    await page.locator('[role="tab"]').filter({ hasText: '财务汇总' }).last().click({ force: true });
    await page.locator('#finance-title').waitFor({ state: 'visible', timeout: 20_000 });
    await page.screenshot({
      path: path.join(screenshotDir, `brand-${profile.name}.png`),
      fullPage: true,
    });
    await page.close();
  }
  console.log('PASS Guangdong Baiyun ROBOCON branding on desktop and mobile');
})().catch((error) => {
  console.error(`FAIL ${error.message}`);
  process.exitCode = 1;
}).finally(async () => {
  if (browser) await browser.close();
});
