# TSW controller profiles (TheJAG)

This folder is both the live config dir of the TSW Controller App (`C:\Games\Tools\tsw-controller-app.exe`, it reloads `profiles/*.json` on change) and the git repo published at github.com/TheJAG/tsw_controller_profiles. Controller: Thrustmaster TCA Quadrant Airbus. Every released train ships with four things: a working profile in `profiles/`, a release copy in `releases/`, a docx + pdf manual in `profiles/documentation/`, and a `DONE ✅` line in `README.md`.

## Recipe for a new train

1. Ask which train, then confirm the API answers: `curl -H "DTGCommKey: <key>" http://127.0.0.1:31270/get/CurrentDrivableActor.ObjectClass` (key file: `C:\Users\m_jag\OneDrive\Documenten\My Games\TrainSimWorld7\Saved\Config\CommAPIKey.txt`). The user must sit in the cab.
2. `node tools/dump_controls.js tools/dump.json` then `node tools/levers.js tools/dump.json`; sweep levers with `node tools/sweep_levers.js <Lever> ...` only when the train is stationary. Vehicle class names (`RVM_..._C`) come from the dump's `objectClass` and from the DLC pak index: `tail -c 60000000 "<pak>" | grep -a -o -E "RVM_[A-Za-z0-9_]*\.uasset"`.
3. Write `profiles/<game>-<train>-<dev>-thejag-<unixtime>.json` following the closest existing profile (German: `tsw-br-440-dtg`, DTG UK: `tsw-class-333-dtg`, Rivet UK: `tsw-class-710-dtg`). Keep the control-to-button layout the user already uses (see those files); levers get `direct_control` + `sync_control`, buttons `momentary` with direct values, latching buttons `toggle`, wipers relative steps.
4. The user tests on the controller and reports; iterate. Then `node tools/build_release.js profiles/<file>.json`.
5. Manual (schematic format, current standard since the Class 333): copy the closest data file in `tools/manual/trains/`, fill in the controls, defaults (`start` = recommended starting notch, green dot) and checklists, then `node tools/manual/render_manual.js tools/manual/trains/<train>.json`. It writes the self-contained HTML and the A4 PDF straight into `profiles/documentation/` via headless Chrome. Render the PDF with `tools/pdf2png.ps1` and look at the PNG before committing. Loco pictures: prefer drawn side views from Wikimedia Commons (search the Commons API in namespace 6); logos go in `tools/assets/`, dark logos as white-on-transparent with `invertToNavy` when needed. The older Word-template path (`tools/gen_manual.js` + `tools/specs/`) is only for touching up the pre-333 manuals.
6. Add the README line (`DONE ✅` with profile + manual links, alphabetical within the game's list; `SOON 🟨` while in progress). Commit only when the user asks; messages are in the style "Added and released X from <route>".

## Manual conventions (decided 2026-10-09, keep them)

- Data file keys under `controls`: `speedbrake`, `leftThrottle`, `rightThrottle`, `flap` (levers: `name`, `notches` top to bottom, `start` index or `null`), `leftThrottleButton`, `rightThrottleButton`, `gearLever`, `eng1`, `eng2` (`start: true` draws the dot at the switch's OFF end), `leftAux`, `rightAux`, `roundAux`, `rudTrim`, `autoBrk` (six `positions` with `short` and `desc`, `start`), `modeSwitch` (`left`/`right` meanings), `parkBrk` (`flat`/`up` meanings). `null` = not assigned, drawn greyed.
- Green dot = recommended starting position. Lever notches are pills beside the slot, top to bottom, no arrows. The AUTO BRK rotary is a dial with the description under each position. The mode switch reads "slower ◀ · ▶ faster" with no "spring loaded" text. PARK BRK pivots on its right end: flat = key out, dashed upright = key in. Captions are "Left aux", "Right aux", "Round aux" with no "on-off" or "hold". The bottom-right block is the controller photo, not a table.
- New trains get HTML + PDF only; do not create docx files any more.

## Gotchas learned

- Numeric `step_thresholds` are mirrored when `invert` is true; express them on the raw lever axis. A dead band around a notch is done with `threshold_tolerance`.
- Push buttons toggle on every value change through the mod, so a `momentary` 1-then-0 toggles twice. Use `toggle`.
- Spring switches (horn, sander, cab light, PZB buttons) rest at 0.5; send 1 or 0 while held and 0.5 on release.
- The app's API-key auto-detect does not see the OneDrive Documents path; the key path is set in the app settings.
- The mod installer deletes `dxgi.dll` in the game's Win64 folder, which is OptiScaler. Keep `dxgi.dll.optiscaler` as backup and restore it after a mod install.
- Word exports of the templates come out as two pages unless trailing paragraphs are dropped; the specs already do that.
- Git identity is set locally in this repo. README uses CRLF line endings.
- `img.png` in the root is a stray screenshot, leave it alone.
