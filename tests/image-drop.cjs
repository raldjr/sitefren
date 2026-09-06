/* Run with node tests/image-drop.cjs. Exercises upload event handlers without PHP. */
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const source = fs.readFileSync(require('node:path').join(__dirname, '../sitefren.php'), 'utf8');
const script = source.slice(source.lastIndexOf('<script nonce='));
new vm.Script(script.slice(script.indexOf('\n') + 1, script.indexOf('</script>')));
const handlers = {};
const classes = new Set();
const input = { files: [], value: '' };
const elements = Object.fromEntries(['attachBtn', 'uploadBtn', 'imageInput', 'chatForm'].map(id => [id, {
  ...(id === 'imageInput' ? input : {}),
  addEventListener(type, handler) { handlers[id + ':' + type] = handler; },
  classList: { add: value => classes.add(value), remove: value => classes.delete(value) },
}]));
const notices = [];
const uploads = [];
const context = vm.createContext({
  byId: id => elements[id],
  busy: false, visual: null, state: { authenticated: true },
  setBusy(value) { context.busy = value; },
  notice: (...args) => notices.push(args),
  render() {},
  async api(action, data) {
    uploads.push({ action, data });
    if (context.failUpload) throw Error('This project has reached its 8 MB image limit.');
    return { authenticated: true };
  },
  FileReader: class {
    readAsDataURL(file) {
      queueMicrotask(() => {
        if (file.unreadable) return this.onerror();
        this.result = 'data:image/png;base64,aW1hZ2U=';
        this.onload();
      });
    }
  },
});
vm.runInContext(source.slice(source.indexOf("      for (const id of ['attachBtn', 'uploadBtn'])"),
  source.indexOf('      function schedulePoll()')), context);
const png = { name: 'photo.png', type: 'image/png', size: 100 };
function event(files = [png], types = ['Files']) {
  return { dataTransfer: { files, types }, prevented: false, preventDefault() { this.prevented = true; } };
}
const settled = () => new Promise(resolve => setImmediate(resolve));
(async () => {
  const drag = event();
  handlers['chatForm:dragenter'](drag);
  handlers['chatForm:dragenter'](drag);
  handlers['chatForm:dragleave']();
  assert(classes.has('drag-over'), 'Highlight survives movement between child elements');
  handlers['chatForm:dragover'](drag);
  assert.equal(drag.dataTransfer.dropEffect, 'copy');
  const drop = event([png, { ...png, name: 'second.png' }]);
  handlers['chatForm:drop'](drop);
  assert(drop.prevented);
  assert(!classes.has('drag-over'));
  assert(context.busy, 'Editor locked while files are being read');
  handlers['chatForm:drop'](event());
  await settled();
  assert.equal(uploads.length, 2, 'Multiple files upload sequentially; concurrent drop is ignored');
  assert(!context.busy);
  for (const file of [{ name: 'unsafe.html', type: 'text/html', size: 100 }, { ...png, size: 2000001 }]) {
    handlers['chatForm:drop'](event([file]));
    await settled();
    assert.equal(notices.at(-1)[1], true);
  }
  assert.equal(uploads.length, 2);
  context.visual = {};
  handlers['chatForm:drop'](event());
  context.visual = null;
  context.state.authenticated = false;
  handlers['chatForm:drop'](event());
  context.state.authenticated = true;
  await settled();
  assert.equal(uploads.length, 2, 'Editing and unauthenticated states reject drops');
  const text = event([], ['text/plain']);
  handlers['chatForm:drop'](text);
  assert(!text.prevented, 'Ordinary text dragging is preserved');
  elements.imageInput.files = [{ name: 'icon.svg', type: 'image/svg+xml', size: 100 }];
  handlers['imageInput:change']();
  await settled();
  assert.equal(uploads.length, 3, 'File picker accepts SVG uploads');
  assert.equal(elements.imageInput.value, '');
  handlers['chatForm:drop'](event([{ ...png, unreadable: true }]));
  await settled();
  assert.equal(notices.at(-1)[0], 'Could not read that image.');
  assert(!context.busy);
  context.failUpload = true;
  handlers['chatForm:drop'](event());
  await settled();
  assert.equal(notices.at(-1)[0], 'This project has reached its 8 MB image limit.');
  assert(!context.busy);
  console.log('PASS: embedded JavaScript syntax and image drop/upload handlers');
})().catch(error => { console.error(error); process.exitCode = 1; });
