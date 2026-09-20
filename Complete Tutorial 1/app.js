'use strict';
const byId = id => document.getElementById(id);
const inputA = byId('text-a'), inputB = byId('text-b');
const ignoreCase = byId('ignore-case'), ignorePunctuation = byId('ignore-punctuation');
const statIds = ['similarity', 'words-a', 'words-b', 'accuracy'];
let language = 'en';
let lastResult = null;
let statusKey = 'initial';
const locale = () => language === 'de' ? 'de-DE' : 'en-US';
const number = value => value.toLocaleString(locale());
const percent = value => new Intl.NumberFormat(locale(), {
  style: 'percent', minimumFractionDigits: 1, maximumFractionDigits: 1,
}).format(value / 100);
function t(key, values = {}) {
  return messages[language][key].replace(/\{(\w+)\}/g, (_, name) => values[name] ?? `{${name}}`);
}
function clearResults(message = 'initial') {
  lastResult = null;
  statusKey = message;
  displayResults();
}
function updateCounts() {
  [inputA, inputB].forEach((input, index) => {
    // Also enforce the limit for input methods that bypass native maxlength.
    if (input.value.length > 10000) input.value = input.value.slice(0, 10000);
    byId(`count-${index ? 'b' : 'a'}`).textContent = `${number(input.value.length)} / ${number(10000)}`;
  });
}
function render(side, data, matches) {
  const box = byId(`result-${side}`);
  box.replaceChildren();
  box.classList.toggle('empty', data.parts.length === 0);
  if (!data.parts.length) { box.textContent = t('emptyText'); return; }
  const comparable = new Set(data.words.map(word => word.part));
  const fragment = document.createDocumentFragment();
  data.parts.forEach((part, index) => {
    if (!comparable.has(index)) fragment.append(document.createTextNode(part));
    else {
      const span = document.createElement('span');
      span.className = matches.has(index) ? 'same' : 'different';
      span.textContent = part;
      fragment.append(span);
    }
  });
  box.append(fragment);
}
function displayResults() {
  if (!lastResult) {
    statIds.forEach(id => { byId(id).textContent = id === 'accuracy' ? '— / —' : '—'; });
    ['a', 'b'].forEach(side => {
      const box = byId(`result-${side}`);
      box.classList.add('empty');
      box.textContent = t(side === 'a' ? 'emptyA' : 'emptyB');
    });
    byId('status').textContent = t(statusKey);
    return;
  }
  const result = lastResult;
  byId('similarity').textContent = percent(result.similarity);
  byId('words-a').textContent = number(result.A.wordCount);
  byId('words-b').textContent = number(result.B.wordCount);
  byId('accuracy').textContent = `${percent(result.accuracyA)} / ${percent(result.accuracyB)}`;
  render('a', result.A, result.matchedA);
  render('b', result.B, result.matchedB);
  byId('status').textContent = t('complete', {
    matches: number(result.matches), words: t(result.matches === 1 ? 'wordOne' : 'wordMany'),
    edits: number(result.distance), changes: t(result.distance === 1 ? 'editOne' : 'editMany'),
  });
}
function setTheme(dark) {
  document.documentElement.dataset.theme = dark ? 'red-suit' : 'light';
  byId('theme').setAttribute('aria-pressed', String(dark));
  byId('theme').textContent = t(dark ? 'themeLight' : 'themeDark');
}
function setLanguage(nextLanguage) {
  if (!Object.hasOwn(messages, nextLanguage)) return;
  language = nextLanguage;
  document.documentElement.lang = language;
  document.title = t('title');
  document.querySelectorAll('[data-i18n]').forEach(element => {
    element.textContent = t(element.dataset.i18n);
  });
  for (const attribute of ['aria-label', 'placeholder']) {
    document.querySelectorAll(`[data-i18n-${attribute}]`).forEach(element => {
      element.setAttribute(attribute, t(element.getAttribute(`data-i18n-${attribute}`)));
    });
  }
  document.querySelectorAll('[data-language]').forEach(button => {
    button.setAttribute('aria-pressed', String(button.dataset.language === language));
  });
  setTheme(document.documentElement.dataset.theme === 'red-suit');
  updateCounts();
  displayResults();
}
[inputA, inputB].forEach(input => input.addEventListener('input', () => {
  updateCounts();
  clearResults('textChanged');
}));
[ignoreCase, ignorePunctuation].forEach(input => input.addEventListener('change', () => {
  clearResults('optionsChanged');
}));
byId('compare').addEventListener('click', () => {
  updateCounts();
  lastResult = compareTexts(inputA.value, inputB.value, { ignoreCase: ignoreCase.checked, ignorePunctuation: ignorePunctuation.checked });
  displayResults();
});
byId('reset').addEventListener('click', () => {
  inputA.value = ''; inputB.value = '';
  ignoreCase.checked = false; ignorePunctuation.checked = false;
  updateCounts(); clearResults(); inputA.focus();
});
byId('theme').addEventListener('click', () => setTheme(document.documentElement.dataset.theme !== 'red-suit'));
document.querySelectorAll('[data-language]').forEach(button => {
  button.addEventListener('click', () => setLanguage(button.dataset.language));
});
setTheme(false);
setLanguage('en');
