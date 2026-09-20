# Comparinator requirements

## Platform and delivery
- Build a browser app called Comparinator using plain HTML, CSS, and JavaScript.
- Run entirely offline by opening `index.html`; no server, build step, external libraries, fonts, APIs, or network requests are required.
- Keep all entered text in the browser; do not transmit or persist it.

## Inputs and controls
- Provide labeled Text A and Text B input boxes, each accepting at most 10,000 characters.
- Show a live character count for each input, including spaces and punctuation. Use native browser character counting (UTF-16 code units).
- Provide a Compare button and independent Ignore case and Ignore punctuation checkboxes, initially unchecked.
- Ignore options affect matching and metrics, while results retain original spelling, punctuation, and whitespace.
- Reset clears both inputs, results, statistics, messages, and ignore options, keeping the selected theme.
- Changing an input or ignore option clears stale comparison results until Compare is selected again.

## Comparison and results
- Display two distinct results boxes side by side on wide screens: A compared with B, and B compared with A. Stack them on small screens.
- Match words in sequence, accounting for repeated words. Highlight matched words green in each box and unmatched words red in each box.
- Inserted or deleted words appear only in the result corresponding to their original input; do not insert synthetic words into the other result.
- Preserve whitespace and line breaks. Wrap long words without horizontal page overflow.
- Provide a text legend and an additional visual cue for differences so color is not the only indicator.
- Treat whitespace-delimited nonempty tokens as words. Word counts always describe the original inputs.
- Ignore case uses Unicode lowercase conversion. Ignore punctuation removes Unicode punctuation from each token for comparison; it does not remove symbols or merge whitespace-separated words.
- Tokens containing only punctuation are excluded from matching and metric denominators when Ignore punctuation is enabled, and shown neutrally in results.

## Statistics and explicit metric definitions
- Show word count A and word count B.
- Show symmetric similarity: `100 × 2 × matched words / (comparable words A + comparable words B)`, where matched words form a longest common subsequence.
- Show directional accuracy for each input because neither input is designated as the sole reference: Accuracy A uses A as the reference; Accuracy B uses B as the reference.
- Accuracy is `100 × max(0, 1 − word edit distance / reference word count)`. Word edit distance counts insertions, deletions, and substitutions at cost one each.
- Display percentages to one decimal place and explain the metrics in the app.
- If both comparable sequences are empty, similarity and both accuracies are 100%. If only one is empty, similarity and both accuracies are 0%.
- Before comparison and after reset, show placeholder statistics rather than misleading calculated values.

## Appearance and accessibility
- Apply the branding and semantic tokens in `style-guide.html`: warm neutral surfaces, suit red primary actions, gold accents, cyan focus rings, and restrained translucent panels.
- Provide a Light / Red Suit theme toggle; both themes retain readable glass styling. Initially use Light, regardless of system theme.
- Use responsive layouts, visible keyboard focus, native keyboard-accessible controls, explicit labels, accessible status updates, and readable contrast.
- Render user text safely as text, never interpreted HTML.

## Verification
- Verify matching, directional metrics, repeated words, empty inputs, case and punctuation options, reset behavior, character limits, safe rendering, and a maximum-size comparison using available local tooling.

## Interface localization
- Provide English and German UI catalogs, with English as the default.
- Place keyboard-accessible flag buttons in the top-right header, with EN/DE labels, native-language accessible names, and a selected state.
- Translate all app copy, including placeholders, accessible descriptions, status messages, empty states, theme names, metric explanations, and the document title. Set the document language accordingly.
- Format counts and percentages for the selected locale. Preserve source text, results, ignore settings, and theme while switching languages.
- Reset preserves language and theme; a page reload returns to English and Light. No persistence or external requests are needed.
