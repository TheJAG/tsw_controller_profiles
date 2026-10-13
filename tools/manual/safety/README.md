# Safety-systems manuals

One data file per country (`<country>.json`), rendered by `node tools/manual/render_safety.js tools/manual/safety/<country>.json` into `profiles/documentation/tsw-safety-<country>-thejag.html` and `.pdf` (A4, several pages, train-manual style). The renderer fails with exit code 3 when a page's content runs past the sheet; shorten the text or move a section to the next page. Look at the pages with `powershell -NoProfile -File tools/pdf2png.ps1 <pdf> <dir>`.

## File

```
{ "name": "tsw-safety-<country>-thejag", "title": "Safety systems · <Country>", "eyebrow": "...",
  "colors": { ...country scheme from tools/CONVENTIONS.md... }, "logos": [ { "file": "../../assets/<logo>", "alt": "..." } ],
  "credit": "© TheJAG", "sources": ["..."], "pages": [ { "sections": [ ... ] }, ... ] }
```

Each entry in `pages` is one A4 sheet; page 1 carries the big header.

## Sections

- `intro`: `title?`, `paragraphs` (`**bold**` is the only markup, in every text field).
- `systems`: `title`, `cols?`, `items` of `{ name, full, summary, where, quadrant }`.
- `aspects`: `title`, `note?`, `cols` (default 4), `items` of `{ signal, name, meaning, drive? }`.
- `howto`: `title`, `cols` (default 2), `blocks` of `{ title, steps? (ordered), bullets?, note? }`.
- `table`: `title`, `head`, `rows`.
- `callout`: `title`, `text` (a warning box).

## Signal drawings

`{ "post": true | false | "short", "parts": [ ... ] }`, parts stacked top to bottom on a post that runs to the ground line; `post: false` centres a free-standing board, `"short"` puts the parts low on a short post.

- `{ kind: "head", column: ["red-", "yellow*", "green"] }`: a black head with lamps in a column; a colour (red, yellow, green, white, lunar, blue, orange, purple) plus nothing = lit, `*` = flashing (drawn with rays), `-` = dark. `shape: "round"` rounds the head, `r` sets the lamp radius (7).
- `{ kind: "head", w, h, lamps: [ { x, y, c, s: on|off|flash, r? } ], shape?: "rect"|"round"|"none" }`: free lamp layout (position lights, lunar whites, route indicators).
- `{ kind: "number", text, color, s: on|flash|off }`: a lit number indicator.
- `{ kind: "plate", text ("\n" breaks lines), fg, bg, border, shape: rect|triangle|triangle-down|diamond|circle|square, w?, h?, size?, rx? }`: an unlit board.
- `{ kind: "arm", angle (degrees, + raised), type: stop|distant, side: right|left }`: a semaphore arm.
- `{ kind: "gap", h }`: empty space between parts.
