/* Isolated mobile/PWA checks. Requires Playwright and Chromium; no external services. */
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
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'sitefren-pwa-'));
  fs.mkdirSync(path.join(root, 'tools'));
  const editor = path.join(root, 'tools/editor.php');
  const original = fs.readFileSync(path.join(__dirname, '../sitefren.php'), 'utf8');
  fs.writeFileSync(editor, original);
  fs.writeFileSync(path.join(root, 'index.html'), '<h1>Independent published site</h1>');
  const port = await new Promise(resolve => {
    const socket = net.createServer(); socket.listen(0, '127.0.0.1', () => {
      const port = socket.address().port; socket.close(() => resolve(port));
    });
  });
  const env = Object.fromEntries(Object.entries(process.env).filter(([key]) => !key.startsWith('POCKET_')));
  env.POCKET_UPDATE_CHECKS = '0'; env.POCKET_INSTALL_TRACKING = '0';
  const server = spawn('php', ['-d', 'opcache.enable=0', '-S', `127.0.0.1:${port}`, '-t', root], { env, stdio: 'ignore' });
  let browser;
  try {
    const origin = `http://127.0.0.1:${port}`;
    const url = origin + '/tools/editor.php';
    for (let i = 0; i < 100; i++) { try { await fetch(url + '?pwa=manifest'); break; } catch { await delay(50); } }
    const manifestResponse = await fetch(url + '?pwa=manifest');
    const manifest = await manifestResponse.json();
    check(manifestResponse.headers.get('content-type').includes('application/manifest+json'), 'Manifest is served with the correct content type');
    check(!manifestResponse.headers.has('set-cookie') && !fs.existsSync(path.join(root, 'tools/builder-state.php')), 'Public PWA assets do not create private state or sessions');
    check(manifest.display === 'standalone' && new URL(manifest.start_url, url).href === url && new URL(manifest.scope, url).href === url, 'Renamed editor in a subfolder has its own app identity and scope');
    for (const size of [180, 192, 512]) {
      const response = await fetch(url + '?pwa=icon-' + size);
      const bytes = Buffer.from(await response.arrayBuffer());
      check(response.headers.get('content-type') === 'image/png' && bytes.readUInt32BE(16) === size && bytes.readUInt32BE(20) === size, `Embedded ${size}px home-screen icon is a valid PNG`);
    }
    check((await fetch(url + '?pwa=worker', { method: 'POST' })).status === 405, 'PWA resources reject mutation requests');
    check((await fetch(url + '?pwa=unknown')).status === 404, 'Unknown PWA resources return 404');
    browser = await chromium.launch({ headless: true, args: ['--no-sandbox', '--disable-dev-shm-usage'] });
    const context = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
    const page = await context.newPage();
    const errors = []; page.on('pageerror', error => errors.push(error.message));
    await page.goto(url);
    await page.evaluate(() => navigator.serviceWorker.ready);
    const worker = await page.evaluate(async () => (await navigator.serviceWorker.getRegistration()).scope);
    check(worker === url, 'Service worker is scoped to the editor path, not the published website');
    const cdp = await context.newCDPSession(page);
    const appManifest = await cdp.send('Page.getAppManifest');
    check(appManifest.errors.length === 0 && JSON.parse(appManifest.data).name === 'Sitefren', 'Chromium loads and parses the installable app manifest');
    const installability = await cdp.send('Page.getInstallabilityErrors');
    check(installability.installabilityErrors.length === 0, 'Chromium reports no app installability errors');
    const setup = fs.readFileSync(path.join(root, 'tools/builder-state.php'), 'utf8').match(/Setup code: ([A-Za-z0-9_-]+)/)[1];
    await page.locator('#setupCode').fill(setup); await page.locator('#password').fill('mobile-pwa-testing-password');
    await page.locator('#authButton').click(); await page.locator('#cancelSettings').click();
    check(await page.locator('.sidebar').isVisible() && await page.locator('.workbench').isHidden(), 'An empty project starts in Chat');
    await page.locator('#chatWorkspaceBtn').click();
    await page.locator('#prompt').fill('Keep my unsent idea');
    check(await page.locator('.sidebar').isVisible() && await page.locator('.workbench').isHidden(), 'Chat gets its own mobile view');
    await page.locator('#editorWorkspaceBtn').click(); await page.locator('#chatWorkspaceBtn').click();
    check(await page.locator('#prompt').inputValue() === 'Keep my unsent idea', 'Switching mobile views preserves the unsent prompt');
    await page.locator('#editorWorkspaceBtn').click();
    await page.locator('#demoBtn').click(); await page.frameLocator('#preview').locator('h1').waitFor();
    check(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth), 'Mobile workspace has no horizontal overflow');
    await page.locator('#editPageBtn').click();
    check(await page.locator('.workspace-switch').isHidden(), 'Editing gives the preview more space and prevents switching away mid-edit');
    check(await page.locator('.toolbar').isHidden() && await page.locator('#topActions').isHidden(), 'Mobile editing hides inactive chrome to leave more room for the page');
    check((await page.locator('#saveVisualBtn').boundingBox()).height >= 44, 'Mobile Save has a touch-sized target');
    await page.frameLocator('#preview').locator('h1').click();
    await page.locator('#textToolbar').waitFor({ state: 'visible' });
    check((await page.locator('[data-text-command="bold"]').boundingBox()).height >= 44, 'Floating formatting controls have touch-sized targets');
    if (process.env.SCREENSHOT_PATH) await page.screenshot({ path: process.env.SCREENSHOT_PATH, fullPage: true });
    await page.keyboard.press('Escape'); await page.locator('#cancelVisualBtn').click();
    await page.locator('#settingsBtn').click();
    check(await page.locator('#installAppBtn').isVisible(), 'Settings offers app installation');
    await page.locator('#cancelSettings').click();
    check((await page.evaluate(() => caches.keys())).length === 0, 'The app does not cache private editor or project responses');
    const independent = await context.newPage(); await independent.goto(origin + '/index.html');
    check(await independent.evaluate(() => navigator.serviceWorker.controller === null), 'Published website remains outside editor worker control');
    await independent.close();
    await context.setOffline(true);
    await page.locator('#offlineNotice').waitFor({ state: 'visible' });
    check(await page.evaluate(async () => { try { await fetch('?action=state'); return false; } catch { return true; } }), 'Offline API requests fail instead of returning cached private state');
    const offlineResponse = await page.reload();
    check(offlineResponse.status() === 503 && await page.locator('h1').innerText() === "You're offline.", 'Offline app launch shows a clear reconnect screen');
    check(!(await page.content()).includes('forma.') && !(await page.content()).includes('csrf'), 'Offline screen contains no draft or session data');
    await context.setOffline(false); await page.getByRole('link', { name: 'Try again' }).click();
    await page.locator('#app').waitFor({ state: 'visible' });
    check(await page.frameLocator('#preview').locator('h1').count() > 0, 'Reconnecting restores authenticated access to the server draft');
    fs.writeFileSync(editor, original.replace('<title>Sitefren · Your site, in your hands</title>', '<title>Fresh editor release</title>'));
    await page.reload();
    check(await page.title() === 'Fresh editor release', 'Installed app loads replaced PHP immediately without a stale shell cache');
    check(errors.length === 0, 'No uncaught mobile/PWA JavaScript errors: ' + errors.join('; '));
    console.log(`${passed} mobile/PWA checks passed.`);
  } finally { if (browser) await browser.close(); server.kill('SIGTERM'); await delay(100); fs.rmSync(root, { recursive: true, force: true }); }
})().catch(error => { console.error(error); process.exitCode = 1; });
