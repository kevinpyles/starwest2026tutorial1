const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { archiveReport } = require('./history-reporter');

test('archives remain independent, retain attachments, and index failed and filtered runs safely', t => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'comparinator-history-'));
  t.after(() => fs.rmSync(temp, { recursive: true, force: true }));
  const latest = path.join(temp, 'latest'), history = path.join(temp, 'history');
  fs.mkdirSync(path.join(latest, 'data'), { recursive: true });
  fs.writeFileSync(path.join(latest, 'index.html'), 'first report');
  fs.writeFileSync(path.join(latest, 'data', 'trace.zip'), 'first attachment');
  const first = archiveReport(latest, history, { started: '2026-09-19T12:00:00.000Z', status: 'passed', total: 1, expected: 1, scope: 'chromium' });
  fs.writeFileSync(path.join(latest, 'index.html'), 'second report');
  fs.writeFileSync(path.join(latest, 'data', 'trace.zip'), 'second attachment');
  const second = archiveReport(latest, history, { started: '2026-09-19T12:00:00.000Z', status: 'failed', total: 1, unexpected: 1, scope: '--grep <script>alert("x")</script>' });
  assert.notEqual(first, second, 'same timestamp must not overwrite a run');
  assert.equal(fs.readFileSync(path.join(first, 'index.html'), 'utf8'), 'first report');
  assert.equal(fs.readFileSync(path.join(first, 'data', 'trace.zip'), 'utf8'), 'first attachment');
  assert.equal(fs.readFileSync(path.join(second, 'data', 'trace.zip'), 'utf8'), 'second attachment');
  const index = fs.readFileSync(path.join(history, 'index.html'), 'utf8');
  assert.match(index, /2 archived runs/);
  assert.match(index, /failed/);
  assert.match(index, /&lt;script&gt;/);
  assert.ok(!index.includes('<script>'));
  for (const dir of [first, second]) assert.ok(index.includes(`${path.basename(dir)}/index.html`));
});
