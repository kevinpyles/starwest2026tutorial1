# Comparinator

Open `index.html` in a modern browser. No install, internet connection, or server is needed. All processing happens locally.

Enter two texts (up to 10,000 characters each), select optional ignore settings, and click **Compare texts**. Matching words appear green; differences appear red with dotted underlines. Each results box preserves its own input. Expand **How are the scores calculated?** for metric definitions.

Reset clears inputs, options, and results while retaining the theme.

See `requirements.md` for the full specification. Run `node compare.test.js` to check the comparison engine if Node.js is available; Node.js is not needed to use the app.

## Automated browser tests

Install Node.js, then install the test dependencies and browsers:

```sh
npm ci
npx playwright install chromium firefox webkit
```

Run the JavaScript Playwright suite:

```sh
npm test
npm run test:unit
```

The suite maps to all 25 numbered cases in `test-cases.md` plus swap consistency. It runs 31 tests per browser (Chromium, Firefox, WebKit), opening the local `index.html` directly; no web server is required. Dependencies and browser downloads need internet access during setup; the app's offline behavior is tested separately with browser networking disabled.

Use `npm test -- --project=chromium` for one browser, `npm run test:headed` to watch, and `npm run test:report` to view the HTML report. Failure screenshots and traces are saved in `test-results/`. Theme and mobile screenshots are also saved there for visual review.

Appearance checks verify translucent panels, blur, shadows, highlighted-text contrast, focus outlines, and layout geometry. Screenshots support further subjective visual review; these checks are not a complete accessibility audit. Character-limit checks use Playwright's browser text insertion to simulate paste/IME input without requiring the operating-system clipboard.

## HTML test report

Every `npm test` run automatically regenerates [the HTML report](playwright-report/index.html), even when tests fail. New tests added to the suite appear automatically. The report includes pass/fail totals, browser projects, test durations, failure details, and available attachments such as failure screenshots and traces.

To update it with a complete run and then view it:

```sh
npm test
npm run test:report
```

The second command serves the report locally and opens it in your browser; stop the server with Ctrl+C. If it is already open when a test run finishes, refresh the page to see the updated results.

Every completed browser test run also saves a permanent copy of its HTML report and linked attachments in `test-history/<timestamp>-<unique-id>/`. Open [test history](test-history/index.html) to browse runs by UTC timestamp, status, counts, duration, and browser/command scope. Each row links to that run’s full report. An existing latest report is preserved on the first run after enabling history, marked as imported without summary counts.

The latest report is still replaced each run. A filtered run is archived separately and shows only the selected tests; use `npm test` for a complete run. Failed runs are archived too, provided Playwright finishes writing its report. Force-killed processes cannot guarantee an archive. Keep test runs sequential because Playwright’s latest-report and test-results folders are shared.

History is retained locally without automatic deletion and is excluded from Git. Back up or share the entire `test-history/` folder to retain all historical reports and attachments. You may delete individual run folders when no longer needed; the history index is rebuilt on the next run. Unit checks run separately with `npm run test:unit` and are not included. Run `npm run test:history` to verify archive preservation and index generation. To serve history locally (useful for report attachments), run `python3 -m http.server 9324 --bind 127.0.0.1` from this directory and visit `http://127.0.0.1:9324/test-history/`.

On macOS, the WebKit keyboard test uses Option+Tab to include all native controls. WebKit's offline emulation rejects local-file navigation, so its offline test blocks every HTTP(S) request while opening the file, then enables offline emulation before exercising the app. Chromium and Firefox enable offline emulation before opening the file.

## Brand and style guide

Open [style-guide.html](style-guide.html) directly in a browser for the standalone Comparinator brand guide. It starts in Light mode, with a **Red Suit** dark theme. The page includes original vector imagery, branding rules, color and typography tokens, interactive components, and a working text-comparison demo. Use **Download theme CSS** to export the tokens and component styles for future projects. The file embeds all styles, scripts, and artwork and requires no network or build step. Its comparison engine is a snapshot of `compare.js`; keep it synchronized if comparison behavior changes.

The app at `index.html` applies this design system, starting in Light mode with a Red Suit dark theme. Theme selection lasts for the current page session; Reset preserves it.

## Interface languages

Use the flag buttons in the top-right header to switch between English (EN / UK flag) and German (DE / German flag). Both buttons have native-language accessible names. English is the default on each page load. The selection lasts for the current page session; Reset preserves both language and theme. Switching languages preserves input, options, and current results. German uses localized number formatting and translates Red Suit as **Roter Anzug**. User-provided text is never translated, stored, or sent anywhere.

`i18n.js` contains the English and German UI catalogs. Static text uses `data-i18n` attributes; `app.js` translates live messages and formats numbers using `Intl.NumberFormat`. Add corresponding keys in both catalogs when adding UI copy. The standalone style guide remains an English reference document. Language regression checks are included in `npm test`.

## Release quality agent

[Comparinator-quality-agent](.codex/agents/Comparinator-quality-agent.toml) assesses whether a specific change has sufficient evidence for release. Ask Codex:

> Use Comparinator-quality-agent to assess this change for release against the previous release. Identify the candidate and baseline, investigate material risks, run appropriate checks, and return a readiness verdict.

Provide a baseline revision or previous version when available. The agent selects relevant skills (including `translation-testing` for I18N), adapts testing to discoveries, and tracks evidence and unknowns. It returns **Ready**, **Ready with known risk**, **Not ready**, or **Insufficient evidence**, with a rationale. Passing tests alone never establish readiness. Assessments are saved under `quality-reports/` when writable; the agent does not deploy or publish the app.
