const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const appURL = pathToFileURL(path.resolve(__dirname, '../index.html')).href;

async function compare(page, a, b, options = {}) {
  await page.locator('#text-a').fill(a);
  await page.locator('#text-b').fill(b);
  await page.getByLabel('Ignore case', { exact: true }).setChecked(!!options.ignoreCase);
  await page.getByLabel('Ignore punctuation', { exact: true }).setChecked(!!options.ignorePunctuation);
  await page.getByRole('button', { name: 'Compare texts' }).click();
  await expect(page.getByRole('status')).toContainText('Comparison complete.');
}
async function scores(page, similarity, a = similarity, b = a) {
  await expect(page.locator('#similarity')).toHaveText(`${similarity.toFixed(1)}%`);
  await expect(page.locator('#accuracy')).toHaveText(`${a.toFixed(1)}% / ${b.toFixed(1)}%`);
}
async function counts(page, a, b) {
  await expect(page.locator('#words-a')).toHaveText(a.toLocaleString('en-US'));
  await expect(page.locator('#words-b')).toHaveText(b.toLocaleString('en-US'));
}
async function words(page, side, same, different) {
  await expect(page.locator(`#result-${side} .same`)).toHaveText(same);
  await expect(page.locator(`#result-${side} .different`)).toHaveText(different);
}
async function cleared(page) {
  for (const id of ['similarity', 'words-a', 'words-b']) await expect(page.locator(`#${id}`)).toHaveText('—');
  await expect(page.locator('#accuracy')).toHaveText('— / —');
  await expect(page.locator('.result span')).toHaveCount(0);
  await expect(page.locator('#result-a')).toContainText('results will appear here');
  await expect(page.locator('#result-b')).toContainText('results will appear here');
}
// Literal expectations come from test-cases.md, independently of the comparison engine.
const examples = [
  [1, 'Identical text', 'The cat sat', 'The cat sat', [100, 100, 100], [3, 3], [['The', 'cat', 'sat'], []], [['The', 'cat', 'sat'], []]],
  [2, 'Completely different', 'cat dog', 'sun moon', [0, 0, 0], [2, 2], [[], ['cat', 'dog']], [[], ['sun', 'moon']]],
  [3, 'One replacement', 'the cat sat', 'the dog sat', [66.7, 66.7, 66.7], [3, 3], [['the', 'sat'], ['cat']], [['the', 'sat'], ['dog']]],
  [4, 'Added word', 'one two', 'one two three', [80, 50, 66.7], [2, 3], [['one', 'two'], []], [['one', 'two'], ['three']]],
  [5, 'Deleted word', 'one two three', 'one two', [80, 66.7, 50], [3, 2], [['one', 'two'], ['three']], [['one', 'two'], []]],
];

test.beforeEach(async ({ page }) => { await page.goto(appURL); });
for (const [id, title, a, b, metrics, totals, wa, wb] of examples) {
  test(`${id}. ${title}`, async ({ page }) => {
    await compare(page, a, b);
    await scores(page, ...metrics);
    await counts(page, ...totals);
    await words(page, 'a', ...wa);
    await words(page, 'b', ...wb);
  });
}
test('6. Reordered words', async ({ page }) => {
  await compare(page, 'a b', 'b a');
  await scores(page, 50, 0, 0);
  for (const side of ['a', 'b']) {
    await expect(page.locator(`#result-${side} .same`)).toHaveCount(1);
    await expect(page.locator(`#result-${side} .different`)).toHaveCount(1);
  }
  expect(await page.locator('#result-a .same').textContent()).toBe(await page.locator('#result-b .same').textContent());
});
test('7. Repeated words', async ({ page }) => {
  await compare(page, 'go go stop', 'go stop');
  await scores(page, 80, 66.7, 50);
  await words(page, 'a', ['go', 'stop'], ['go']);
  await words(page, 'b', ['go', 'stop'], []);
});
for (const [id, title, a, b, option] of [
  [8, 'Case sensitivity', 'Hello WORLD', 'hello world', 'ignoreCase'],
  [9, 'Punctuation sensitivity', 'Hello, world!', 'Hello world', 'ignorePunctuation'],
]) test(`${id}. ${title}`, async ({ page }) => {
  await compare(page, a, b);
  await scores(page, 0);
  await compare(page, a, b, { [option]: true });
  await scores(page, 100);
  await words(page, 'a', a.split(' '), []);
  await words(page, 'b', b.split(' '), []);
});
test('10. Both ignore options', async ({ page }) => {
  for (const options of [{ ignoreCase: true }, { ignorePunctuation: true }, { ignoreCase: true, ignorePunctuation: true }]) {
    await compare(page, 'HELLO, World!', 'hello world', options);
    await scores(page, options.ignoreCase && options.ignorePunctuation ? 100 : 0);
  }
});
test('11. Punctuation-only token', async ({ page }) => {
  await compare(page, 'hello ...', 'hello', { ignorePunctuation: true });
  await scores(page, 100);
  await counts(page, 2, 1);
  await words(page, 'a', ['hello'], []);
  expect(await page.locator('#result-a').textContent()).toBe('hello ...');
  await expect(page.locator('#result-a span')).toHaveCount(1);
});
test('12. Symbols stay significant', async ({ page }) => {
  await compare(page, '$', '+', { ignorePunctuation: true });
  await scores(page, 0);
  await words(page, 'a', [], ['$']);
  await words(page, 'b', [], ['+']);
});
test('13. Both inputs empty', async ({ page }) => {
  await compare(page, '', '');
  await scores(page, 100);
  await counts(page, 0, 0);
  for (const side of ['a', 'b']) await expect(page.locator(`#result-${side}`)).toHaveText('This text is empty.');
});
test('14. One input empty, both directions', async ({ page }) => {
  for (const [a, b] of [['', 'hello'], ['hello', '']]) {
    await compare(page, a, b);
    await scores(page, 0);
    await counts(page, a ? 1 : 0, b ? 1 : 0);
    await expect(page.locator(`#result-${a ? 'b' : 'a'}`)).toHaveText('This text is empty.');
    await words(page, a ? 'a' : 'b', [], ['hello']);
  }
});
test('15. Whitespace differences', async ({ page }) => {
  const a = 'one two', b = '  one\ttwo\n';
  await compare(page, a, b);
  await scores(page, 100);
  await counts(page, 2, 2);
  expect(await page.locator('#result-a').textContent()).toBe(a);
  expect(await page.locator('#result-b').textContent()).toBe(b);
  await expect(page.locator('#result-b')).toHaveCSS('white-space', 'pre-wrap');
});
for (const side of ['a', 'b']) {
  test(`16. Live character tracking (${side})`, async ({ page }) => {
    await page.locator(`#text-${side}`).pressSequentially('Hello!');
    await expect(page.locator(`#count-${side}`)).toHaveText('6 / 10,000');
    await page.keyboard.press('Backspace');
    await expect(page.locator(`#count-${side}`)).toHaveText('5 / 10,000');
  });
  test(`17. Character limit (${side})`, async ({ page }) => {
    const input = page.locator(`#text-${side}`);
    await input.focus();
    // insertText exercises browser text insertion used by paste/IME, without OS clipboard dependencies.
    await page.keyboard.insertText('x'.repeat(10000));
    await input.press('End');
    await page.keyboard.type('y');
    await page.keyboard.insertText('extra text');
    await expect(input).toHaveValue('x'.repeat(10000));
    await expect(page.locator(`#count-${side}`)).toHaveText('10,000 / 10,000');
    await input.fill('');
    await page.keyboard.insertText('z'.repeat(10001));
    await expect(input).toHaveValue('z'.repeat(10000));
    await expect(page.locator(`#count-${side}`)).toHaveText('10,000 / 10,000');
  });
}
test('18. Maximum-size comparison', async ({ page }) => {
  const errors = [];
  page.on('pageerror', error => errors.push(error.message));
  await compare(page, 'a '.repeat(5000), 'b '.repeat(5000));
  await counts(page, 5000, 5000);
  await scores(page, 0);
  for (const side of ['a', 'b']) {
    await expect(page.locator(`#result-${side} .different`)).toHaveCount(5000);
    await expect(page.locator(`#result-${side} .same`)).toHaveCount(0);
  }
  expect(errors).toEqual([]);
});
for (const control of ['text-a', 'text-b', 'ignore-case', 'ignore-punctuation']) {
  test(`19. Stale results (${control})`, async ({ page }) => {
    await compare(page, 'hello', 'hello');
    if (control.startsWith('text')) await page.locator(`#${control}`).fill('changed');
    else await page.locator(`#${control}`).check();
    await cleared(page);
    await expect(page.getByRole('status')).toContainText('Select Compare texts');
  });
}
test('20. Reset preserves Red Suit mode', async ({ page }) => {
  await compare(page, 'HELLO!', 'hello', { ignoreCase: true, ignorePunctuation: true });
  await page.locator('#theme').click();
  await page.getByRole('button', { name: 'Reset', exact: true }).click();
  for (const side of ['a', 'b']) {
    await expect(page.locator(`#text-${side}`)).toHaveValue('');
    await expect(page.locator(`#count-${side}`)).toHaveText('0 / 10,000');
  }
  await expect(page.locator('#ignore-case')).not.toBeChecked();
  await expect(page.locator('#ignore-punctuation')).not.toBeChecked();
  await cleared(page);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-suit');
  await expect(page.locator('#theme')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('status')).toHaveText('Add your texts, then select Compare texts.');
});
test('21. Theme toggle preserves content and glass styling', async ({ page }) => {
  await page.emulateMedia({ colorScheme: 'dark' });
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
  await expect(page.locator('#theme')).toHaveText('◈ Red Suit');
  await page.locator('#text-a').fill('cat dog');
  await page.locator('#theme').click();
  await expect(page.locator('#text-a')).toHaveValue('cat dog');
  await cleared(page);
  await compare(page, 'cat dog', 'cat sun');
  for (const theme of ['light', 'red-suit']) {
    await page.locator('#theme').click();
    await expect(page.locator('html')).toHaveAttribute('data-theme', theme);
    await expect(page.locator('#theme')).toHaveText(theme === 'light' ? '◈ Red Suit' : '☀ Light');
    await scores(page, 50);
    await expect(page.locator('#text-a')).toHaveValue('cat dog');
    await expect(page.locator('#text-b')).toHaveValue('cat sun');
    await words(page, 'a', ['cat'], ['dog']);
    await words(page, 'b', ['cat'], ['sun']);
    const style = await page.locator('.workspace').evaluate(el => {
      const css = getComputedStyle(el);
      return { background: css.backgroundColor, blur: css.backdropFilter, shadow: css.boxShadow };
    });
    expect(style.background).toMatch(/^rgba\(/);
    expect(style.blur).toContain('blur(');
    expect(style.shadow).not.toBe('none');
    for (const kind of ['same', 'different']) {
      const colors = await page.locator(`#result-a .${kind}`).evaluate(el => {
        const css = getComputedStyle(el);
        return [css.color, css.backgroundColor].map(c => c.match(/[\d.]+/g).slice(0, 3).map(Number));
      });
      const luminance = rgb => rgb.map(v => v / 255).map(v => v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [0.2126, 0.7152, 0.0722][i], 0);
      const [a, b] = colors.map(luminance).sort((a, b) => b - a);
      expect((a + 0.05) / (b + 0.05)).toBeGreaterThanOrEqual(4.5);
    }
    await page.screenshot({ path: test.info().outputPath(`theme-${theme}.png`), fullPage: true });
  }
});
test('22. Safe text rendering', async ({ page }) => {
  const dialogs = [], requests = [], errors = [];
  page.on('dialog', async dialog => { dialogs.push(dialog.message()); await dialog.dismiss(); });
  page.on('request', request => requests.push(request.url()));
  page.on('pageerror', error => errors.push(error.message));
  const payload = '<img src=x onerror=alert(1)>';
  await compare(page, payload, payload);
  for (const side of ['a', 'b']) expect(await page.locator(`#result-${side}`).textContent()).toBe(payload);
  await expect(page.locator('.result img, .result script')).toHaveCount(0);
  expect(dialogs).toEqual([]);
  expect(requests).toEqual([]);
  expect(errors).toEqual([]);
});
test('23. Offline file use', async ({ page, context, browserName }) => {
  const network = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) network.push(request.url()); });
  // WebKit's offline emulation blocks file: navigation too. Block all network
  // requests during loading there, then enable offline emulation for interactions.
  await context.route(/^https?:/, route => route.abort('internetdisconnected'));
  if (browserName !== 'webkit') await context.setOffline(true);
  await page.goto(appURL);
  await context.setOffline(true);
  await compare(page, 'HELLO!', 'hello', { ignoreCase: true, ignorePunctuation: true });
  await scores(page, 100);
  await words(page, 'a', ['HELLO!'], []);
  await page.locator('#theme').click();
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-suit');
  await page.locator('summary').click();
  await expect(page.locator('details')).toHaveAttribute('open', '');
  await page.locator('#reset').click();
  await cleared(page);
  expect(network).toEqual([]);
});
test('24. Narrow screen and long words', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 812 });
  await compare(page, 'a'.repeat(10000), 'b'.repeat(10000));
  for (const selector of ['.workspace .columns', '.results .columns']) {
    const boxes = await page.locator(`${selector} > div`).evaluateAll(els => els.map(el => {
      const r = el.getBoundingClientRect();
      return { top: r.top, bottom: r.bottom, left: r.left };
    }));
    expect(boxes[1].top).toBeGreaterThanOrEqual(boxes[0].bottom);
    expect(boxes[1].left).toBe(boxes[0].left);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
  for (const side of ['a', 'b']) {
    expect(await page.locator(`#result-${side}`).evaluate(el => el.scrollWidth <= el.clientWidth)).toBe(true);
    await expect(page.locator(`#result-${side}`)).toHaveCSS('overflow-wrap', 'anywhere');
  }
  await page.screenshot({ path: test.info().outputPath('mobile.png'), fullPage: true });
});
test('25. Keyboard accessibility', async ({ page, browserName }) => {
  // macOS WebKit uses Option+Tab to include buttons and other non-text controls.
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  const controls = ['#theme', '[data-language=en]', '[data-language=de]', '#text-a', '#text-b', '#ignore-case', '#ignore-punctuation', '#reset', '#compare', 'summary'];
  for (const selector of controls) {
    await page.keyboard.press(tab);
    const control = page.locator(selector);
    await expect(control).toBeFocused();
    await expect(control).toHaveCSS('outline-style', 'solid');
    await expect(control).toHaveCSS('outline-width', '3px');
    if (selector === '#theme') await page.keyboard.press('Enter');
    if (selector === '#text-a') await page.keyboard.type('HELLO, cat');
    if (selector === '#text-b') await page.keyboard.type('hello dog');
    if (selector.startsWith('#ignore-')) { await page.keyboard.press('Space'); await expect(control).toBeChecked(); }
    if (selector === '#compare') await page.keyboard.press('Enter');
    if (selector === 'summary') await page.keyboard.press('Enter');
  }
  await scores(page, 50);
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-suit');
  await expect(page.locator('details')).toHaveAttribute('open', '');
  for (const side of ['a', 'b']) {
    await expect(page.locator(`#result-${side} .different`)).toHaveCSS('text-decoration-style', 'dotted');
    await expect(page.locator(`#result-${side} .different`)).toHaveCSS('text-decoration-line', 'underline');
  }
  await page.keyboard.press(`Shift+${tab}`);
  await page.keyboard.press(`Shift+${tab}`);
  await expect(page.locator('#reset')).toBeFocused();
  await page.keyboard.press('Enter');
  await cleared(page);
  await expect(page.locator('#text-a')).toBeFocused();
});
test('Swap consistency across representative comparisons', async ({ page }) => {
  const pairs = examples.map(row => [row[2], row[3], {}]).concat([
    ['a b', 'b a', {}], ['go go stop', 'go stop', {}], ['', 'hello', {}], ['', '', {}],
    ['HELLO, World!', 'hello world', { ignoreCase: true, ignorePunctuation: true }],
    ['hello ...', 'hello', { ignorePunctuation: true }],
  ]);
  async function snapshot() {
    return { similarity: await page.locator('#similarity').textContent(),
      counts: await page.locator('#words-a, #words-b').allTextContents(),
      accuracies: (await page.locator('#accuracy').textContent()).split(' / ') };
  }
  for (const [a, b, options] of pairs) {
    await compare(page, a, b, options);
    const before = await snapshot();
    await compare(page, b, a, options);
    const after = await snapshot();
    expect(after.similarity).toBe(before.similarity);
    expect(after.counts).toEqual(before.counts.reverse());
    expect(after.accuracies).toEqual(before.accuracies.reverse());
  }
});
