# Tools for building profiles and manuals

Scripts used to create a new controller profile and its Quick Reference Manual. Run everything from the repo root (`C:\Users\m_jag\AppData\Roaming\tswcontrollerapp\config`). Requirements: Node, the `py` Python launcher, `unzip` from Git Bash, Microsoft Word (for PDF export), and Train Sim World started with the `-HTTPAPI` Steam launch option.

## Pipeline per train (current, since 2026-10-10)

1. Sit in the cab, train stationary, master key/switch on. `node tools/capture_train.js` dumps every control, reads `IS_GetActiveCab`, detects cab-prefix pairs (`L_`/`S_`) and sweeps every lever with more than one notch (master switch on, reverser to Neutral for the throttle, everything restored afterwards). Output: `tools/captures/<ObjectClass>.json`, committed, so profiles can be rebuilt without the game. Options: `--no-sweep`, `--levers A,B`, `--cab L`, `--step 0.01`.
2. `node tools/draft_profile.js tools/captures/<Class>.json --family uk-dmu --name "Class 153" --dev dtg` writes `profiles/tsw-class-153-dtg-thejag-<unixtime>.json`. The family template (`tools/families.json`: `uk-unit` = Class 333, `uk-dmu` = Class 153, `de-unit` = BR 440, `nl-unit` = ICMm) gives the TCA layout; each node is resolved in the capture by input identifier (fallback: bare node name), cab pairs become `{SIDE:a:b}_Name`, lever steps come from the sweep, `sync_control` blocks are dropped, keyboard fallbacks become direct controls when the train has the node, the headlight rotary gets off / day / marker / night / tail in that order, rail classes come from `tools/pak_classes.txt`. Unmatched controls are removed and listed; read the draft before using it. `--classes PREFIX` overrides the pak lookup, `--slug` the file name.
3. `node tools/draft_manual.js profiles/<file>.json --family uk-dmu --operator "..." --route "..." [--logo ../../assets/x.svg] [--diagram ../../assets/y.png --source "Drawing: ..."]` scaffolds `tools/manual/trains/<name>.json` with notch pills (top = lever fully forward = raw 0 on the TCA, so inverted levers show the game's last notch on top, e.g. Forward and full power; `--flip` otherwise), `start` from the lever position at capture time, the AUTO BRK positions from the AutoBrake descriptions and the checklists of the family manual. `_todo` lists what is still placeholder. Then render as below.
   Cab photo for the band under the checklists: in the cab view press F1 (HUD off), tilt so a little windscreen shows above the desk, screenshot, then `powershell -File tools/crop_image.ps1 -In shot.png -Out tools/assets/<train>-cab.jpg -X 0 -Y 0 -W 3440 -H 1100 -MaxWidth 1900` and set `cab` in the data file. Set `diagram.clean: false` for photos and transparent SVGs; drawings on a flat background are cleaned in-page.
4. `node tools/build_release.js profiles/<file>.json`, then `node tools/readme_status.js "BR Class 153" soon --profile tsw-class-153-dtg-thejag --dev DTG` rewrites the README line (`--add "<country>"` inserts a new one alphabetically, `--game tsc|rt` for the other sections) and regenerates `tools/trains.json`, the registry of every README train with status and links (extra keys such as `route`, `classes`, `capture`, `family` survive a resync).

## Driving the game from a script

`tsw_input.ps1` focuses the TSW window, takes screenshots and sends clicks, mouse look, wheel and keys (`powershell -NoProfile -File tools/tsw_input.ps1 shot 0.5 out.png`, `click x y`, `mmove 0 95`, `key 112`). `CAPTURE_AGENT.md` is the brief for a subagent that loads one train through the menus, takes the desk photo and runs the capture; it lists the menu coordinates for 3440×1440 and the pitfalls. One game, one screen: captures run one train at a time.

## Reading the loco through the TSW HTTP API

| Script | What it does |
|---|---|
| `tswapi.js` | Tiny client: `api`, `get`, `setv`, `dumpControls`. Reads the key from `CommAPIKey.txt` (override with env `TSW_COMMAPIKEY`). |
| `capture_train.js [out.json]` | Dump + active cab + cab pairs + lever sweeps into `tools/captures/` (see pipeline). |
| `dump_controls.js <out.json>` | Lists every control of the vehicle you are sitting in: class name, identifier, current value, display names of the notches. |
| `levers.js <out.json>` | For every lever in that dump: notch count, current notch, min/max, output range. |
| `sweep_levers.js <Lever> [...]` | Moves a lever through 0..1 in 1% steps and prints where the notches change, then restores it. Refuses when the train is moving; the throttle only when the reverser is neutral or off. |
| `recolor_logo.ps1 -In white.png -Out navy.png [-Color] [-Height]` | Recolour a white-on-transparent logo to one flat colour with soft edges (Rivet, Northern); replaces the old `invertToNavy` CSS filter. |
| `tint_logo.ps1 -In logo.jpg -Out logo-navy.png -Color '#223261' -Channel R [-Height]` | Tint a coloured raster logo with a white mark (DTG square, DB box) to a scheme colour: each pixel is mixed between the colour and white by one RGB channel that is dark on the brand colour (R for cyan, G for red). Keeps the original beside it. |
| `joyread.ps1 [-Seconds n] [-IntervalMs n]` | Log the raw TCA axes (winmm; X = left throttle, Y = right) to find detent positions and jitter before tuning notch bands. |
| `probe_lever.js <Lever> [--from a --to b --step s] [--values ...]` | Set values on a lever through the API and show what the game stores, its output and notch index; restores the lever. Use before tuning steps. |

The sweep runs over the lever's own input range (a combined power/brake handle is -1..1; the SNG's MasterController was the first); `--range lo,hi` clips it (`--range -1,0.12` keeps a combined handle out of full power with the reverser in Forward) and a sweep stops by itself when the vehicle starts moving. A `--levers` re-sweep keeps the other levers' notches from the existing capture file, so the reverser's Neutral notch stays known. Notch values are usually evenly spaced (`i / (notches - 1)`, rotary switches that wrap use `i / notches`); the sweep prints the boundaries, not the centres. Push buttons toggle on each value change: use a `toggle` assignment, not `momentary`, for buttons that latch (fuses, isolation switches). Spring switches rest at 0.5 and take 0 or 1 as a pulse. The Class 153 capture in `tools/captures/` is a real `capture_train.js` sweep (2026-10-10, Cardiff City Network, Penarth).

## Building the manual (current format)

`manual/render_manual.js trains/<train>.json [outdir]` renders the one-page schematic manual from a data file and prints it to A4 PDF with headless Chrome or Edge (HTML and PDF land in `profiles/documentation/`). The data file names the train, logos, side-view drawing, colours, every TCA control with its function, notch names and `start` index (the green "recommended starting position"), the AUTO BRK rotary positions with descriptions, the mode switch left/right meanings, the PARK BRK flat/up meanings, and the two checklists. `manual/trains/tsw-class-333-dtg-thejag.json` is the reference example. Unassigned controls are left `null` and drawn greyed.

## Building a manual from the old Word templates

`gen_manual.js <template.docx> <spec.json> <out.docx>` clones an existing manual and rewrites it from a spec (see `specs/`). Only needed for the manuals made before the Class 333. The spec can:

- `boxes` replace the text of positioned text boxes by anchor index (`dump_boxes.js` prints the indices with coordinates).
- `boxExt` resize or move a box (`cx`, `cy`, `x`, `y` in EMU).
- `cells` replace exact run texts (title, link captions); `cellLines` replace a whole table cell (`"table:row:cell"`).
- `links` change hyperlink targets, `inlineImages` swap pictures by relationship id (`rId`) and set their size, `colorMap` recolour fills, text and the page background.
- `dropRows`, `dropTables`, `dropEmptyParasAfterTable`, `dropTrailingParas` keep the page count at one.

Then `pdf_export.ps1 -In x.docx -Out x.pdf` exports through Word and `pdf2png.ps1 -Pdf x.pdf -OutDir dir` renders pages to PNG for a visual check. `dump_body.js` prints the body structure (tables, rows, paragraphs) of a document.

Templates: `tsw-br-145-train-sim-germany-thejag.docx` for German locos (PZB/SiFa labels), `tsw-class-377-dtg-thejag.docx` for DTG UK units, `tsw-class-710-dtg-thejag.docx` for Rivet UK units. The TCA photo is `image4.png` in every template; the loco picture is the inline image `rId10`, operator logo `rId8`, developer logo `rId9`.

## Release file

`build_release.js profiles/<file>.json` writes `releases/<name>.tswprofile` the same way the app's "save for sharing" does.
