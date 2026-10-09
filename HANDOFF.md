# HANDOFF — rolling the profile/manual workflow out to the whole TSW 7 collection

Written 2026-10-10 at the end of the session that rebuilt the README train list and added the Class 153. Read this first in the new session, then `CLAUDE.md` and `tools/README.md`. The approved plan is in `C:\Users\m_jag\.claude\plans\starry-honking-puddle.md`.

## Goal

A profile (`profiles/`), release (`releases/`), schematic manual (`profiles/documentation/*.html` + `.pdf`) and README line for every drivable train installed in TSW 7, UK first, then Germany, rest later. Each train ships as `SOON 🟨` and flips to `DONE ✅` only after the user has driven it with the TCA Quadrant Airbus.

## Working rules (user decisions, also in CLAUDE.md)

- Commit and push after every change set; message style "Added and released X from <route>" (or "Added X from <route> (awaiting cab test)" while SOON).
- Use Opus 5.5 subagents (`model: "opus"`) for legwork (Commons image/logo search, drafting manual data files, pak scans). Fable stays orchestrator and reviewer: it checks every subagent result and does the final edits.
- Manuals: Commons side-view drawing when one exists, otherwise a licensed photo. HTML + PDF only, no docx.

## Proof test: Zwolle–Groningen (do this first)

1. **NS ICMm (DTG)** — existing profile `profiles/tsw-ns-icmm-dtg-thejag-1771138596.json` (classes `RVM_ZGN_NS_ICMm3_{sBk,mBfk,AB}_C`, README already `DONE ✅`). Keep the same control-to-button mapping, but:
   - recapture the levers with the new capture tool and verify the notch tables (reverser 0/0.5/1 inverted; throttle 12 steps inverted; TrainBrake 0.3..0.8 in 8 steps; `MainModeSelector` on the flap lever 0/⅓/⅔/1);
   - clean up: drop the deprecated `sync_control` blocks and the key fallbacks (`x`, `space`, `n`, `y`, `u`, `q`, `v`, `shift+v`) where the API control is known (sand, horn, doors, AWS/ATB reset, wipers), fix the broken `RightAuxButton` deactivate that uses `"keys": "TrainVoltageSupply"` instead of `"controls"`, add `description` fields, keep `BrakeKey` on the right throttle button and the three-headlight scheme on AUTO BRK;
   - new schematic manual: create `tools/manual/trains/tsw-ns-icmm-dtg-thejag.json` (copy the Class 153 file as a template), NS logo + ICMm drawing from Wikimedia Commons into `tools/assets/`, render, check the PNG, delete the legacy `profiles/documentation/tsw-ns-icmm-dtg-thejag.docx` (the README links the PDF, which gets overwritten);
   - rebuild the release, commit, push.
2. **NS SNG (DTG)** — new: classes `RVM_ZGN_NS_SNG3_Cab_mABk_C`, `RVM_ZGN_NS_SNG3_Cab_mBk_C` (plus `_B_C`, `_Base_C`, `_Cab_Base_C` if the app needs the bases). Follow the ICMm layout (Dutch stock, ATB instead of AWS). Profile + manual + release + README `SOON 🟨` line.
3. This run also tests Phase A (tooling) and Phase B (how the train gets loaded).

## Phase A tooling to build before the capture (see plan)

- `tools/capture_train.js [out]` — dump + IS_GetActiveCab + cab-prefix detection + automatic sweep of every lever (master switch on, reverser neutral for the throttle, restore afterwards) → `tools/captures/<ObjectClass>.json`. Reuse `tools/tswapi.js`, `dump_controls.js`, `levers.js`, `sweep_levers.js`.
- `tools/draft_profile.js <capture> --family ...` — profile draft from a family template (UK unit = Class 333, UK DMU = Class 153, German = BR 440, Dutch = ICMm) matched on the `identifier` field; cab-prefixed names become `{SIDE:a:b}_Name`.
- `tools/draft_manual.js <profile>` — scaffold for `tools/manual/trains/<name>.json`.
- `tools/trains.json` registry + `tools/readme_status.js` that rewrites README lines in the existing format.
- `tools/pak_classes.txt` already exists: every `RVM_*` blueprint per DLC pak (append `_C`).

## Phase B: loading trains

The game API has no load endpoint (root nodes: `VirtualRailDriver`, `Player`, `CurrentDrivableActor`). The user chose to try desktop computer use: they switch it on in the Claude desktop app (Settings → This computer → Computer use) and run TSW 7 in a borderless window; load the tools with one `ToolSearch` (`computer`, 40 results), request access to Train Sim World, screenshot, and try Main menu → Free Roam → route → train → driver's seat. If it misfires 2–3 times, fall back for good to: user loads the train and says "in cab", Fable captures. The user is at the PC during capture sittings.

## Lessons from the Class 153 (2026-10-10)

- Pak class names can contain hyphens (`Class377-3`, `SD40-2`); grep with `[A-Za-z0-9_-]`. Newer paks store names without `.uasset` and far from the end of the file: grep the whole pak for `RVM_[A-Za-z0-9_-]*`.
- Two-cab units with per-cab node names (Class 153: `L_…`/`S_…`) use the app's placeholder `{SIDE:L:S}_Name`; it works as a prefix. The side comes from `CurrentDrivableActor.Function.IS_GetActiveCab` (`bFront`/`bBack`), which returned false/false while the user was not seated. Unverified assumption in the 153 profile: L = front. If nothing moves, check the flags while seated and swap to `{SIDE:S:L}`.
- Direct control = `PATCH /set/CurrentDrivableActor/<control>.InputValue`; control names are API node names. `enable_api_fallback` is harmless to keep on buttons.
- Sweeps: `sweep_levers.js` refuses to move a throttle unless the reverser allows it; switch the master switch on and reverser to neutral first (done by hand for the 153, automate in `capture_train.js`). Reversers and headlight rotaries wrap at 1.0 back to notch 0, so the last step is `(n-1)/n`, not 1.
- Spring switches (horn, sander on German stock) rest at 0.5; UK pushbuttons (AWS reset, sand, engine start, bell) take 1 then 0. Latching pushbuttons (circuit breakers, isolation) use `toggle`.
- Keys still in use from the user's TSW keybinds: `Q` AWS reset, `x` sand, `y`/`u` doors left/right. Prefer direct controls where the node is known.
- Manual pictures: Commons API, namespace 6, search `"<class>" (diagram OR drawing OR side)`; TfW/Northern-style drawings exist for many UK classes. The renderer accepts PNG/JPG/SVG logos; dark logos need `invertToNavy`.
- `tools/pdf2png.ps1` wants Windows-style absolute paths and an existing output folder.
- The README is LF in git; `core.autocrlf=true` prints CRLF warnings, ignore them. `img.png` in the root is a stray screenshot, leave it.

## State of the repo at handoff

- Last commits: README rebuilt by country from the installed paks (`8b8a4f5`), Class 153 added as SOON with working rules (`98d07e0`), this handoff.
- Class 153 awaits the user's cab test (cab-side mapping unverified).
- Legacy docx manuals still exist for the pre-333 trains (171, 313, 314, 375, 377, 710, ICMm, BR 145 draft); they get replaced by schematic manuals when each train is revisited.

## Files to read first in the new session

`HANDOFF.md`, `CLAUDE.md`, `tools/README.md`, `profiles/tsw-class-153-dtg-thejag-1791617000.json`, `tools/manual/trains/tsw-class-153-dtg-thejag.json`, `profiles/tsw-ns-icmm-dtg-thejag-1771138596.json`, `tools/sweep_levers.js`, `tools/dump_controls.js`.
