# chore(issues): close 10 resolved input/biome issues (cross-ref audit)

## Context

Sprint 2026-W30 (2026-07-20 → 2026-07-26), WU-1 (triage) produced this audit
on 2026-07-21 against `master`. All 10 issues listed in the sprint file had
merged PRs and green tests but were never closed in the tracker. This PR is a
documentation-only change that closes the loop: it cross-references each issue
to its merged PR + commit + test coverage so the issue tickets can be closed
in one sweep.

No source code changes. No new tests. CI should be untouched.

## Cross-reference table

| Issue | Title | Merged PR | Merge commit | Test coverage |
|---|---|---|---|---|
| #26 | Implement hybrid proximity tooltips for skills and NPCs | #27 | `2bb8c78` (feat `165df33`) | `tests/game-tooltips.test.ts` (6) |
| #28 | procedurally generate shield-shaped skill sprites with initials | #29 | `dd2d9ba` (feat `9a3a426`) | `tests/game-render.test.ts` (13) |
| #30 | add lcs robotics building to background scenery | (biome-engine) #50 | `be49da3` + `4ad179a` (asset wiring) | `tests/biome-config.test.ts` (20) + `tests/asset-build-contract.test.ts` (5) |
| #32 | retire python and pillow, adopt libresprite js | #33 | `ce504cb` (chore `ea8af7a`) | `tests/start-icons-build-contract.test.ts` (6) + build script smoke |
| #37 | fix(input): gamepad A/B do nothing, D-pad/stick stale mouseTarget | #38 | `6159415` (`2b62852` + `71b3426`) | `tests/game-input.test.ts` (33) — Slice A |
| #39 | feat(input): mobile/tablet tap → move player | #40 | `3d1d625` (feat `d8cfa2a` + tests `c611555`) | `tests/game-input.test.ts` (33) + `tests/start-screen.test.ts` (13) — Slice B |
| #41 | feat(input): Print in HUD + keyboard P + gamepad Start + D-pad modal nav | #42 | `3c980e6` (`b3af012` + `451439d` + `f2d1b71` + `00aa5a3`) | `tests/print-contract.test.ts` (53) + `tests/game-input.test.ts` (33) — Slice C |
| #43 | fix(start-screen): keyboard + gamepad navigation missing | #44 | `84206d8` (feat `8977300`) | `tests/start-screen.test.ts` (13) — Slice D |
| #45 | feat(hud): show current input source + detail on canvas HUD | #46 | `24d3a5b` (feat `4c51514`) | `tests/game-hud.test.ts` (14) + `tests/game-input.test.ts` (33) — Slice E |
| #47 | fix(input): click below player in scrolled viewport (Crmble bug) | #48 | `e3df02a` (fix `88a54e3`) | `tests/game-input.test.ts` (33) — Slice F |

## Verification (2026-07-21)

| Gate | Result |
|---|---|
| `pnpm test` (full suite) | ✅ 206/206 in 3.56s (master @ `origin/master`) |
| `pnpm typecheck` | ✅ exit 0 |
| `git log --all --grep` cross-check on each issue title keyword | ✅ all 10 match a merged PR |
| `tests/biome-config.test.ts` (PR #50 follow-up) | ✅ 20 contract cases green on `feat/biome-engine` branch |

## Notes

- **Biome-engine (PR #50, merged 2026-07-19) included #30** as part of the
  declarative biome-authoring surface. The LCS building decoration now lives in
  `src/assets/biomes/lcs/lcs-building.png` (444 B, 64×64 RGBA) mounted on
  `lcs-robotics` at `yOffset: 100`.
- **Crmble / Twinny / RIDE ON decoration sprites** were explicitly out of scope
  of PR #50 — only LCS Robotics had the PoC decoration. If/when those sprites
  are added, they will close the loop on "biomes that tell the real story" from
  WU-2 of sprint W30.
- This PR is documentation-only (`docs/chore-close-resolved-issues-2026-07-21.md`).
  No code paths or test fixtures are touched. The `pnpm test` numbers above are
  baseline checks against `origin/master` to confirm CI sanity before merge.

## How to close the issues after merge

After this PR merges, the issue tickets can be closed in one sweep with a comment
linking back to this audit document and the relevant merged PR:

```
gh issue close 26 --repo Xoje-Tech/the-journey-of-xoje --comment "Resolved by #27. Audit: docs/chore-close-resolved-issues-2026-07-21.md"
gh issue close 28 --repo Xoje-Tech/the-journey-of-xoje --comment "Resolved by #29. Audit: docs/chore-close-resolved-issues-2026-07-21.md"
... (etc for 30, 32, 37, 39, 41, 43, 45, 47)
```

Closing the issue tickets is a separate step the user (Xoje) takes after the PR
is reviewed, since `gh issue close` is a write that mutates remote state and
the user's session handles approvals for destructive ops.
