# Ready with known risk

Assessed on 2026-09-20T03:28:01.786592+00:00. Scope: the newly added `Comparinator-quality-agent` custom-agent definition and the README release-quality section, for project-local advisory use. This verdict does not assess or authorize release of the Comparinator application.

The agent's configuration is valid, its instructions cover the requested responsibilities, and six independent synthetic decision evaluations matched the expected outcomes. A separate Codex CLI smoke run reported discovering and invoking the named agent and returned the appropriate verdict for unverifiable evidence. Readiness rests on the reviewed decision policy, proportionate tool/skill routing, evidence provenance requirements, explicit unknown tracking, and successful invocation—not simply passing test counts.

## Candidate and baseline

- Agent SHA-256: `62b643b4bd9d5101ffbb24311ad3a825683021faca4605c470f9e91577bf53cf`
- README SHA-256: `958aa70449d78eb79ff555e1c9918eb7091218bbafbf479c6a39c0cd9070f7f6`
- Candidate hashes were checked again after evaluation and were unchanged.
- Git reports the project untracked and the parent repository has no commits. The baseline is the recorded conversation's creation step (new agent plus appended README section), not a versioned release. This is adequate to delimit this addition, but provides no evidence for broader application changes.
- Environment: macOS local workspace, Python 3.9.6 TOML parser from pip, Codex CLI 0.155.1. The invocation inherits runtime model/settings; the candidate does not force a model or permission override.

## Risk and evidence plan

| Risk | Priority and rationale | Check and observed evidence | Residual uncertainty |
|---|---|---|---|
| Approves on test totals while overlooking defects | High: defeats the requested purpose | Reviewed explicit non-approval rule and verdict precedence; scenarios A and E rejected unsafe rendering/data loss despite green tests or retry | Finite synthetic coverage cannot guarantee every future judgment |
| Treats stale or missing evidence as readiness | High: confidence without provenance | Candidate/base/hash rules and unknowns ledger reviewed; B and F returned Insufficient evidence | Real evidence collection across multiple tool failures is not exercised here |
| Rejects proportionate low-risk changes or invents approval gates | Medium: unnecessary release friction | C returned Ready; D returned Ready with known risk for a permitted cosmetic issue | Other release policies were not evaluated |
| Agent cannot be discovered or invoked | High: advertised workflow unavailable | TOML and required fields valid; Codex CLI smoke exited 0 and reported named-agent invocation with the expected verdict | Invocation evidence is CLI output, not an independently captured child-session trace |
| Selects irrelevant tests or fails to adapt | Medium: inadequate/expensive assessment | Source review confirms risk-to-tool mapping, translation-testing routing/fallback, discovery-driven replanning, stale-evidence invalidation, and stopping conditions | Multi-step discovery and replanning behavior has not had an end-to-end evaluation |
| Overstates evidence or changes/releases product | High: assessment exceeds authority | Source review confirms separate infrastructure/defect classification, source-preservation boundaries, and no deployment authority; smoke reported no application inspection or mutation | Prompt instructions are behavioral guidance, not an enforcement mechanism |

Skills/tools selected: the candidate agent instructions; filesystem/Git inspection for scope and artifacts; TOML parsing for structural validity; an independent subagent applying the exact instructions to synthetic packets; and Codex CLI for named-agent invocation. Translation-testing was intentionally not run: the assessed change adds an assessment agent, not localized app behavior. Existing I18N test passes do not validate this agent.

Plan adaptation: discovering the absence of Git commits led to candidate hashes and conversation-bounded scope. A sandbox initialization error prevented the first CLI smoke; the authorized retry outside that sandbox completed. The first attempt is an infrastructure failure, not a product failure. No retries were used to conceal a behavioral failure.

## Results

- Structural validation: TOML parse, required nonempty string fields, matching filename/name passed.
- Synthetic behavioral cases: 6 matched expectations, 0 mismatches. These are packet-based judgments, not application tests.
- Named-agent integration smoke: 1 completed successfully; returned Insufficient evidence for a comparison-engine change with only a verbal passing-test claim.
- Application/browser suites: not run for this agent-only scope.
- Confirmed release-blocking defects: none found.

| Case | Supplied evidence | Expected and observed verdict |
|---|---|---|
| A | Confirmed unsafe HTML execution despite green I18N tests | Not ready |
| B | Engine change with current I18N checks but stale engine results | Insufficient evidence |
| C | Bounded typo change with relevant current review/runtime evidence | Ready |
| D | C plus documented readable cosmetic wrapping allowed by criteria | Ready with known risk |
| E | Observed Text B loss followed by a passing retry | Not ready |
| F | Unknown candidate/base and verbal test claim | Insufficient evidence |

## Unknowns and known risks

| ID | Unknown or residual risk | Release implication and resolution |
|---|---|---|
| U1 | No versioned baseline | Bounded, nonblocking for this documented addition; blocks extrapolating this verdict to a complete app release. Preserve a versioned baseline before assessing future diffs. Owner not assigned. |
| U2 | Adaptive multi-step behavior and robustness across varied models/inputs | Bounded risk for a project-local advisory agent whose evidence remains reviewable; this assessment does not qualify it as an unattended release gate. Follow up with an end-to-end assessment containing a discovered failure and a revised plan. Owner not assigned. |
| U3 | Named-agent invocation has CLI-reported evidence but no child trace | Successful CLI result supports basic integration; retain a child-session trace if stronger runtime provenance is required. Owner not assigned. |

No acceptance by a release owner is claimed. These limitations are disclosed for project-local advisory use; any requirement for unattended enforcement or validated reliability across models needs additional evidence and a new assessment. The next useful validation is one realistic change assessment that demonstrates tool selection, a new discovery, replanning, and a final evidence ledger.

## Artifacts and commands

- [Candidate definition](../.codex/agents/Comparinator-quality-agent.toml)
- [User-facing invocation instructions](../README.md#release-quality-agent)
- [Hashes and six scenario outcomes](quality-agent-evidence-2026-09-20.json)
- [Codex named-agent smoke result](quality-agent-invocation-2026-09-20.txt)

Commands included `git status --short -- .`, `git log -1 --format='%H %s' -- .`, TOML parsing and SHA-256 calculation through Python, and `codex exec --ephemeral --color never -o /tmp/comparinator-quality-agent-smoke.txt` with a bounded synthetic invocation prompt. Git history inspection failed because no commits exist; this is explicitly accounted for above.
