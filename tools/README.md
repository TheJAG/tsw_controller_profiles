# Tools for building profiles and manuals

Scripts used to create a new controller profile and its Quick Reference Manual. Run everything from the repo root (`C:\Users\m_jag\AppData\Roaming\tswcontrollerapp\config`). Requirements: Node, the `py` Python launcher, `unzip` from Git Bash, Microsoft Word (for PDF export), and Train Sim World started with the `-HTTPAPI` Steam launch option.

## Reading the loco through the TSW HTTP API

| Script | What it does |
|---|---|
| `tswapi.js` | Tiny client. Reads the key from `CommAPIKey.txt` (override with env `TSW_COMMAPIKEY`). |
| `dump_controls.js <out.json>` | Lists every control of the vehicle you are sitting in: class name, identifier, current value, display names of the notches. |
| `levers.js <out.json>` | For every lever in that dump: notch count, current notch, min/max, output range. |
| `sweep_levers.js <Lever> [...]` | Moves a lever through 0..1 in 1% steps and prints where the notches change, then restores it. Refuses when the train is moving; the throttle only when the reverser is neutral or off. |

Notch values are usually evenly spaced (`i / (notches - 1)`); the sweep prints the boundaries, not the centres. Push buttons toggle on each value change: use a `toggle` assignment, not `momentary`, for buttons that latch (fuses, isolation switches). Spring switches rest at 0.5 and take 0 or 1 as a pulse.

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
