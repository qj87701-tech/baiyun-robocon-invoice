# Guangdong Baiyun ROBOCON Brand Hero Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace the public HITCRT/RoboMaster hero branding with the approved Guangdong Baiyun University ROBOCON identity and the user-provided team photograph without changing invoice workflows or XLS output.

**Architecture:** Keep the existing static vinext export and patch its versioned HTML, minified page bundle, and stylesheet in place. Add a dedicated browser regression test that checks visible brand copy, removed legacy copy, the new background asset, responsive layout, and mode switching; then create an `r6` asset set so GitHub Pages clients cannot reuse the old hero from cache.

**Tech Stack:** Static HTML/CSS/JavaScript, Playwright with system Chrome, Node.js, PowerShell, GitHub Pages, GitHub CLI.

## Global Constraints

- Public brand text must use `广东白云学院机器人队`, `ROBOCON票据助手`, and `拒绝平庸，挑战极限` exactly.
- User-visible text must not contain `HITCRT`, `哈工大竞技机器人队`, or `RoboMaster`.
- The old CRT image logo must not render; the top-left badge must render the text monogram `RC`.
- The new hero must use the supplied photograph as `gbyu-robocon-team.jpg` with a centered `cover` crop and desktop vertical focus near `52%`.
- Preserve the current black, gold, and cyan application palette outside the photograph.
- Do not change buyer validation defaults, OCR, invoice-number recognition, finance columns, unit-price calculation, XLS templates, or export mapping.
- Keep old static assets in the repository; publish new `r6` assets and update `index.html` to reference them.

---

## File Structure

- `tests/brand-hero.test.cjs`: executable Playwright regression test for brand copy, background image, responsive visibility, and mode switching.
- `gbyu-robocon-team.jpg`: the user-supplied team photograph served by GitHub Pages.
- `index.html`: static server-rendered copy, metadata, preload, and references to the new `r6` assets.
- `assets/page-CGZOwfEX.js`, `assets/page-CGZOwfEX-r3.js`, `assets/page-CGZOwfEX-r4.js`, `assets/page-CGZOwfEX-r5.js`: retained page bundles updated so old cached entry points also render the new public brand.
- `assets/page-CGZOwfEX-r6.js`: current page bundle paired with the new `r6` index bundle.
- `assets/index-DZslQ2pm-r6.js`: current index bundle pointing to the `r6` page bundle.
- `assets/index-p1uxJro9.css`, `assets/index-p1uxJro9-r3.css`, `assets/index-p1uxJro9-r5.css`: retained stylesheets updated with the new photo, crop, overlay, and brand monogram.
- `assets/index-p1uxJro9-r6.css`: current stylesheet referenced by `index.html`.
- `work/patch-gbyu-brand.ps1`: workspace-only mechanical patch script with occurrence-count assertions; not committed to the Pages repository.
- `outputs/verification/brand-desktop.png`, `outputs/verification/brand-mobile.png`: verification screenshots; not committed to the Pages repository.

---

### Task 1: Add the Brand Hero Regression Test and Implement the Approved Hero

**Files:**
- Create: `tests/brand-hero.test.cjs`
- Create: `gbyu-robocon-team.jpg`
- Create: `assets/index-DZslQ2pm-r6.js`
- Create: `assets/page-CGZOwfEX-r6.js`
- Create: `assets/index-p1uxJro9-r6.css`
- Create workspace helper: `../../work/patch-gbyu-brand.ps1`
- Modify: `index.html`
- Modify: `assets/page-CGZOwfEX.js`
- Modify: `assets/page-CGZOwfEX-r3.js`
- Modify: `assets/page-CGZOwfEX-r4.js`
- Modify: `assets/page-CGZOwfEX-r5.js`
- Modify: `assets/index-p1uxJro9.css`
- Modify: `assets/index-p1uxJro9-r3.css`
- Modify: `assets/index-p1uxJro9-r5.css`

**Interfaces:**
- Consumes: static site URL from `process.argv[2]`, defaulting to `http://127.0.0.1:43111/baiyun-robocon-invoice`.
- Produces: exit code `0` only when both desktop and mobile brand checks pass; screenshots at `outputs/verification/brand-desktop.png` and `outputs/verification/brand-mobile.png`.

- [ ] **Step 1: Create the browser test before changing production assets**

Create `tests/brand-hero.test.cjs` with this behavior:

```js
const fs = require('fs');
const path = require('path');
const { chromium } = require('../../../work/node_modules/playwright');

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
```

- [ ] **Step 2: Start the static test server**

From the workspace root, run:

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'work\pages-test-server.js' 'outputs\baiyun-robocon-pages' 43111
```

Expected: the command remains running and serves `/baiyun-robocon-invoice/`.

- [ ] **Step 3: Run the new test and verify the RED state**

Run:

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'outputs\baiyun-robocon-pages\tests\brand-hero.test.cjs'
```

Expected: `FAIL desktop: wrong title` because the current site still uses `HITCRT票据助手`.

- [ ] **Step 4: Copy the approved photograph into the site**

Copy exactly this source file:

```powershell
Copy-Item -LiteralPath `
  'D:\jiang\CloudMusic\xwechat_files\wxid_cwqkywe9gynx22_5600\temp\RWTemp\2026-08\2ef6ce7f19ef30fd2f2c93b58d6cecef\ff87950e51501ccfece5b07661668ba6.jpg' `
  -Destination 'outputs\baiyun-robocon-pages\gbyu-robocon-team.jpg' -Force
```

Expected: the destination exists and retains the source byte size.

- [ ] **Step 5: Create and run the mechanical brand patch**

Create `work/patch-gbyu-brand.ps1` using occurrence-count assertions before each replacement. The patch must apply these exact mappings to `index.html` and every retained page bundle:

```text
HITCRT票据助手首页                          -> 广东白云学院机器人队票据助手首页
HITCRT票据助手                              -> 广东白云学院机器人队票据助手
HITCRT / 票据助手                           -> 广东白云学院机器人队 / ROBOCON票据助手
哈工大竞技机器人队                          -> 广东白云学院机器人队
RoboMaster / RoboCon 赛季财务工作流          -> ROBOCON · 赛季财务工作流
戮力以分荣辱，创新以求生存。                  -> 拒绝平庸，挑战极限
```

Use this assertion helper for every textual replacement:

```powershell
function Replace-Exact {
    param(
        [string]$Text,
        [string]$Old,
        [string]$New,
        [int]$Expected,
        [string]$Label
    )
    $actual = [regex]::Matches($Text, [regex]::Escape($Old)).Count
    if ($actual -ne $Expected) {
        throw "$Label expected $Expected occurrence(s), found $actual"
    }
    return $Text.Replace($Old, $New)
}
```

Apply replacements in this order and assert these counts:

```text
index.html:
  HITCRT票据助手首页 = 1
  remaining HITCRT票据助手 = 2
  old HTML brand image/text block = 1
  HITCRT / 票据助手 = 1
  哈工大竞技机器人队 = 1
  RoboMaster / RoboCon 赛季财务工作流 = 1
  戮力以分荣辱，创新以求生存。 = 1
  crt-logo.png preload = 1
  index-DZslQ2pm-r5.js = 3
  page-CGZOwfEX-r5.js = 1
  index-p1uxJro9-r5.css = 6

each retained page-CGZOwfEX*.js bundle:
  HITCRT票据助手首页 = 1
  old React brand image/text block = 1
  HITCRT / 票据助手 = 1
  哈工大竞技机器人队 = 1
  RoboMaster / RoboCon 赛季财务工作流 = 1
  戮力以分荣辱，创新以求生存。 = 1

each retained index-p1uxJro9*.css stylesheet:
  old hero background declaration containing robomaster-champions.png = 1
  mobile background-position:50% 65% = 1
  finance-column-layout-v5 marker remains = 1
```

Replace the old brand image markup with an `RC` monogram:

```html
<span class="brand-mark" aria-hidden="true"><span class="rc-monogram">RC</span></span>
<span>广东白云学院机器人队</span><small>ROBOCON票据助手</small>
```

Use the equivalent React bundle structure:

```js
(0,R.jsx)(`span`,{className:`brand-mark`,"aria-hidden":`true`,children:(0,R.jsx)(`span`,{className:`rc-monogram`,children:`RC`})}),
(0,R.jsx)(`span`,{children:`广东白云学院机器人队`}),
(0,R.jsx)(`small`,{children:`ROBOCON票据助手`})
```

Replace the existing hero background in all retained stylesheets with:

```css
.hero{
  background:
    linear-gradient(90deg,#030507d9,#0a0d117a 49%,#030507d1),
    linear-gradient(0deg,#050709cc,#0507091f 58%),
    url(/baiyun-robocon-invoice/gbyu-robocon-team.jpg) 50% 52%/cover no-repeat,
    #030507;
}
.rc-monogram{color:#f2c94c;font:900 14px/1 Arial,sans-serif;letter-spacing:.06em}
.brand>span:nth-of-type(2){font-size:14px;white-space:nowrap}
```

Replace the mobile hero background position with `50% 52%` and add:

```css
@media (width<=720px){
  .brand{gap:8px}
  .brand-mark{width:42px}
  .brand>span:nth-of-type(2){font-size:12px}
  .brand small{display:none}
}
```

Create the cache-busted `r6` asset set:

```powershell
# index-DZslQ2pm-r6.js is copied from the patched base index and replaces
# both page-CGZOwfEX.js references with page-CGZOwfEX-r6.js.
# page-CGZOwfEX-r6.js is copied from the patched base page and replaces
# both index-DZslQ2pm.js references with index-DZslQ2pm-r6.js.
# index-p1uxJro9-r6.css is copied from the patched base stylesheet.
# index.html replaces all r5 JS/CSS references with r6 equivalents.
```

Also change the HTML image preload from `crt-logo.png` to `gbyu-robocon-team.jpg`. Do not replace any `哈尔滨工业大学` buyer-validation string.

- [ ] **Step 6: Verify JavaScript syntax and run the GREEN brand test**

Run:

```powershell
$node='C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe'
& $node --check 'outputs\baiyun-robocon-pages\assets\page-CGZOwfEX.js'
& $node --check 'outputs\baiyun-robocon-pages\assets\page-CGZOwfEX-r3.js'
& $node --check 'outputs\baiyun-robocon-pages\assets\page-CGZOwfEX-r4.js'
& $node --check 'outputs\baiyun-robocon-pages\assets\page-CGZOwfEX-r5.js'
& $node --check 'outputs\baiyun-robocon-pages\assets\page-CGZOwfEX-r6.js'
& $node --check 'outputs\baiyun-robocon-pages\assets\index-DZslQ2pm-r6.js'
& $node 'outputs\baiyun-robocon-pages\tests\brand-hero.test.cjs'
```

Expected: every `--check` exits `0`, then `PASS Guangdong Baiyun ROBOCON branding on desktop and mobile`.

- [ ] **Step 7: Commit the implemented brand hero**

```powershell
git add -- `
  tests/brand-hero.test.cjs `
  gbyu-robocon-team.jpg `
  index.html `
  assets/index-p1uxJro9.css assets/index-p1uxJro9-r3.css assets/index-p1uxJro9-r5.css assets/index-p1uxJro9-r6.css `
  assets/page-CGZOwfEX.js assets/page-CGZOwfEX-r3.js assets/page-CGZOwfEX-r4.js assets/page-CGZOwfEX-r5.js assets/page-CGZOwfEX-r6.js `
  assets/index-DZslQ2pm-r6.js
git commit -m "Rebrand hero for Guangdong Baiyun ROBOCON"
```

Expected: one commit containing only the brand test, new photo, text/style changes, and `r6` static assets.

---

### Task 2: Perform Visual and Business Regression Verification

**Files:**
- Inspect: `../../outputs/verification/brand-desktop.png`
- Inspect: `../../outputs/verification/brand-mobile.png`
- Generate: `../../outputs/verification/1.xls`

**Interfaces:**
- Consumes: the local static site produced by Task 1.
- Produces: fresh desktop/mobile visual evidence and a validated XLS export; no production file changes.

- [ ] **Step 1: Inspect both brand screenshots**

Open `outputs/verification/brand-desktop.png` and `outputs/verification/brand-mobile.png`. Confirm:

```text
Desktop: team members and robots remain visible; centered slogan is legible; no old CRT logo/text appears.
Mobile: main team name remains visible; ROBOCON appears in the hero; the top bar does not overflow; the hero crop retains people.
```

- [ ] **Step 2: Run the finance-table regression**

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'work\test-finance-columns.js'
```

Expected: `PASS` with eight headers and unit/quantity widths `72|78`.

- [ ] **Step 3: Export a real XLS and validate its layout**

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'work\test-last4-export-browser.js'
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File 'work\check-xls-layout.ps1' `
  -WorkbookPath 'outputs\verification\1.xls'
```

Expected: browser export exits `0`; Excel check reports `PASS` with headers `材料名称|单位|数量|单价|金额|发票后四位|供应商|报销人`.

- [ ] **Step 4: Verify the repository is clean after the implementation commit**

```powershell
git status -sb
git log -2 --oneline
```

Expected: `main` has no uncommitted production changes and the brand implementation commit follows the design-document commit.

---

### Task 3: Publish to GitHub Pages and Verify the Live Site

**Files:**
- No additional file changes expected.

**Interfaces:**
- Consumes: committed `main` branch from Task 2.
- Produces: built GitHub Pages deployment for `qj87701-tech/baiyun-robocon-invoice` and fresh live-site regression evidence.

- [ ] **Step 1: Confirm GitHub CLI authentication and intended push scope**

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' --version
& 'C:\Program Files\GitHub CLI\gh.exe' auth status
git status -sb
git log -2 --oneline
```

Expected: authenticated as `qj87701-tech`; only local commits ahead of `origin/main`; clean worktree.

- [ ] **Step 2: Push `main` and trigger a Pages build if the queue does not select the new commit**

```powershell
git push origin main
& 'C:\Program Files\GitHub CLI\gh.exe' api `
  'repos/qj87701-tech/baiyun-robocon-invoice/pages/builds/latest' `
  --jq '{status: .status, commit: .commit, error: .error.message}'
```

If the build commit is not the new implementation commit, run:

```powershell
& 'C:\Program Files\GitHub CLI\gh.exe' api --method POST `
  'repos/qj87701-tech/baiyun-robocon-invoice/pages/builds'
```

Poll at intervals under 60 seconds until the exact new commit reports `status: built` and `error: null`.

- [ ] **Step 3: Run the brand test against GitHub Pages**

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'outputs\baiyun-robocon-pages\tests\brand-hero.test.cjs' `
  'https://qj87701-tech.github.io/baiyun-robocon-invoice'
```

Expected: `PASS Guangdong Baiyun ROBOCON branding on desktop and mobile`.

- [ ] **Step 4: Run the live XLS export regression**

```powershell
& 'C:\Users\jiang\.cache\codex-runtimes\codex-primary-runtime\dependencies\node\bin\node.exe' `
  'work\test-last4-export-browser.js' `
  'https://qj87701-tech.github.io/baiyun-robocon-invoice'
powershell.exe -NoProfile -ExecutionPolicy Bypass `
  -File 'work\check-xls-layout.ps1' `
  -WorkbookPath 'outputs\verification\1.xls'
```

Expected: live export downloads successfully and the XLS layout check reports `PASS`.

- [ ] **Step 5: Record the final state**

```powershell
git status -sb
git log -1 --oneline
```

Expected: `main...origin/main`, clean worktree, and the brand implementation commit at `HEAD`.

The handoff should include the cache-busted live URL using the final commit SHA.
