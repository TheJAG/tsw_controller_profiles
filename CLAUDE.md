# TSW controller profiles (TheJAG)

This folder is both the live config dir of the TSW Controller App (`C:\Games\Tools\tsw-controller-app.exe`, it reloads `profiles/*.json` on change) and the git repo published at github.com/TheJAG/tsw_controller_profiles. Controller: Thrustmaster TCA Quadrant Airbus. Every released train ships with four things: a working profile in `profiles/`, a release copy in `releases/`, an HTML + PDF manual in `profiles/documentation/`, and a `DONE ✅` line in `README.md`. Collection status and per-train notes: `HANDOFF.md`.

## Reference files

- `tools/CONVENTIONS.md`: read before writing a train's control layout, setting a lever's `invert`, writing manual data, or choosing a drawing, logo or colour scheme.
- `tools/GOTCHAS.md`: read before probing a lever, writing an mk script for a new vendor or lever type, or when a capture shows a main lever with one notch.
- `tools/CAPTURE_AGENT.md`: the capture subagent's brief, with the brief template at the end.
- `tools/README.md`: every tool and its options.

## Recipe for a new train

1. Confirm the API answers with the train loaded: `curl -H "DTGCommKey: <key>" http://127.0.0.1:31270/get/CurrentDrivableActor.ObjectClass` (key file: `C:\Users\m_jag\OneDrive\Documenten\My Games\TrainSimWorld7\Saved\Config\CommAPIKey.txt`).
2. Capture: a subagent briefed with `tools/CAPTURE_AGENT.md` loads the train and runs `node tools/capture_train.js`, which dumps the controls, detects cab pairs and sweeps every lever into `tools/captures/<ObjectClass>.json` (committed). Vehicle class names (`RVM_..._C`) come from the capture's `objectClass` and from `tools/pak_classes.txt` (every `RVM_*` per DLC pak).
3. Profile: `node tools/draft_profile.js tools/captures/<Class>.json --family <uk-unit|uk-dmu|de-unit|nl-unit> --name "Class 153" --dev dtg` writes the base `profiles/<game>-<train>-<dev>-thejag-<unixtime>.json`. Then copy the nearest relative in `tools/mk/` (see `tools/mk/README.md`; new scripts use `tools/mk/lib.js`), set the node names and bands from the capture, and run it: `node tools/mk/mk<train>.js profiles/<file>.json store.steampowered.com/app/<id>`. It writes the profile's controls and the manual data `tools/manual/trains/<slug>.json`.
4. `node tools/build_release.js profiles/<file>.json` writes the release and runs `tools/check.js` on the profile; fix every error it prints.
5. Manual: `node tools/manual/render_manual.js tools/manual/trains/<slug>.json` writes the HTML and the A4 PDF into `profiles/documentation/` and runs the full check (manual data, assets, one page). Look at the page before committing: `powershell -NoProfile -File tools/pdf2png.ps1 <pdf> <scratch dir>` renders an 800 px PNG. Publish the HTML as an artifact in the chat so the user sees it right away. (`tools/draft_manual.js` scaffolds manual data for a train without an mk script; the Word path `tools/gen_manual.js` + `tools/specs/` is only for touching up the pre-333 manuals.)
6. README line via `node tools/readme_status.js "<README name>" <soon|done> --profile <slug> --dev DTG` (`--add "<country>"` for a new name; it also regenerates `tools/trains.json`). `SOON 🟨` while the cab test is pending, `DONE ✅` after it.
7. The user tests on the controller and reports; iterate, then rebuild the release and the manual.

## Working rules (user decisions, 2026-10-10)

- Always commit and push after changing code, profiles, manuals or tooling, without waiting to be asked. Commit messages read "Added and released X from <route>". The pre-commit hook runs `tools/check.js` on staged trains; in a fresh clone enable it with `git config core.hooksPath tools/hooks`.
- Use Opus 5.5 subagents (`model: "opus"`) for delegable work (pak scans, research, drafting data files); Fable orchestrates and reviews: it plans, checks the subagents' results and does the final edits.
- The in-game work per train (menus, a midday service, desk photo, `capture_train.js`) goes to one capture subagent at a time (one game, one screen), briefed with the template at the end of `tools/CAPTURE_AGENT.md`; the standing rules live in that file, so the brief carries only the train's own facts. Fable steps in only when a capture comes back with locked levers the subagent could not explain.
- Write any script longer than five lines to the scratchpad with the Write tool and run it by path; inline `node -e` and heredocs lose backslashes and backticks.
