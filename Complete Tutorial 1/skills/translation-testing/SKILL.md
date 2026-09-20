---
name: translation-testing
description: Test Comparinator internationalization (I18N) and English/German translations, including catalog coverage, localized UI and numbers, language switching, accessibility, and layout. Use for translation regression testing or adding I18N test coverage.
---

# Translation testing

Test the actual interface and report reproducible failures, distinguishing functional localization checks from linguistic review. Run commands from the target Comparinator project root, not this skill's directory. If the current workspace is another application, discover its locale contract and test runner before adapting this workflow.

## Establish coverage

Read `requirements.md` (Interface languages), `README.md`, `i18n.js`, `app.js`, `index.html`, `tests/i18n.spec.js`, and `playwright.config.js`. Recheck supported locales and intended behavior rather than assuming they never change.

Current contract:

- English and Light are selected on every page load. German and Red Suit are available. Reset preserves language and theme, clears inputs/options/results, and focuses Text A.
- Switching languages preserves both source texts, comparison results and highlights, ignore options, and theme. Numbers and surrounding interface text change locale; user text never does.
- All processing is local. Language selection is session-only; no remote translation service or persistence is required.
- The standalone `style-guide.html` remains English. Brand names, EN/DE, native language button names, and shared terms such as “Text A” are not automatically untranslated-copy defects.

## Run the baseline

Use the existing JavaScript Playwright suite and installed dependencies:

```sh
npm test -- tests/i18n.spec.js
```

This runs the configured Chromium, Firefox, and WebKit projects. For a requested quick check, use `npm test -- tests/i18n.spec.js --project=chromium` and label coverage as Chromium only. Run browser commands sequentially: the latest report and test-results folders are shared. Read failures and attachments before retrying; do not retry simply to obtain a passing run.

If setup is missing, use the project's documented `npm ci` and `npx playwright install chromium firefox webkit` setup, subject to environment permissions. Report missing browsers or blocked execution as untested, not a product failure or pass. No server is needed; tests open `index.html` through `pathToFileURL`.

## Check coverage gaps

Existing tests are a baseline, not evidence that every item below is covered. For a test request, run the suite and perform relevant extra checks with disposable probes where practical. When asked to add or maintain automated coverage, extend `tests/i18n.spec.js` with meaningful assertions. Do not change application behavior or translations solely to make tests pass unless fixing them is within the user's request.

### Catalog and rendered copy

- Compare each supported locale's keys to English in both directions. Flag missing keys, unexpected keys, empty/non-string values, and mismatched interpolation placeholder names (especially `{matches}`, `{words}`, `{edits}`, `{changes}`).
- Check keys referenced by `data-i18n`, `data-i18n-aria-label`, and `data-i18n-placeholder`, plus dynamic keys in `app.js`. Browser evaluation can access the top-level lexical `messages` binding; it is not necessarily `window.messages`.
- Inspect visible and accessible copy beyond marked elements so hardcoded untranslated additions are detected. Include title, document `lang`, language group, both placeholders, result labels, help text, theme toggle, and live status messages.
- Exercise initial, text-changed, options-changed, completed, reset, both-empty, and one-empty states in both languages, including switching languages while each state is active.
- Check interpolation renders values without unresolved tokens or `undefined`. Test zero, one, and multiple matching words and edits. Catalog equality proves wiring only; independently review representative wording and grammar. Report uncertain translation quality as needing fluent review.

### Numbers and state preservation

- Check thousands separators in input character counters, result word counts, and completion messages; check decimal separators, percentage precision, and percent spacing in similarity and both accuracy scores.
- Use independent fixtures: `Hallo, schöne Welt!` versus `hallo schöne Erde` with both ignore options enabled yields two matches, one edit, and approximately 66.7% for similarity and both accuracies. English displays `66.7%`; German displays `66,7 %` (the formatter may use a nonbreaking space).
- For grouping, `'a '.repeat(1000)` contains 2,000 JavaScript string code units and 1,000 words. German counters should show `2.000 / 10.000`, and the result word count `1.000`. Inspect code points if spacing is at issue; do not erase all whitespace differences indiscriminately.
- Switch EN → DE → EN before and after comparison, with each theme and ignore option. Compare both input values, each result's original text and highlight classes, settings, and numeric meaning across switches.
- Include umlauts, ß, accented/combining characters, emoji, and literal markup to check source preservation and safe rendering. Use the documented whitespace-based comparison semantics; do not assume locale-aware segmentation or Unicode normalization. The current character limit counts JavaScript string length, not graphemes.

### Interaction, layout, and offline behavior

- Check keyboard access, visible focus, selected button `aria-pressed`, native-language accessible names, translated labels, and `role="status"`. On macOS WebKit, the existing suite uses `Alt+Tab` to reach native controls.
- Inspect both languages and themes at widths 320, 375, 768, and 1280. Check German labels/help for clipping, overlap, inaccessible controls, and horizontal overflow. A page-width assertion alone does not prove visual correctness; review screenshots where tooling permits and disclose unreviewed visuals.
- Observe HTTP(S) requests from before navigation through language switching and comparison; fail unexpected external requests. WebKit cannot reliably navigate local files while already offline: block HTTP(S) before navigation, then enable offline mode after the file loads. Other browsers can enable offline mode first. Attaching a listener only after navigation does not test initial-load networking.
- Verify Reset preserves the selected language/theme and reload restores English/Light. Do not infer a persistence requirement from typical I18N conventions.

Only extend to RTL, date/currency formatting, or additional locales if the application supports them or the user requests that scope.

## Report results

Summarize commands executed, browsers/locales covered, pass/fail/skip counts, and coverage gaps. For defects, include locale, browser, steps, expected versus actual behavior, and relevant file or evidence paths. Separate confirmed failures, infrastructure blockers, and subjective linguistic concerns.

Link available `playwright-report/index.html`, the specific archived run under `test-history/`, and useful screenshots/traces under `test-results/`. Filtered reports cover only selected tests; never describe an I18N-only run as the full app suite. If regression tests were changed, run the focused suite; broaden to `npm test` when shared behavior or application code changed.
