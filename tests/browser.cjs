/* Development-only browser test. Requires Playwright and an installed Chromium.
 * npm install --no-save playwright && npx playwright install chromium
 * node tests/browser.cjs
 * Optional: PHP_BIN, PHP_ARGS_JSON, PLAYWRIGHT_MODULE, BROWSER_EXECUTABLE,
 * SCREENSHOT_PATH, POCKET_TEST_TRANSPORT=1 (requires cURL). This runner never
 * edits a deployed website or makes a live inference request.
 */
const fs=require('node:fs');const os=require('node:os');const path=require('node:path');
const crypto=require('node:crypto');const net=require('node:net');const {spawn}=require('node:child_process');
const {chromium}=require(process.env.PLAYWRIGHT_MODULE||'playwright');
let passed=0;
function check(value,label){if(!value)throw Error(label);passed++;process.stdout.write('PASS: '+label+'\n')}
const delay=ms=>new Promise(r=>setTimeout(r,ms));
(async()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'pocket-browser-'));
 fs.copyFileSync(path.join(__dirname,'../sitefren.php'),path.join(root,'sitefren.php'));
 const port=await new Promise(resolve=>{const server=net.createServer();server.listen(0,'127.0.0.1',()=>{const port=server.address().port;server.close(()=>resolve(port))})});
 const env={...process.env};for(const key of Object.keys(env))if(key.startsWith('POCKET_'))delete env[key];
 if(process.env.POCKET_TEST_TRANSPORT!=='1')env.POCKET_UPDATE_CHECKS='0';
 if(process.env.POCKET_TEST_TRANSPORT==='1'){
  const keys=crypto.generateKeyPairSync('ed25519');
  const publicKey=keys.publicKey.export({type:'spki',format:'der'}).subarray(-32).toString('base64');
  const editorPath=path.join(root,'sitefren.php');
  const source=fs.readFileSync(editorPath,'utf8').replace(/const PS_UPDATE_PUBLIC_KEY = '[^']+';/,`const PS_UPDATE_PUBLIC_KEY = '${publicKey}';`);
  fs.writeFileSync(editorPath,source);
  const assets={};
  for(const version of ['0.2.4','0.2.5']){
   const code=source.replace("const PS_VERSION = '0.2.4';",`const PS_VERSION = '${version}';`);
   const manifest=JSON.stringify({version,sha256:crypto.createHash('sha256').update(code).digest('hex'),size:Buffer.byteLength(code),php_min:'8.2.0',php_max:'9.0.0',schema:1});
   const base=`https://github.com/raldjr/sitefren/releases/download/v${version}/`;
   assets[base+'sitefren.php']=code;assets[base+'update.json']=manifest;assets[base+'update.sig']=crypto.sign(null,Buffer.from(manifest),keys.privateKey).toString('base64');
  }
  env.POCKET_UPDATE_FIXTURE=path.join(root,'fixture-assets.json');
  fs.writeFileSync(env.POCKET_UPDATE_FIXTURE,JSON.stringify(assets));
 }
 const phpArgs=JSON.parse(process.env.PHP_ARGS_JSON||'[]');
 if(process.env.POCKET_TEST_TRANSPORT==='1')phpArgs.push('-d','disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_errno,curl_close','-d','auto_prepend_file='+path.join(__dirname,'curl-fixture.php'));
 const php=spawn(process.env.PHP_BIN||'php',[...phpArgs,'-S',`127.0.0.1:${port}`,'-t',root],{env,stdio:'ignore'});
 let browser;
 try{
  for(let i=0;i<100;i++){try{await(await fetch(`http://127.0.0.1:${port}/sitefren.php`)).arrayBuffer();break}catch{await delay(50)}}
  browser=await chromium.launch({headless:true,executablePath:process.env.BROWSER_EXECUTABLE||undefined,args:['--no-sandbox','--disable-dev-shm-usage']});
  const page=await browser.newPage({viewport:{width:1440,height:1000}});const errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  const url=`http://127.0.0.1:${port}/sitefren.php`;
  await page.goto(url);await page.locator('#authForm').waitFor({state:'visible'});
  check(await page.locator('#setupHelpLink').isVisible(),'Setup offers help before sign-in');
  check((await page.locator('#versionBadge').innerText())==='ALPHA 0.2.4'||(await page.locator('#versionBadge').innerText())==='Alpha 0.2.4','The shipped version is identified as Alpha 0.2.4');
  const code=fs.readFileSync(path.join(root,'builder-state.php'),'utf8').match(/Setup code: ([A-Za-z0-9_-]+)/)[1];
  await page.locator('#setupCode').fill(code);await page.locator('#password').fill('browser-testing-passphrase');await page.locator('#authButton').click();
  await page.locator('#settingsDialog').waitFor({state:'visible'});await page.locator('#cancelSettings').click();
  check(await page.locator('#app').isVisible(),'Owner setup opens the editor');
  check(await page.locator('#editorHelpLink').isVisible(),'Signed-in owners have an independent help link');
  check(await page.locator('.sidebar').isVisible()&&await page.locator('.workbench').isHidden(),'New desktop projects open in a dedicated Chat workspace');
  await page.locator('#prompt').fill('Keep this idea while I look around');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH+'.chat.png',fullPage:true});
  await page.locator('#editorWorkspaceBtn').click();await page.locator('#chatWorkspaceBtn').click();
  check(await page.locator('#prompt').inputValue()==='Keep this idea while I look around','Desktop workspace switching preserves unsent prompts');
  await page.locator('#prompt').fill('');await page.locator('#editorWorkspaceBtn').click();
  await page.locator('#sponsorSpot').evaluate(el=>el.hidden=true);
  check(await page.locator('#editorHelpLink').isVisible(),'Hiding the advertisement does not hide editor help');
  await page.locator('#sponsorSpot').evaluate(el=>el.hidden=false);
  check(await page.locator('#sponsorSpot').isVisible(),'The editor shows a labeled hosting advertisement');
  check((await page.locator('#editorHelpLink').getAttribute('href'))==='mailto:hello@raul.ws?subject=Sitefren%20help','Help opens an email without customer data');
  if(process.env.POCKET_TEST_TRANSPORT==='1'){
   await page.locator('#updateAvailable').waitFor({state:'visible'});
   check((await page.locator('#updateAvailable').innerText()).includes('0.2.5'),'A newer published release shows an update notice');
  }
  await page.locator('#chatWorkspaceBtn').click();await page.locator('#chatDemoBtn').click();
  const preview=page.frameLocator('#preview');await preview.locator('h1').waitFor({state:'visible'});
  check((await preview.locator('h1').innerText()).includes('room to'),'Sample renders inside the isolated frame');
  check(await preview.locator('h1').evaluate(el=>parseFloat(getComputedStyle(el).fontSize)>40),'Preview CSS executes under its separate response policy');
  check(await preview.locator('body').evaluate(()=>{try{parent.document.body;return false}catch{return true}}),'Preview cannot read the editor DOM');
  check(await preview.locator('body').evaluate(()=>{try{document.cookie;return false}catch{return true}}),'Preview cannot read cookies');
  await page.locator('#mobileBtn').click();
  await page.waitForFunction(()=>document.querySelector('#previewShell').getBoundingClientRect().width<=391);
  check((await page.locator('#previewShell').boundingBox()).width<=391,'Mobile preview uses a phone-width canvas');
  await page.locator('#desktopBtn').click();await page.waitForFunction(()=>document.querySelector('#previewShell').getBoundingClientRect().width>1000);
  if(process.env.SCREENSHOT_PATH){await page.locator('#toast').evaluate(el=>el.hidden=true);await page.screenshot({path:process.env.SCREENSHOT_PATH,fullPage:true})}
  await page.setViewportSize({width:1366,height:768});
  const adBounds=await page.locator('#sponsorSpot').boundingBox();
  const helpBounds=await page.locator('#editorHelpLink').boundingBox();
  check(adBounds.y>=0&&adBounds.y+adBounds.height<=768&&helpBounds.y>=0&&helpBounds.y+helpBounds.height<=768,'Ad and help are inside a laptop viewport without scrolling');
  const tabBounds=await page.locator('.tabs').boundingBox();
  const controlBounds=await page.locator('#viewControls').boundingBox();
  check(adBounds.y>=tabBounds.y+tabBounds.height&&adBounds.height<80,'The slim ad sits below the editor controls');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH+'.laptop.png',fullPage:true});
  await page.locator('#sponsorSpot .sponsor-link').evaluate(async el=>{
   const img=document.createElement('img');img.className='sponsor-image';img.alt='';
   img.src='data:image/svg+xml,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="144" height="96"><rect width="144" height="96" rx="8" fill="#304922"/><text x="72" y="62" text-anchor="middle" font-family="sans-serif" font-size="40" fill="white">SH</text></svg>');
   el.prepend(img);await img.decode();
  });
  check(await page.locator('.sponsor-image').evaluate(el=>el.naturalWidth>0&&el.getBoundingClientRect().width===72),'The ad can display embedded artwork at a bounded size');
  check(await page.locator('#sponsorSpot').evaluate(el=>el.scrollWidth<=el.clientWidth),'Image and copy fit inside the ad card');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH+'.image-ad.png',fullPage:true});
  await page.locator('.sponsor-image').evaluate(el=>el.remove());
  await page.setViewportSize({width:1440,height:1000});
  await page.getByRole('tab',{name:'Files',exact:true}).click();
  const original=await page.locator('#codeEditor').inputValue();
  const modified=original.replace('A little more','A lot more');
  await page.locator('#codeEditor').fill(modified);await page.locator('#chatWorkspaceBtn').click();await page.locator('#editorWorkspaceBtn').click();
  check(await page.locator('#codeEditor').inputValue()===modified,'Workspace switching preserves unsaved source edits');
  await page.locator('#saveFileBtn').click();
  await page.waitForFunction(()=>document.querySelector('#fileName').textContent==='index.html');
  await page.getByRole('tab',{name:'Preview',exact:true}).click();await preview.locator('h1').filter({hasText:'A lot more'}).waitFor();
  check(true,'Manual code edits refresh the rendered preview');
  await page.getByRole('tab',{name:'History',exact:true}).click();await page.locator('#historyList button').first().click();await page.locator('#acceptConfirm').click();
  await page.waitForFunction(()=>!document.querySelector('#publishBtn').disabled);
  await page.getByRole('tab',{name:'Preview',exact:true}).click();await preview.locator('h1').filter({hasText:'A little more'}).waitFor();
  check(true,'History restores the earlier visual draft');
  await page.locator('#publishBtn').click();await page.locator('#acceptConfirm').click();await page.waitForFunction(()=>document.querySelector('#saveStatus').textContent==='Published');
  check(fs.readFileSync(path.join(root,'index.html'),'utf8')===original,'Publish writes the selected draft to the real filesystem');
  check(!fs.readFileSync(path.join(root,'index.html'),'utf8').includes('sponsorSpot'),'The editor advertisement is not inserted into published pages');
  // Exercise local linked pages, CSS, classic JS, and network isolation.
  const edits=[
   {path:'style.css',content:'h1{color:rgb(12, 34, 56)}'},
   {path:'script.js',content:"document.documentElement.dataset.ran='yes';fetch('https://example.com/pocket-isolation-test').then(()=>document.documentElement.dataset.network='allowed').catch(()=>document.documentElement.dataset.network='blocked');"},
   {path:'about.html',content:'<!doctype html><h1>About this alpha</h1>'},
   {path:'index.html',content:'<!doctype html><html><head><link rel="stylesheet" href="style.css"></head><body><h1>Local assets</h1><a href="about.html">About page</a><script src="script.js"></script></body></html>'}
  ];
  for(const edit of edits){const result=await page.evaluate(async edit=>{const s=await(await fetch('?action=state')).json();const r=await fetch('?action=save_file',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':s.csrf},body:JSON.stringify({revision:s.revision,...edit})});return r.status},edit);check(result===200,'Accept managed file '+edit.path)}
  await page.reload();await preview.locator('h1').filter({hasText:'Local assets'}).waitFor();
  check(await preview.locator('h1').evaluate(el=>getComputedStyle(el).color)==='rgb(12, 34, 56)','Local stylesheet is embedded into preview');
  await preview.locator('html[data-ran="yes"][data-network="blocked"]').waitFor();
  check(true,'Classic JavaScript runs while network fetches remain blocked');
  await preview.getByRole('link',{name:'About page'}).click();await preview.locator('h1').filter({hasText:'About this alpha'}).waitFor();
  check(true,'Local page links navigate through the isolated preview');
  await page.locator('#pageSelect').selectOption('index.html');
  await page.locator('#editPageBtn').click();
  const editable=preview.locator('[data-pocket-text] h1');await editable.waitFor();await editable.click();
  check(await preview.locator('html').getAttribute('data-ran')===null,'Site scripts do not execute during direct text editing');
  await editable.fill('Minor <b>literal</b> edit & more');
  await page.locator('#saveVisualBtn').click();await page.locator('#visualBar').waitFor({state:'hidden'});
  await preview.locator('h1').filter({hasText:'Minor <b>literal</b> edit & more'}).waitFor();
  check(await preview.locator('h1 b').count()===0,'Visual edits are saved as text rather than executable markup');
  const visualSaved=await page.evaluate(async()=>await(await fetch('?action=state')).json());
  check(visualSaved.files['index.html'].includes('href="style.css"')&&visualSaved.files['index.html'].includes('src="script.js"'),'Visual save preserves original linked styles and scripts');
  check(!/pocket-text|contenteditable|pocket-page/.test(visualSaved.files['index.html']),'Visual save excludes preview helpers and editing attributes');
  check(fs.readFileSync(path.join(root,'index.html'),'utf8')===original,'Visual changes stay in the draft until Publish');
  await page.locator('#editPageBtn').click();await editable.waitFor();await editable.click();await editable.fill('Discard this change');
  await page.locator('#cancelVisualBtn').click();await page.locator('#acceptConfirm').click();
  await preview.locator('h1').filter({hasText:'Minor <b>literal</b> edit & more'}).waitFor();
  check(true,'Cancel discards unsaved visual changes');
  await page.getByRole('tab',{name:'History',exact:true}).click();await page.locator('#historyList button').first().click();await page.locator('#acceptConfirm').click();
  await page.waitForFunction(()=>!document.querySelector('#publishBtn').disabled);
  await page.getByRole('tab',{name:'Preview',exact:true}).click();await preview.locator('h1').filter({hasText:'Local assets'}).waitFor();
  check(true,'History restores the source from before direct text editing');
  if(process.env.POCKET_TEST_TRANSPORT==='1'){
   await page.locator('#pageSelect').selectOption('index.html');
   await page.locator('#settingsBtn').click();await page.locator('#provider').selectOption('concentrate');
   check(await page.locator('#aiTimeout').inputValue()==='180','Existing setup defaults to a three-minute AI wait limit');
   await page.locator('#loadModelsBtn').click();await page.locator('#catalogSelect').waitFor({state:'visible'});
   await page.locator('#catalogSelect').selectOption('fixture-model');
   check(await page.locator('#model').inputValue()==='fixture-model','Provider catalog selection fills the exact model ID');
   await page.locator('#apiKey').fill('browser-fixture-private-key');await page.locator('#aiTimeout').fill('240');
   await page.locator('#settingsForm button[type=submit]').click();await page.locator('#settingsDialog').waitFor({state:'hidden'});
   await page.locator('#chatWorkspaceBtn').click();await page.locator('#prompt').fill('Make a fixture website');await page.locator('#sendBtn').click();
   await page.waitForFunction(()=>document.querySelector('#working').textContent.includes('240s'));
   check(await page.locator('#working').isVisible(),'Browser displays streamed progress and the saved wait limit');
   await page.waitForFunction(()=>!document.querySelector('#sendBtn').disabled);
   await preview.locator('h1').filter({hasText:'Generated fixture site'}).waitFor();
   check(await page.locator('#prompt').inputValue()==='','Streamed completion updates the draft and clears the submitted prompt');
   const cards='<!doctype html><html><head><style>.card { background: white; padding: 24px; border: 1px solid #ddd; margin: 15px; }</style></head><body><h1>Generated fixture site</h1><main><article class="card" id="first"><h2>Alpha card</h2><p>Change just this card.</p></article><article class="card" id="second"><h2>Beta card</h2><p>Keep this card as it is.</p></article></main><script>document.documentElement.dataset.ran="yes";</script></body></html>';
   await page.evaluate(async content=>{const state=await(await fetch('?action=state')).json();const response=await fetch('?action=save_file',{method:'POST',headers:{'Content-Type':'application/json','X-CSRF-Token':state.csrf},body:JSON.stringify({revision:state.revision,path:'index.html',content})});if(!response.ok)throw Error('Could not set up cards')},cards);
   await page.reload();await preview.locator('#first h2').waitFor();
   await page.locator('#settingsBtn').click();await page.locator('#model').fill('fixture-target');await page.locator('#settingsForm button[type=submit]').click();await page.locator('#settingsDialog').waitFor({state:'hidden'});
   await page.locator('#selectElementBtn').click();await preview.locator('#first h2[data-pocket-select]').waitFor();
   check(await preview.locator('html').getAttribute('data-ran')===null,'Selection pauses site scripts to target original source elements');
   await preview.locator('#first h2').focus();await preview.locator('#first h2').press('Enter');
   await page.locator('#selectionChatBtn').click();await page.locator('#selectionLabel').filter({hasText:'Heading'}).waitFor();
   check(true,'An element can be selected with the keyboard');
   await page.locator('#selectParentBtn').click();await page.locator('#editorWorkspaceBtn').click();await preview.locator('#first[data-pocket-selected]').waitFor();
   check((await page.locator('#selectionLabel').innerText()).includes('Card'),'Select parent moves from heading to its card');
   await preview.locator('body').evaluate(()=>parent.postMessage({type:'pocket-element-selected',token:'wrong-token',index:0},'*'));
   check((await page.locator('#selectionLabel').innerText()).includes('Card'),'A message without the active selection token cannot replace the target');
   await page.locator('#chatWorkspaceBtn').click();await page.locator('#prompt').fill('Make this card red');
   if(process.env.SCREENSHOT_SELECTION_PATH)await page.screenshot({path:process.env.SCREENSHOT_SELECTION_PATH,fullPage:true});
   await page.locator('#sendBtn').click();await page.waitForFunction(()=>!document.querySelector('#sendBtn').disabled);
   await preview.locator('#first').waitFor();
   check(await preview.locator('#first').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(255, 0, 0)','Selected element context reaches the provider and its returned change appears');
   check(await preview.locator('#second').evaluate(el=>getComputedStyle(el).backgroundColor)==='rgb(255, 255, 255)','Targeted fixture preserves the other card sharing the same class');
   check(await page.locator('#selectionChip').isHidden(),'Selection clears after its source changes');
   const targeted=await page.evaluate(async()=>await(await fetch('?action=state')).json());
   check(!targeted.files['index.html'].includes('data-pocket-'),'Selection helpers and highlight attributes do not enter saved source');
   check((await page.locator('.message-target').last().innerText()).includes('article in index.html'),'Conversation retains a readable reference to the chosen target');
   await page.locator('#selectElementBtn').click();await preview.locator('#first h2[data-pocket-select]').click();
   await page.locator('#pageSelect').selectOption('about.html');
   check(await page.locator('#selectionChip').isHidden()&&await page.locator('#selectElementBtn').getAttribute('aria-pressed')==='false','Changing pages clears the previous selection');
   await page.locator('#pageSelect').selectOption('index.html');
   await page.locator('#settingsBtn').click();await page.locator('#model').fill('fixture-zdr');
   check(await page.locator('#aiTimeout').inputValue()==='240','AI wait limit persists after reopening Settings');
   await page.locator('#settingsForm button[type=submit]').click();await page.locator('#settingsDialog').waitFor({state:'hidden'});
   await page.locator('#chatWorkspaceBtn').click();await page.locator('#prompt').fill('Keep my policy');await page.locator('#sendBtn').click();
   await page.locator('#requestError').waitFor({state:'visible'});
   check((await page.locator('#requestError').innerText()).includes('ZDR'),'Streamed provider rejection remains visible beside the conversation');
   check(await page.locator('#prompt').inputValue()==='Keep my policy','A rejected request keeps the user prompt for correction');
   check((await preview.locator('h1').innerText()).includes('Generated fixture site'),'A rejected request preserves the previous browser preview');
   await page.locator('#accountMenu summary').click();await page.locator('#diagnosticsBtn').click();
   check((await page.locator('#diagnosticSummary').innerText()).includes('provider endpoint returned an HTTP error'),'Request details identify a returned provider HTTP failure');
   check((await page.locator('#diagnosticData').innerText()).includes('422')&&!(await page.locator('#diagnosticData').innerText()).includes('browser-fixture-private-key'),'Request details show the upstream status without credentials');
   await page.locator('#closeDiagnostics').click();
   await page.reload();await page.locator('#app').waitFor({state:'visible'});
   check(await page.locator('#toast').isHidden(),'Refreshing does not replay the saved error toast');
   await page.locator('#chatWorkspaceBtn').click();await page.locator('#dismissError').click();await page.locator('#requestError').waitFor({state:'hidden'});
   await page.reload();await page.locator('#app').waitFor({state:'visible'});
   check(await page.locator('#requestError').isHidden(),'Dismissed errors stay hidden after refresh');
   await page.locator('#accountMenu summary').click();await page.locator('#diagnosticsBtn').click();
   check((await page.locator('#diagnosticData').innerText()).includes('422'),'Dismissal preserves technical request details');
   await page.locator('#closeDiagnostics').click();
  }
  await page.setViewportSize({width:390,height:844});await page.reload();await page.locator('#app').waitFor({state:'visible'});
  check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Mobile editor has no horizontal page overflow');
  check(await page.locator('#sponsorSpot').isVisible(),'The hosting advertisement remains visible on mobile');
  check(await page.locator('#versionBadge').isVisible()&&await page.locator('#editorHelpLink').isVisible(),'Mobile retains the version badge and independent help link');
  if(process.env.SCREENSHOT_PATH)await page.screenshot({path:process.env.SCREENSHOT_PATH+'.mobile.png',fullPage:true});
  if(process.env.POCKET_TEST_TRANSPORT==='1'){
   await page.locator('#updateAvailable').waitFor({state:'visible'});
   await page.locator('#updateAvailable').click();
   await page.locator('#updateNowBtn').waitFor({state:'visible'});
   check(await page.locator('#settingsDialog').isVisible(),'The footer opens Settings with Update now');
   await page.locator('#updateNowBtn').click();await page.locator('#confirmDialog').waitFor({state:'visible'});
   await page.locator('#cancelConfirm').click();
   check(fs.readFileSync(path.join(root,'sitefren.php'),'utf8').includes("const PS_VERSION = '0.2.4';"),'Cancel leaves the installed version untouched');
   const before=JSON.parse(fs.readFileSync(path.join(root,'builder-state.php'),'utf8').split('?>\n')[1]);
   await page.locator('#settingsBtn').click();await page.locator('#updateNowBtn').click();await page.locator('#acceptConfirm').click();
   await page.waitForFunction(()=>document.querySelector('#versionBadge').textContent.includes('0.2.5'));
   await page.locator('#app').waitFor({state:'visible'});
   const after=JSON.parse(fs.readFileSync(path.join(root,'builder-state.php'),'utf8').split('?>\n')[1]);
   check(JSON.stringify(before.files)===JSON.stringify(after.files)&&JSON.stringify(before.config)===JSON.stringify(after.config),'Update now reloads into the signed release with draft and credentials preserved');
   const backupResponse=await page.request.get(`http://127.0.0.1:${port}/${after.update_backup}.state.php`);
   check(backupResponse.status()===404&&(await backupResponse.body()).length===0,'Update backup is inaccessible over HTTP');
  }
  await page.locator('#accountMenu summary').click();await page.locator('#logoutBtn').click();await page.locator('#authForm').waitFor({state:'visible'});
  check(true,'Browser sign-out returns to the password screen');
  check(await page.locator('#setupHelpLink').isVisible(),'Sign-in keeps the help link available');
  check(errors.length===0,'No uncaught browser JavaScript errors: '+errors.join('; '));
  process.stdout.write(`\n${passed} browser checks passed. No live model calls were made.\n`);
 }finally{if(browser)await browser.close();php.kill('SIGTERM');await delay(100);fs.rmSync(root,{recursive:true,force:true})}
})().catch(e=>{process.stderr.write(e.stack+'\n');process.exitCode=1});
