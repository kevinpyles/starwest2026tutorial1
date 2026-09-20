const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir: './tests',
  fullyParallel: true,
  workers: 3,
  timeout: 30000,
  // Regenerated after every run, including runs with failing tests.
  reporter: [['list'], ['html', { outputFolder: 'playwright-report', open: 'never' }], ['./scripts/history-reporter.js']],
  use: { headless: true, colorScheme: 'light', viewport: { width: 1280, height: 900 }, screenshot: 'only-on-failure', trace: 'retain-on-failure' },
  projects: ['chromium', 'firefox', 'webkit'].map(browserName => ({ name: browserName, use: { browserName } })),
});
