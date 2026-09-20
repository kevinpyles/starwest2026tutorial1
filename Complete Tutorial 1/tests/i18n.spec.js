const { test, expect } = require('@playwright/test');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const appURL = pathToFileURL(path.resolve(__dirname, '../index.html')).href;
const german = page => page.getByRole('button', { name: 'Deutsch', exact: true }).click();
const english = page => page.getByRole('button', { name: 'English', exact: true }).click();
test.beforeEach(async ({ page }) => { await page.goto(appURL); });

test('German translates all marked copy, accessible labels, and initial states offline', async ({ page, context }) => {
  const requests = [];
  page.on('request', request => { if (/^https?:/.test(request.url())) requests.push(request.url()); });
  await context.setOffline(true);
  await german(page);
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page).toHaveTitle('Comparinator · Textvergleich');
  await expect(page.getByRole('group', { name: 'Sprache' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Deutsch', exact: true })).toHaveAttribute('aria-pressed', 'true');
  await expect(page.getByRole('button', { name: 'English', exact: true })).toHaveAttribute('aria-pressed', 'false');
  await expect(page.locator('#theme')).toHaveText('◈ Roter Anzug');
  await expect(page.locator('#text-a')).toHaveAttribute('placeholder', 'Ersten Text hier einfügen oder eingeben …');
  await expect(page.locator('#count-a')).toHaveText('0 / 10.000');
  await expect(page.locator('#result-a')).toHaveText('Hier erscheinen die Ergebnisse für deinen ersten Text.');
  await expect(page.locator('#result-b')).toHaveAttribute('aria-label', 'Vergleich von Text B');
  await page.locator('summary').click();
  await expect(page.locator('details')).toContainText('Die Genauigkeit berücksichtigt');
  // Guard catalog completeness without relying solely on selected visible labels.
  const missing = await page.evaluate(() => {
    const issues = [];
    for (const lang of ['en', 'de']) {
      for (const key of Object.keys(messages.en)) if (!messages[lang][key]) issues.push(`${lang}:${key}`);
    }
    document.querySelectorAll('[data-i18n]').forEach(el => {
      if (!messages.de[el.dataset.i18n] || el.textContent !== messages.de[el.dataset.i18n]) issues.push(el.dataset.i18n);
    });
    return issues;
  });
  expect(missing).toEqual([]);
  expect(requests).toEqual([]);
});

test('Language switching preserves source text, settings, results, and theme', async ({ page }) => {
  await page.locator('#text-a').fill('Hallo, schöne Welt!');
  await page.locator('#text-b').fill('hallo schöne Erde');
  await page.locator('#ignore-case').check();
  await page.locator('#ignore-punctuation').check();
  await page.locator('#compare').click();
  await page.locator('#theme').click();
  const source = await page.locator('#result-a').textContent();
  await german(page);
  await expect(page.locator('#text-a')).toHaveValue('Hallo, schöne Welt!');
  await expect(page.locator('#result-a')).toHaveText(source);
  await expect(page.locator('#result-a .same')).toHaveText(['Hallo,', 'schöne']);
  await expect(page.locator('#result-a .different')).toHaveText(['Welt!']);
  await expect(page.locator('#similarity')).toHaveText('66,7 %');
  await expect(page.locator('#accuracy')).toHaveText('66,7 % / 66,7 %');
  await expect(page.locator('#status')).toHaveText('Vergleich abgeschlossen. 2 übereinstimmende Wörter in gleicher Reihenfolge · 1 Wortänderung.');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-suit');
  await expect(page.locator('#theme')).toHaveText('☀ Hell');
  await expect(page.locator('#ignore-case')).toBeChecked();
  await expect(page.locator('#ignore-punctuation')).toBeChecked();
  await english(page);
  await expect(page.locator('#similarity')).toHaveText('66.7%');
  await expect(page.locator('#status')).toHaveText('Comparison complete. 2 matching words in sequence · 1 word edit.');
  await expect(page.locator('#result-a')).toHaveText(source);
});

test('German live messages, empty results, safe rendering, and Reset', async ({ page }) => {
  await german(page);
  await page.locator('#compare').click();
  await expect(page.locator('#result-a')).toHaveText('Dieser Text ist leer.');
  await expect(page.locator('#similarity')).toHaveText('100,0 %');
  await page.locator('#text-a').fill('<img src=x onerror=alert(1)>');
  await expect(page.locator('#status')).toContainText('Text geändert.');
  await page.locator('#ignore-case').check();
  await expect(page.locator('#status')).toContainText('Optionen geändert.');
  await english(page);
  await expect(page.locator('#status')).toContainText('Options changed.');
  await german(page);
  await page.locator('#compare').click();
  await expect(page.locator('#result-a')).toHaveText('<img src=x onerror=alert(1)>');
  await expect(page.locator('.result img')).toHaveCount(0);
  await page.locator('#theme').click();
  await page.locator('#reset').click();
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'red-suit');
  await expect(page.locator('#text-a')).toHaveValue('');
  await expect(page.locator('#text-a')).toBeFocused();
  await expect(page.locator('#ignore-case')).not.toBeChecked();
  await expect(page.locator('#status')).toHaveText('Füge deine Texte ein und wähle dann „Texte vergleichen“.');
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('html')).toHaveAttribute('data-theme', 'light');
});

test('German counts and singular/plural messages', async ({ page }) => {
  await german(page);
  await page.locator('#text-a').fill('a '.repeat(1000));
  await page.locator('#text-b').fill('a '.repeat(1000));
  await expect(page.locator('#count-a')).toHaveText('2.000 / 10.000');
  await page.locator('#compare').click();
  await expect(page.locator('#words-a')).toHaveText('1.000');
  await expect(page.locator('#status')).toContainText('1.000 übereinstimmende Wörter');
  await page.locator('#text-a').fill('eins zwei drei');
  await page.locator('#text-b').fill('eins vier fünf');
  await page.locator('#compare').click();
  await expect(page.locator('#status')).toHaveText('Vergleich abgeschlossen. 1 übereinstimmendes Wort in gleicher Reihenfolge · 2 Wortänderungen.');
});

test('Language buttons work from the keyboard', async ({ page, browserName }) => {
  const tab = browserName === 'webkit' && process.platform === 'darwin' ? 'Alt+Tab' : 'Tab';
  await page.keyboard.press(tab);
  await page.keyboard.press(tab);
  await expect(page.getByRole('button', { name: 'English', exact: true })).toBeFocused();
  await page.keyboard.press(tab);
  const button = page.getByRole('button', { name: 'Deutsch', exact: true });
  await expect(button).toBeFocused();
  await expect(button).toHaveCSS('outline-width', '3px');
  await page.keyboard.press('Enter');
  await expect(page.locator('html')).toHaveAttribute('lang', 'de');
  await expect(button).toBeFocused();
});

test('German layout fits narrow screens in both themes', async ({ page }) => {
  await german(page);
  await page.locator('#text-a').fill('Hallo Welt');
  await page.locator('#text-b').fill('Hallo Welt');
  await page.locator('#compare').click();
  for (const width of [320, 375, 768, 1280]) {
    await page.setViewportSize({ width, height: 900 });
    for (const theme of ['light', 'red-suit']) {
      if (await page.locator('html').getAttribute('data-theme') !== theme) await page.locator('#theme').click();
      expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
      await expect(page.getByRole('button', { name: 'Deutsch', exact: true })).toBeVisible();
      await expect(page.locator('#compare')).toBeVisible();
      if (width === 375 || width === 1280) await page.screenshot({ path: test.info().outputPath(`de-${theme}-${width}.png`), fullPage: true });
    }
  }
});
