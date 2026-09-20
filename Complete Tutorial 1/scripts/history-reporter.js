const fs = require('node:fs');
const path = require('node:path');
const { randomUUID } = require('node:crypto');

const root = path.resolve(__dirname, '..');
const escape = value => String(value).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function rebuildIndex(history) {
  const runs = fs.readdirSync(history, { withFileTypes: true })
    .filter(entry => entry.isDirectory())
    .map(entry => path.join(history, entry.name, 'run.json'))
    .filter(file => fs.existsSync(file))
    .map(file => JSON.parse(fs.readFileSync(file, 'utf8')))
    .sort((a, b) => b.started.localeCompare(a.started));
  const rows = runs.map(run => `<tr><td><a href="${escape(run.id)}/index.html">${escape(run.started)}</a></td><td>${escape(run.status)}</td><td>${run.total ?? '—'}</td><td>${run.expected ?? '—'}</td><td>${run.unexpected ?? '—'}</td><td>${run.flaky ?? '—'}</td><td>${run.skipped ?? '—'}</td><td>${run.duration == null ? '—' : (run.duration / 1000).toFixed(1) + 's'}</td><td>${escape(run.scope)}</td></tr>`).join('\n');
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Comparinator test history</title><style>body{font:16px/1.5 system-ui;margin:40px auto;padding:0 24px;max-width:1400px;background:#f4f6fb;color:#20283e}a{color:#4936ad}h1{margin-bottom:8px}.table{overflow:auto;background:white;border:1px solid #d6dceb;border-radius:12px}table{border-collapse:collapse;width:100%;font-size:14px}th,td{text-align:left;padding:14px;border-bottom:1px solid #e4e7ef}th{background:#ebe8fa}td:last-child{min-width:280px}a:focus-visible{outline:3px solid #4936ad}</style></head><body><h1>Comparinator test history</h1><p>${runs.length} archived runs · Times are UTC · <a href="../playwright-report/index.html">Latest report</a></p><p>Each run retains its own report and attachments. Filtered runs reflect only the selected tests. Refresh this page after a run finishes.</p><div class="table"><table><thead><tr><th scope="col">Started (UTC)</th><th scope="col">Status</th><th scope="col">Tests</th><th scope="col">Expected</th><th scope="col">Unexpected</th><th scope="col">Flaky</th><th scope="col">Skipped</th><th scope="col">Duration</th><th scope="col">Scope</th></tr></thead><tbody>${rows}</tbody></table></div><p>Expected includes tests that failed as explicitly expected by the suite. Imported reports retain their original details; summary counts are unavailable.</p></body></html>`;
  const temporary = path.join(history, `index-${randomUUID()}.tmp`);
  fs.writeFileSync(temporary, html);
  fs.renameSync(temporary, path.join(history, 'index.html'));
}

function archiveReport(latest, history, metadata) {
  if (!fs.existsSync(path.join(latest, 'index.html'))) throw new Error(`HTML report is missing: ${latest}`);
  fs.mkdirSync(history, { recursive: true });
  const id = `${metadata.started.replace(/[:.]/g, '-')}-${randomUUID().slice(0, 8)}`;
  const destination = path.join(history, id);
  fs.cpSync(latest, destination, { recursive: true });
  const run = { ...metadata, id };
  fs.writeFileSync(path.join(destination, 'run.json'), JSON.stringify(run, null, 2));
  rebuildIndex(history);
  fs.writeFileSync(path.join(latest, '.archived.json'), JSON.stringify({ id }));
  return destination;
}

class HistoryReporter {
  onBegin(config, suite) {
    this.suite = suite;
    this.latest = path.join(root, 'playwright-report');
    this.history = path.join(root, 'test-history');
    // Preserve the report created before historical reporting was enabled.
    if (fs.existsSync(path.join(this.latest, 'index.html')) && !fs.existsSync(path.join(this.latest, '.archived.json'))) {
      archiveReport(this.latest, this.history, {
        started: fs.statSync(path.join(this.latest, 'index.html')).mtime.toISOString(),
        status: 'imported', scope: 'Existing report (original run scope unknown)',
      });
    }
  }
  onEnd(result) { this.result = result; }
  async onExit() {
    // onExit runs after all reporters finish onEnd, including the HTML reporter.
    if (!this.result || !this.suite) return;
    const tests = this.suite.allTests();
    const counts = { expected: 0, unexpected: 0, flaky: 0, skipped: 0 };
    for (const test of tests) counts[test.outcome()]++;
    const projects = [...new Set(tests.map(test => test.parent.project()?.name).filter(Boolean))];
    archiveReport(this.latest, this.history, {
      started: this.result.startTime.toISOString(), duration: this.result.duration,
      status: this.result.status, total: tests.length, ...counts,
      scope: `${projects.join(', ')} | ${process.argv.slice(2).join(' ')}`,
    });
    console.log('\nTest history: test-history/index.html');
  }
  printsToStdio() { return false; }
}
module.exports = HistoryReporter;
module.exports.archiveReport = archiveReport;
