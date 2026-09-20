# Comparinator test cases

Expected percentages follow the formulas in `requirements.md`. Unless specified otherwise, start with both ignore options off and select **Compare texts** after entering the inputs.

| # | Test | Inputs / action | Expected result |
|---|---|---|---|
| 1 | Identical text | A and B: `The cat sat` | Similarity and both accuracies: **100%**. Word counts: **3 each**. All words green. |
| 2 | Completely different | A: `cat dog` B: `sun moon` | All scores **0%**. Word counts: **2 each**. All words red. |
| 3 | One replacement | A: `the cat sat` B: `the dog sat` | All scores **66.7%**. `the` and `sat` green; `cat` and `dog` red in their respective boxes. |
| 4 | Added word | A: `one two` B: `one two three` | Similarity **80%**. Accuracy A **50%**, B **66.7%**. Only B’s `three` is red. |
| 5 | Deleted word | A: `one two three` B: `one two` | Similarity **80%**. Accuracy A **66.7%**, B **50%**. Only A’s `three` is red. |
| 6 | Reordered words | A: `a b` B: `b a` | Similarity **50%**, both accuracies **0%**. One matched word per box; the other red. |
| 7 | Repeated words | A: `go go stop` B: `go stop` | Similarity **80%**. Exactly one `go` in A is red. B’s words are green. |
| 8 | Case sensitivity | A: `Hello WORLD` B: `hello world` | Ignore case off: all scores **0%**. Turn it on and compare again: **100%**, all green. Original capitalization remains visible. |
| 9 | Punctuation sensitivity | A: `Hello, world!` B: `Hello world` | Ignore punctuation off: **0%**. Turn it on and compare again: **100%**. Original punctuation remains visible. |
| 10 | Both ignore options | A: `HELLO, World!` B: `hello world` | Both options on: **100%**. Either option alone: **0%**. |
| 11 | Punctuation-only token | A: `hello ...` B: `hello`; ignore punctuation on | All scores **100%**. Word counts A **2**, B **1**. `...` remains visible without highlighting. |
| 12 | Symbols stay significant | A: `$` B: `+`; ignore punctuation on | All scores **0%**. Both symbols red. |
| 13 | Both inputs empty | Clear both inputs, then Compare | All scores **100%**, counts **0**. Both results indicate empty text. |
| 14 | One input empty | A empty, B: `hello`; repeat with inputs swapped | All scores **0%**. Nonempty word red; empty result clearly identified. |
| 15 | Whitespace differences | A: `one two`; B has leading spaces, a tab between words, and a trailing newline | All scores **100%**, counts **2 each**. Results preserve each input’s whitespace. |
| 16 | Live character tracking | Type `Hello!`, then delete `!` | Counter changes from **6 / 10,000** to **5 / 10,000**. |
| 17 | Character limit | Paste 10,000 characters, then attempt to type or paste more | Input never exceeds **10,000** characters. Counter agrees with accepted text. Check both inputs. |
| 18 | Maximum-size comparison | A: `a ` repeated 5,000 times; B: `b ` repeated 5,000 times | Counts **5,000 each**, all scores **0%**, all words red. Comparison completes without crashing. |
| 19 | Stale results | Compare, then edit either input or change an ignore option | Previous results and scores clear. A message prompts another comparison. |
| 20 | Reset | Populate inputs, enable options, compare, select dark mode, then Reset | Inputs, results, scores, and options clear. Counters return to zero. Dark mode remains selected. |
| 21 | Theme toggle | Switch themes before and after comparing | Text and scores remain unchanged. Both themes stay readable and retain the glass appearance. |
| 22 | Safe text rendering | Enter `<img src=x onerror=alert(1)>` and compare | Input appears as literal text. No image loads and no code executes. |
| 23 | Offline use | Disconnect from the internet, open `index.html`, and compare | All app features work without network access. |
| 24 | Narrow screen and long words | Use a phone-sized viewport and a long word without spaces | Input/results boxes stack. Text wraps without horizontal page overflow. |
| 25 | Keyboard accessibility | Navigate with Tab; operate options and buttons using the keyboard | All controls are reachable, focus is visible, and actions work without a mouse. Differences also have dotted underlines. |

## Swap consistency check

Swap A and B after any comparison and compare again. Similarity should stay the same, word counts should swap, and Accuracy A/B should swap.
