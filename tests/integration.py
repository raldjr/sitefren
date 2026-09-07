"""Integration tests against a temporary PHP server. No third-party Python packages.
Run: PHP_BIN=/path/to/php python3 tests/integration.py
Optional PHP_ARGS is a shell-style string of PHP ini flags, never run through a shell.
Set POCKET_TEST_TRANSPORT=1 to test generation/progress with an isolated cURL fixture.
"""
import base64, http.cookiejar, json, os, pathlib, re, shlex, shutil, socket, subprocess, tempfile, time, urllib.error, urllib.request

ROOT = pathlib.Path(__file__).resolve().parent.parent
passed = 0
def check(value, label):
    global passed
    assert value, label
    passed += 1
    print('PASS:', label)

with tempfile.TemporaryDirectory(prefix='pocket-http-') as tmp:
    root = pathlib.Path(tmp)
    shutil.copyfile(ROOT/'sitefren.php', root/'sitefren.php')
    with socket.socket() as s:
        s.bind(('127.0.0.1', 0))
        port = s.getsockname()[1]
    base = f'http://127.0.0.1:{port}'
    fixture = os.environ.get('POCKET_TEST_TRANSPORT')=='1'
    php_args = shlex.split(os.environ.get('PHP_ARGS',''))
    if fixture:
        php_args += ['-d','disable_functions=curl_init,curl_setopt_array,curl_exec,curl_getinfo,curl_errno,curl_close','-d','auto_prepend_file='+str(ROOT/'tests/curl-fixture.php')]
    command = [os.environ.get('PHP_BIN', 'php'), *php_args, '-S', f'127.0.0.1:{port}', '-t', tmp]
    env = {k:v for k,v in os.environ.items() if not k.startswith('POCKET_')}
    if not fixture: env['POCKET_UPDATE_CHECKS']='0'
    server = subprocess.Popen(command, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL, env=env)
    jar = http.cookiejar.CookieJar()
    client = urllib.request.build_opener(urllib.request.HTTPCookieProcessor(jar))
    csrf = ''
    revision = 0
    last_events = []
    def request(action, data=None, token=True, verb=None, incomplete=False):
        global csrf, revision, last_events
        headers={}
        if data is not None:
            headers={'Content-Type':'application/json','X-CSRF-Token':csrf if token else 'wrong'}
            data=json.dumps({'revision':revision,**data}).encode()
        req=urllib.request.Request(base+'/sitefren.php?action='+action,data=data,headers=headers,method=verb)
        try:
            response=client.open(req)
        except urllib.error.HTTPError as e:
            response=e
        raw=response.read()
        last_events=[]
        status=response.status
        if 'application/x-ndjson' in response.headers.get('Content-Type',''):
            last_events=[json.loads(line) for line in raw.splitlines() if line.strip()]
            done=last_events[-1]
            if incomplete:
                assert done['type']!='result','Expected an interrupted fixture response'
                return status,{}
            assert done['type']=='result','Progress response did not finish'
            result=done['data'];status=done['status']
        else:result=json.loads(raw)
        if 'csrf' in result:csrf=result['csrf']
        if 'revision' in result:revision=result['revision']
        return status,result
    try:
        for _ in range(60):
            try:
                status,state=request('state')
                break
            except (ConnectionError,urllib.error.URLError):time.sleep(.05)
        else:raise RuntimeError('PHP server did not start')
        check(status==200 and state['setup'] and not state['authenticated'],'Fresh HTTP install exposes setup, not project files')
        homepage=client.open(base+'/').read().decode()
        check('Something good is on its way.' in homepage and 'builder-state' not in homepage,'Fresh root serves a placeholder instead of a file list')
        check('noindex, nofollow' in homepage,'Placeholder asks search engines not to index it')
        editor=client.open(base+'/sitefren.php').read().decode()
        icon=re.search(r'<link rel="icon" type="image/svg\+xml" href="data:image/svg\+xml;base64,([^"]+)"', editor)
        check(icon and base64.b64decode(icon.group(1))==(ROOT/'docs/sitefren-icon.svg').read_bytes(),'Editor embeds the supplied Sitefren favicon')
        code=re.search(r'Setup code: ([A-Za-z0-9_-]+)',(root/'builder-state.php').read_text()).group(1)
        check(code not in json.dumps(state),'Ownership code is not returned over HTTP')
        check(request('setup',{'code':code,'password':'example-testing-passphrase'},token=False)[0]==403,'Reject setup without CSRF')
        check(request('setup',{'code':'wrong','password':'example-testing-passphrase'})[0]==401,'Reject a wrong ownership code')
        check(request('publish',{})[0]==401,'Reject publishing while signed out')
        check(request('check_updates',{})[0]==401,'Update checks require authentication')
        status,state=request('setup',{'code':code,'password':'example-testing-passphrase'})
        check(status==200 and state['authenticated'] and not state['setup'],'Owner can finish setup and sign in')
        check('Setup code:' not in (root/'builder-state.php').read_text(),'Setup clears the ownership token')
        check(any(c.has_nonstandard_attr('HttpOnly') for c in jar),'Editor cookie is HTTP-only')
        check(request('demo',{},token=False)[0]==403,'Reject authenticated mutations without CSRF')
        check(request('demo',verb='GET')[0]==405,'GET cannot mutate the project')
        check(request('check_updates',{},token=False)[0]==403,'Update checks require CSRF')
        update_status,update=request('check_updates',{})
        check(update_status==200 and update['status']==('checked' if fixture else 'disabled'),'Update checks respect host settings and parse fixture releases')
        if fixture:
            check(update['available'] and update['version']=='0.1.11' and update['url']=='https://github.com/raldjr/sitefren/releases','New alpha releases return a fixed official download link')
            cached=(root/'builder-state.php').read_bytes()
            check(request('check_updates',{'force':True})[1]==update and (root/'builder-state.php').read_bytes()==cached,'Repeated and forced checks within a minute reuse cached data')
        status,state=request('demo',{})
        check(status==200 and 'index.html' in state['files'],'Sample-site endpoint creates an editable draft')
        check(request('demo',{})[0]==409,'Sample cannot replace an existing draft')
        original=state['files']['index.html']
        check(request('save_file',{'path':'../escape.html','content':'bad'})[0]==400,'HTTP path traversal is rejected')
        check(request('save_file',{'path':'index.html','content':'<?php echo 1;'})[0]==400,'HTTP server-code injection is rejected')
        status,state=request('save_file',{'path':'index.html','content':original.replace('forma.','forma studio.')})
        check(status==200 and 'forma studio.' in state['files']['index.html'],'Manual file edits persist')
        check(request('save_file',{'path':'index.html','content':'stale','revision':0})[0]==409,'Stale HTTP edits cannot overwrite newer work')
        status,state=request('restore',{'id':state['history'][0]['id']})
        check(status==200 and state['files']['index.html']==original,'Draft restore works over HTTP')
        png='iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a4WQAAAAASUVORK5CYII='
        status,state=request('upload',{'data':png})
        check(status==200 and len(state['assets'])==1,'Valid image uploads are stored')
        check(request('upload',{'data':base64.b64encode(b'<svg onload="alert(1)"></svg>').decode()})[0]==400,'Active SVG uploads are rejected')
        svg=(ROOT/'docs/sitefren-icon.svg').read_bytes()
        status,state=request('upload',{'data':base64.b64encode(svg).decode()})
        check(status==200 and any(a['mime']=='image/svg+xml' for a in state['assets'].values()),'Static SVG with stylesheet uploads successfully')
        for invalid in [b'', b'<svg', b'<!DOCTYPE svg [<!ENTITY x SYSTEM "file:///etc/passwd">]><svg xmlns="http://www.w3.org/2000/svg">&x;</svg>', svg.decode().encode('utf-16')]:
            check(request('upload',{'data':base64.b64encode(invalid).decode()})[0]==400,'Reject malformed SVG, entities, or unsupported encoding')
        svg_path=next(p for p,a in state['assets'].items() if a['mime']=='image/svg+xml')
        for content in ['<script>alert(1)</script>', '<foreignObject/>', '<style>svg { background: image-set(&quot;remote.png&quot; 1x); }</style>', '<use href="https://example.com/a.svg#x"/>', '<style>@import "https://example.com/a.css";</style>', '<rect style="fill:url(https://example.com/x)"/>', '<rect onclick="alert(1)"/>']:
            unsafe=('<svg xmlns="http://www.w3.org/2000/svg">'+content+'</svg>').encode()
            check(request('upload',{'data':base64.b64encode(unsafe).decode()})[0]==400,'Reject unsafe SVG: '+content)
        status,state=request('settings',{'provider':'concentrate','model':'fixture-model','api_key':'not-a-real-secret-fixture'})
        check(status==200 and state['config']['has_key'] and 'not-a-real-secret-fixture' not in json.dumps(state),'Saving provider credentials does not echo them to the client')
        status,state=request('settings',{'clear_key':True})
        check(status==200 and not state['config']['has_key'],'Saved credentials can be removed')
        check(request('generate',{'prompt':'Build a site'})[0]==400,'Missing credentials fail before any network call')
        if fixture:
            request('settings',{'provider':'concentrate','model':'fixture-invalid-json','api_key':'not-a-real-secret-fixture'})
            prior_files = state['files']
            status,error=request('generate',{'prompt':'Build my site'})
            check(status==502 and 'edit format was unreadable' in error['error'],'Malformed output produces an actionable error over HTTP')
            _,state=request('state')
            check(state['files']==prior_files and not state['pending'],'Malformed output preserves the draft and releases the job')
            check(state['last_request']['response_stage']=='invalid_json' and 'private-model-output' not in json.dumps(state),'HTTP diagnostics classify JSON failure without storing raw text')
        if fixture:
            dismissal={'request_id':state['last_request']['id'],'error':state['last_error']}
            diagnostics=state['last_request']
            check(request('dismiss_error',dismissal,token=False)[0]==403,'Dismissal requires CSRF protection')
            check(request('dismiss_error',{**dismissal,'request_id':'older'})[0]==409,'An old dismissal cannot clear a newer error')
            check(request('dismiss_error',dismissal)[0]==200,'Owner can dismiss a saved error')
            _,state=request('state')
            check(state['last_error'] is None and state['last_request']==diagnostics,'Dismissal persists after refresh and retains request diagnostics')
        if fixture:
            request('settings',{'provider':'concentrate','model':'fixture-cutoff','api_key':'not-a-real-secret-fixture'})
            prior_files=state['files']
            status,error=request('generate',{'prompt':'Build a full site'})
            check(status==502 and 'likely cut off' in error['error'],'Completed-but-truncated response reports a likely output cutoff')
            _,state=request('state')
            check(state['last_request']['response_stage']=='suspected_output_limit' and state['last_request']['output_tokens']==16000,'Cutoff diagnostics retain output usage and requested cap')
            check(state['files']==prior_files and not state['pending'],'Output cutoff preserves all draft files and releases the job')
        status,state=request('publish',{})
        check(status==200 and (root/'index.html').read_text()==original and not state['dirty'],'Publishing writes the website to disk')
        check((root/svg_path).read_bytes()==svg,'Publishing preserves the validated SVG asset')
        with client.open(base+'/index.html') as r: check(r.status==200 and 'forma.' in r.read().decode(),'Published website is served independently of the editor')
        with client.open(base+'/sitefren.php?preview=1') as r:
            csp=r.headers.get('Content-Security-Policy','')
            check('sandbox allow-scripts;' in csp and 'allow-same-origin' not in csp and "connect-src 'none'" in csp,'Preview response has an opaque sandbox and blocked network connections')
        for filename in ['builder-state.php','builder-state.php.lock.php']:
            try:client.open(base+'/'+filename);check(False,'Private state is blocked')
            except urllib.error.HTTPError as e:check(e.code==404 and not e.read(),'Private PHP file cannot be downloaded: '+filename)
        if fixture:
            status,models=request('models',{'provider':'concentrate'})
            check(status==200 and models['models'][0]['id']=='fixture-model','Authenticated model catalog lookup succeeds without sending the saved key')
            check(request('models',{'provider':'concentrate'},token=False)[0]==403,'Model catalog proxy requires a CSRF token')
            request('settings',{'provider':'concentrate','model':'fixture-model','api_key':'private-fixture-key','timeout':180})
            selection={'path':'missing.html','selector':'body > article:nth-of-type(1)','tag':'article','text':'A card','html':'<article>A card</article>','html_truncated':False}
            check(request('generate',{'prompt':'Make this red','selection':selection})[0]==400,'Reject a selected element from an unmanaged page before generation')
            selection['path']='index.html';selection['selector']='body, *'
            check(request('generate',{'prompt':'Make this red','selection':selection})[0]==400,'Reject an invalid selector before generation')
            check(request('state')[1]['pending'] is None,'Invalid selection does not reserve a generation request')
            status,generated=request('generate',{'prompt':'Generate a fixture site'})
            check(status==200 and 'Generated fixture site' in generated['files']['index.html'],'Concentrate generation completes through HTTP with the fixture transport')
            check(len([e for e in last_events if e['type']=='progress'])>=2,'Generation emits an initial event and a timed heartbeat before completion')
            check(last_events[0]['limit']==180,'Progress reports the configured three-minute wait limit')
            check(generated['pending'] is None and generated['last_error'] is None,'Completed generation clears its pending job')
            check(generated['last_request']['outcome']=='completed' and generated['last_request']['provider_http_status']==200,'Diagnostics distinguish successful HTTP response and saved draft')
            check(generated['last_request']['connect_time']==0.01 and len(generated['last_request']['id'])==32,'Diagnostics retain transfer timing and a bounded request ID')
            check('private-fixture-key' not in json.dumps(last_events),'Progress and final state do not expose the provider credential')
            request('settings',{'model':'fixture-zdr'})
            status,failed=request('generate',{'prompt':'Fixture ZDR error'})
            check(status==502 and 'ZDR restriction' in failed['error'],'ZDR rejection is readable after progress streaming starts')
            check('private-fixture-message' not in json.dumps(last_events),'Provider error bodies are not exposed in streamed failures')
            status,recovered=request('state')
            check(recovered['pending'] is None and recovered['files']==generated['files'],'A rejected request preserves the draft and releases the job')
            check(recovered['last_request']['transport_cause']=='provider_http_error' and recovered['last_request']['provider_http_status']==422,'Diagnostics retain the provider status independently of the editor HTTP status')
            request('settings',{'model':'fixture-unknown'})
            status,failed=request('generate',{'prompt':'Fixture model error'})
            check(status==502 and 'model selection' in failed['error'],'HTTP 422 identifies an invalid model field')
            request('settings',{'model':'fixture-timeout','timeout':240})
            status,failed=request('generate',{'prompt':'Fixture timeout'})
            check(status==502 and '240-second' in failed['error'],'Timeout errors report the selected wait limit')
            check(request('state')[1]['pending'] is None,'Timed-out generation releases the pending job')
            diagnostic=request('state')[1]['last_request']
            check(diagnostic['curl_errno']==28 and diagnostic['transport_cause']=='local_wait_limit','Local wait-limit diagnostics do not blame provider or hosting')
            request('settings',{'model':'fixture-fatal'})
            request('generate',{'prompt':'Synthetic PHP fatal'},incomplete=True)
            recovered=request('state')[1]
            check(recovered['pending'] is None and recovered['last_request']['outcome']=='php_fatal_error','Shutdown handler records a PHP fatal and releases the request')
            check('private-fixture-message' not in json.dumps(recovered),'Fatal diagnostics do not expose the raw PHP error')
            request('settings',{'model':'fixture-exit'})
            request('generate',{'prompt':'Synthetic process interruption'},incomplete=True)
            private=pathlib.Path(tmp)/'builder-state.php'
            header,body=private.read_text().split('?>\n',1)
            interrupted=json.loads(body);interrupted['pending']['expires']=int(time.time())-1
            private.write_text(header+'?>\n'+json.dumps(interrupted))
            recovered=request('state')[1]
            check(recovered['pending'] is None and recovered['last_request']['outcome']=='interrupted_unknown','Unrecorded interruption stays unknown after reservation expiry')
            check(recovered['files']==generated['files'],'PHP fatal and unrecorded interruption preserve the draft')
            request('settings',{'provider':'openrouter','model':'fixture-model'})
            status,generated=request('generate',{'prompt':'Fixture OpenRouter generation'})
            check(status==200 and 'Generated fixture site' in generated['files']['index.html'],'OpenRouter generation still completes with progress enabled')
        status,state=request('logout',{})
        check(status==200 and not state['authenticated'] and 'files' not in state,'Signing out removes access to drafts')
        check('last_request' not in state,'Signed-out responses omit request diagnostics')
        check(request('login',{'password':'wrong-password-example'})[0]==401,'Wrong password is rejected')
        check(request('login',{'password':'example-testing-passphrase'})[0]==200,'Password sign-in restores access')
        request('logout',{})
        for _ in range(10):request('login',{'password':'wrong-password-example'})
        check(request('login',{'password':'example-testing-passphrase'})[0]==429,'Repeated failures trigger a sign-in cooldown')
        print(f'\n{passed} HTTP checks passed. No live provider requests were made.')
    finally:
        server.terminate()
        server.wait(timeout=10)
