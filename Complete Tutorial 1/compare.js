/* Pure comparison logic; also usable by the local Node verification script. */
(function (root) {
  'use strict';
  function tokenize(text, options) {
    const parts = text.match(/\s+|\S+/gu) || [];
    const words = [];
    let wordCount = 0;
    parts.forEach((value, part) => {
      if (/^\s/u.test(value)) return;
      wordCount++;
      let key = options.ignorePunctuation ? value.replace(/\p{P}/gu, '') : value;
      if (options.ignoreCase) key = key.toLowerCase();
      if (key) words.push({ key, part });
    });
    return { parts, words, wordCount };
  }
  function compareTexts(a, b, options = {}) {
    const A = tokenize(a, options), B = tokenize(b, options);
    const n = A.words.length, m = B.words.length, width = m + 1;
    // One byte per cell for alignment; metric rows use linear memory.
    const directions = new Uint8Array((n + 1) * width);
    let previous = new Uint16Array(width), current = new Uint16Array(width);
    let editsPrevious = Uint16Array.from({ length: width }, (_, j) => j);
    let editsCurrent = new Uint16Array(width);
    for (let i = 1; i <= n; i++) {
      current[0] = 0;
      editsCurrent[0] = i;
      for (let j = 1; j <= m; j++) {
        const equal = A.words[i - 1].key === B.words[j - 1].key;
        if (equal) {
          current[j] = previous[j - 1] + 1;
          directions[i * width + j] = 1;
        } else if (previous[j] >= current[j - 1]) {
          current[j] = previous[j];
          directions[i * width + j] = 2;
        } else {
          current[j] = current[j - 1];
          directions[i * width + j] = 3;
        }
        editsCurrent[j] = Math.min(editsPrevious[j] + 1, editsCurrent[j - 1] + 1, editsPrevious[j - 1] + (equal ? 0 : 1));
      }
      [previous, current] = [current, previous];
      [editsPrevious, editsCurrent] = [editsCurrent, editsPrevious];
    }
    const matchedA = new Set(), matchedB = new Set();
    let i = n, j = m;
    while (i && j) {
      const direction = directions[i * width + j];
      if (direction === 1) {
        matchedA.add(A.words[--i].part);
        matchedB.add(B.words[--j].part);
      } else if (direction === 2) i--;
      else j--;
    }
    const distance = editsPrevious[m];
    const accuracy = length => !n && !m ? 100 : !length ? 0 : Math.max(0, 100 * (1 - distance / length));
    return { A, B, matchedA, matchedB, distance, matches: previous[m],
      similarity: n + m ? 200 * previous[m] / (n + m) : 100,
      accuracyA: accuracy(n), accuracyB: accuracy(m) };
  }
  if (typeof module !== 'undefined' && module.exports) module.exports = { compareTexts };
  else root.compareTexts = compareTexts;
})(globalThis);
