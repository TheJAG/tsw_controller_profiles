# Layout and manual conventions

User decisions, mostly from 2026-10-09 to 2026-10-12. Read before writing an mk script's control layout, setting a lever's `invert`, writing manual data, or choosing a drawing, logo or colour scheme. Keep them; the user's cab test decides any exception, and one train's test never changes another train.

## Control layout on the TCA

- Lever assignment follows the real cab: the lever the driver has on the left goes on the left TCA throttle, the right one on the right (ICMm: throttle left, brake right). An AFB / speed setter goes on the flap lever when the train has one. The speedbrake lever is always the reverser.
- The left and right aux squares are for switching the safety systems on and off (ATB / PZB / SiFa / AWS-TPWS / DVD-vigilance isolation or fuses), as `toggle`; other latching switches (train voltage, compressor, gauge lights) go on the round aux or stay out. The left throttle button is the sander when the train has one; if not, the nearest traction aid (ICMm: traction reduction) or nothing.
- RUD TRIM is always the doors, left / right (the unit's door nodes, or the game keys y / u on a loco), on freight locos too since they run railtours (user, 2026-10-11); the user prefers the doors over a parking brake or handbrake there. Parking brake, handbrake, pantograph, Hauptschalter and AFB on / off then stay in the cab (or go on the round aux when that is free).
- Reversers get evenly spaced steps over min..max (thirds for four notches, as the tested 313 / 333) whenever the game accepts any value in a notch zone: uneven steps such as the measured 0 / 0.2468 / 0.569 / 0.9243 give uneven TCA bands (Class 31, user test 2026-10-11); check the zones with `probe_lever.js` first.
- Levers are `direct_control` only (no `sync_control`), buttons `momentary` with direct values, latching buttons `toggle`, wipers relative steps. A lever without detents (SNG power/brake handle) is a `direct_control` with `min`/`max` and no `steps`.

## Lever direction rule (user, 2026-10-10)

Check it for every lever of every train:

1. Look in the cab where the handle sits at 0 / Off / Release and at full power / full brake / Forward (desk screenshot or the capture's notch values plus the cab view). Some trains have the brake pushed away from you, some pulled towards you; the same goes for throttles and reversers (Class 153: power is pulled towards you, 7 is nearest the driver; the brake is pushed away, Emergency furthest away).
2. Set `invert` so the TCA lever moves the same way as the handle in the cab. Pushed away from you the TCA lever reads raw 0, pulled towards you raw 1 (all three levers). So plain = raw 0 gives game value 0 at the far end; inverted = the game's last notch is at the far end.
3. The manual must match the cab and the profile: notch pills top to bottom = far end of the handle's travel to the end nearest the driver = TCA pushed away to pulled towards you. `draft_manual.js` derives that from the profile (plain lever: notch 0 on top; inverted: last notch on top); `--flip` only if the cab proves the profile and the pills disagree, and then fix the profile rather than the pills.
4. The user's cab test decides; never change another train's levers or manual on the strength of one train's test.

## Manual data and drawing (decided 2026-10-09)

- Data file keys under `controls`: `speedbrake`, `leftThrottle`, `rightThrottle`, `flap` (levers: `name`, `notches` top to bottom, `start` index or `null`), `leftThrottleButton`, `rightThrottleButton`, `gearLever`, `eng1`, `eng2` (`start: true` draws the dot at the switch's OFF end), `leftAux`, `rightAux`, `roundAux`, `rudTrim`, `autoBrk` (six `positions` with `short` and `desc`, `start`), `modeSwitch` (`left`/`right` meanings), `parkBrk` (`flat`/`up` meanings). `null` = not assigned, drawn greyed.
- Green dot = recommended starting position. The AUTO BRK headlight dial's dot is always on Off (user, 2026-10-10). On a combined power/brake handle that is Max brake (just before Emergency), never 0: a parked train is always held on the brake (user, 2026-10-10). Lever notches are pills beside the slot, top to bottom, no arrows. The AUTO BRK rotary is a dial with the description under each position. The mode switch reads "slower ◀ · ▶ faster" with no "spring loaded" text. PARK BRK pivots on its right end: flat = key out, dashed upright = key in. Captions are "Left aux", "Right aux", "Round aux" with no "on-off" or "hold".
- A lever without detents gets `continuous: true` in the manual data: the slot shows a filled inner track, `notches` holds only the named points with `null` for the gaps, no ticks.
- New trains get HTML + PDF only; no docx files.
- Since the ICMm (2026-10-10) the bottom of the page is a full-width band with a screenshot of the driver's desk (`cab` key: `file`, `height` ≈ 196, `position`), taken in the cab view with the HUD hidden (F1), daylight, a little windscreen above the desk, cropped with `tools/crop_image.ps1` to about 3.1:1 (JPEG, ≤ 1900 px wide, in `tools/assets/<train>-cab.jpg`; low desks such as 378, 387, 802, 807 may be 2.6–2.9:1 so the handle quadrant stays in). The schematic shrinks a little to make room (`schematicHeight`, default 596). The older bottom-right block is the controller photo, not a table.
- The side-view drawing at the bottom is always 48 px tall (the Class 333 drawing at full width), centred; the renderer strips a flat background around it in-page (`diagram.clean`, default true, `tolerance` 40); set `clean: false` for photos and transparent SVGs. A drawing wider than the page at 48 px is never squashed (user, 2026-10-11): `diagram.fit: "clip"` keeps the height, starts at the left with the leading vehicle and fades out at the right edge (HST, 390, 406, 411, 220, 350, 375, 377, 395, 465, 801); a drawing that overflows by less than about 15 % gets `fit: "width"` instead and fits whole a few px lower (313, 314, 333, ICMm). The page is 794 px wide with 36 px margins, so 722 px is the limit (`tools/check.js` enforces it).
- The side-view drawing shows the whole consist, every unit of the set as it runs in the game (ICMm: three cars), not only the leading car.
- With no drawing at all (no `diagram` key, BR 440) the checklists and the cab band spread over the free space; that is the fallback only when no drawing exists, not a style choice.

## Drawing sources, in order

1. Arthur's Treinenpagina (https://www.arthurstreinenpagina.nl/), whose author gave the user permission to use the drawings in these manuals with a reference to the site (request mail "Toestemming gebruik tekeningen", 2026-02); caption "Tekening: Arthur's Treinenpagina, arthurstreinenpagina.nl".
2. Wikimedia Commons drawn side views (search the Commons API in namespace 6).
3. A web search for other sites with side-view drawings or schematics (railway drawing sites, manufacturer pages, enthusiast pages); check the licence or ask for permission as with Arthur, and credit the source in the caption.

DB Einsatzmerkblätter (deutschebahn.com, Notfallmanagement, 172 rescue-sheet PDFs with a plain side-view drawing per class, © DB AG) are approved by the user (2026-10-12) for German stock: render the PDF, crop the elevation, white out the red rescue arrows and labels, save `tools/assets/<slug>-side.png`, caption "Zeichnung: Deutsche Bahn AG, Einsatzmerkblatt BR xxx (mm/yyyy)". The Barrowmore BR diagram-book scans only after permission. Photos are never the side view: only when all sources find nothing (BR 440, 2026-10-10) does the manual go without a `diagram`.

## Colours and logos (user, 2026-10-10)

- Scheme per country, set in the manual data `colors` and inherited by the family template: UK navy `#223261` / `#4a66a8` / paper `#f3f5f9`; Netherlands NS blue `#003082` / `#2f5fb3` / `#f3f5f9`; Germany DB grey `#3a3d4d` with DB red `#ec0016` as the accent / paper `#f6f4f4`. For a new country, propose a scheme in the first manual: a dark, desaturated primary from the national operator's identity that still reads as text and outlines on the schematic (no pure red, green or yellow as the primary), a mid tone of it as the secondary, a near-white paper tinted the same way.
- Every header logo, operator and developer alike, is drawn in the page's primary colour (white for marks on a coloured ground, the scheme's pale tone for a second colour): SVGs get their fills replaced, white-on-transparent rasters go through `tools/recolor_logo.ps1` (flat colour, alpha kept, soft downscale; the old `invertToNavy` CSS filter came out black with hard edges), coloured rasters with a white mark (DTG, DB) through `tools/tint_logo.ps1`; keep the original beside the tinted copy (`logo-dtg-navy.png`, `logo-dtg-nsblue.png`, `logo-dtg-dbgrey.png`, `logo-db-grey.png`). Logos live in `tools/assets/`.
- `recolor_logo.ps1 -AlphaOnly` keeps the full alpha of a coloured mark on a transparent ground (LNWR); without it the coverage is scaled by brightness, which washes a green or red mark out.
