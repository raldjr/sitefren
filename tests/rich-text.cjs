/* Isolated rich-text browser checks. Requires PLAYWRIGHT_MODULE and Chromium. */
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const net = require('node:net');
const { spawn } = require('node:child_process');
const { chromium } = require(process.env.PLAYWRIGHT_MODULE || 'playwright');
let passed = 0;
function check(ok, label) { if (!ok) throw Error(label); passed++; console.log('PASS:', label); }
const delay = ms => new Promise(resolve => setTimeout(resolve, ms));
(async () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sitefren-text-'));
  fs.copyFileSync(path.join(__dirname, '../sitefren.php'), path.join(root, 'sitefren.php'));
  const port = await new Promise(resolve => {
    const socket = net.createServer(); socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port; socket.close(() => resolve(port));
    });
  });
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('POCKET_')));
  env.POCKET_UPDATE_CHECKS = '0'; env.POCKET_INSTALL_TRACKING = '0';
  const server = spawn('php', ['-S', `127.0.0.1:${port}`, '-t', root], { env, stdio: 'ignore' });
  let browser;
  try {
    const url = `http://127.0.0.1:${port}/sitefren.php`;
    for (let i = 0; i < 100; i++) { try { await fetch(url); break; } catch { await delay(50); } }
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const page = await browser.newPage({ viewport: { width: 1366, height: 900 } });
    const errors = []; page.on('pageerror', error => { errors.push(error.message); console.error('PAGE ERROR:', error.stack); });
    await page.goto(url);
    const setup = fs.readFileSync(path.join(root, 'builder-state.php'), 'utf8').match(/Setup code: ([A-Za-z0-9_-]+)/)[1];
    await page.locator('#setupCode').fill(setup); await page.locator('#password').fill('rich-text-testing-password');
    await page.locator('#authButton').click(); await page.locator('#cancelSettings').click();
    const source = '<!doctype html><html><head><style>.special{color:rgb(12,34,56)}h1{font-size:42px}p{font-size:18px}</style></head><body><h1 id="title" class="special">A useful heading</h1><p id="lead" class="special">First <em>styled</em> words and <a href="about.html">our story</a>.</p><p id="plain">Format these words</p><p id="spans">Keep <span class="special" style="letter-spacing:2px">colored words</span> here.</p><a id="nav" href="about.html">About us</a><button id="action">Contact us</button><script>document.body.dataset.executed="yes";</script></body></html>';
    await page.evaluate(async content => {
      const state = await (await fetch('?action=state')).json();
      const response = await fetch('?action=save_file', { method: 'POST', headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': state.csrf }, body: JSON.stringify({ revision: state.revision, path: 'index.html', content }) });
      if (!response.ok) throw Error(await response.text());
    }, source);
    await page.reload(); await page.locator('#editPageBtn').click();
    const frame = page.frameLocator('#preview');
    await frame.locator('#title').click();
    check(await frame.locator('body').getAttribute('data-executed') === null, 'Website scripts remain paused while editing');
    await page.locator('#textHeading').selectOption('H2');
    await frame.locator('h2#title').waitFor();
    check(await frame.locator('#title').getAttribute('class') === 'special', 'Changing heading keeps its class and ID');
    check(await frame.locator('#title').evaluate(el => getComputedStyle(el).color) === 'rgb(12, 34, 56)', 'Heading keeps site styling');
    const select = async (selector, text) => {
      await frame.locator(selector).click();
      await frame.locator(selector).evaluate((el, text) => {
        const walker = document.createTreeWalker(el, NodeFilter.SHOW_TEXT); let node;
        while ((node = walker.nextNode())) {
          const index = node.textContent.indexOf(text);
          if (index < 0) continue;
          const range = document.createRange(); range.setStart(node, index); range.setEnd(node, index + text.length);
          getSelection().removeAllRanges(); getSelection().addRange(range); return;
        }
        throw Error('Text selection not found: ' + text);
      }, text);
      await page.waitForTimeout(60);
    };
    await select('#plain', 'these');
    await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await frame.locator('#plain b').waitFor();
    check(await frame.locator('#plain b').innerText() === 'these', 'Bold formats only the selected words');
    await page.getByRole('button', { name: 'Italic', exact: true }).click();
    await frame.locator('#plain i').waitFor();
    await page.getByRole('button', { name: 'Underline', exact: true }).click();
    await frame.locator('#plain u').waitFor();
    check(true, 'Italic and underline preserve the text selection across toolbar clicks');
    await page.locator('#textLinkBtn').click(); await page.locator('#textLinkURL').fill('javascript:alert(1)');
    await page.locator('#textLinkForm button[type=submit]').click();
    check(await page.locator('#textLinkDialog').isVisible() && await page.locator('#textLinkError').innerText(), 'Unsafe link protocols are rejected');
    await page.locator('#textLinkURL').fill('about.html'); await page.locator('#textLinkForm button[type=submit]').click();
    await frame.locator('#plain a[href="about.html"]').waitFor();
    check(await frame.locator('#plain a').innerText() === 'these', 'Link dialog restores the selected text');
    await select('#lead a', 'our story');
    await page.locator('#textLinkBtn').click();
    check(await page.locator('#textLinkURL').inputValue() === 'about.html', 'Existing link destination remains editable');
    await page.locator('#textLinkURL').fill('mailto:hello@example.com'); await page.locator('#textLinkForm button[type=submit]').click();
    await frame.locator('#lead a[href="mailto:hello@example.com"]').waitFor();
    await select('#spans .special', 'colored'); await page.getByRole('button', { name: 'Bold', exact: true }).click();
    await frame.locator('#spans b').waitFor();
    await select('#nav', 'About us'); await page.keyboard.insertText('Our company');
    await select('#action', 'Contact us'); await page.keyboard.insertText('Get in touch');
    if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
    await page.locator('#saveVisualBtn').click(); await page.locator('#visualBar').waitFor({ state: 'hidden' });
    const saved = await page.evaluate(async () => (await (await fetch('?action=state')).json()).files['index.html']);
    check(saved.includes('<a id="nav" href="about.html">Our company</a>') && saved.includes('<button id="action">Get in touch</button>'), 'Navigation and button text can be edited without changing their structure');
    check(saved.includes('<h2 id="title" class="special">'), 'Heading level is saved as real semantic HTML');
    check(saved.includes('href="mailto:hello@example.com"') && saved.includes('href="about.html"'), 'Links survive saving without preview URL rewriting');
    check(saved.includes('letter-spacing:2px') && saved.includes('class="special"'), 'Styled spans survive formatting');
    check(!/data-pocket-|contenteditable|Squire/.test(saved), 'Editor helpers and library code never enter website source');
    check(saved.includes('document.body.dataset.executed'), 'Original website script is preserved in the source');
    await page.locator('#editPageBtn').click(); await select('#plain', 'these');
    await page.locator('[data-text-command="clear"]').click();
    await frame.locator('#plain b').waitFor({ state: 'hidden' });
    check(await frame.locator('#plain b,#plain i,#plain u').count() === 0, 'Clear formatting removes emphasis');
    await page.locator('[data-text-command="unlink"]').click();
    await frame.locator('#plain a').waitFor({ state: 'hidden' });
    check(await frame.locator('#plain a').count() === 0, 'Unlink keeps text and removes its link');
    await frame.locator('#title').click();
    await frame.locator('#title').evaluate(el => {
      const transfer = new DataTransfer(); transfer.setData('text/plain', '<img src=x onerror=alert(1)> pasted');
      transfer.setData('text/html', '<img src=x onerror=alert(1)><script>alert(1)</script>');
      el.dispatchEvent(new ClipboardEvent('paste', { clipboardData: transfer, bubbles: true, cancelable: true }));
    });
    check(await frame.locator('#title img').count() === 0, 'Pasted markup is inserted as text');
    await page.locator('#cancelVisualBtn').click(); await page.locator('#acceptConfirm').click();
    const afterCancel = await page.evaluate(async () => (await (await fetch('?action=state')).json()).files['index.html']);
    check(afterCancel === saved, 'Cancel preserves the previous draft exactly');
    await page.setViewportSize({ width: 390, height: 844 }); await page.locator('#editPageBtn').click();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Formatting toolbar fits a mobile viewport');
    if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH + '.mobile.png', fullPage: true });
    check(errors.length === 0, 'No uncaught JavaScript errors: ' + errors.join('; '));
    console.log(`${passed} rich-text checks passed.`);
  } finally { if (browser) await browser.close(); server.kill('SIGTERM'); await delay(100); fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
