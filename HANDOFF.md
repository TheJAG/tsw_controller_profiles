# HANDOFF — status of the collection rollout

Short status page, updated with each train. The rules and the recipe live in `CLAUDE.md`, the pipeline in `tools/README.md`, the subagent brief in `tools/CAPTURE_AGENT.md`. A new session needs nothing else: "continue with the NS SNG" is a complete prompt.

## Done (2026-10-10)

- Phase A tooling: `capture_train.js`, `draft_profile.js` (+ `families.json`), `draft_manual.js`, `readme_status.js` (+ `trains.json`), `crop_image.ps1`, `stitch_cars.ps1`, `tsw_input.ps1`. Verified: the drafter regenerates the Class 153 profile from its capture.
- Phase B: desktop computer-use tools never appeared in the session; `tools/tsw_input.ps1` (PowerShell screenshots + simulated input) drives the TSW menus reliably instead, and a capture subagent runs that loop (`tools/CAPTURE_AGENT.md`).
- NS SNG (2026-10-10): captured as `RVM_ZGN_NS_SNG3_Cab_mBk_C` (the 11:20 SPR service leads with the mBk car), profile `tsw-ns-sng-dtg-thejag-1791600993`, schematic manual with desk photo and Arthur's 3-car drawing, release built, cab-tested by the user, README `DONE ✅`. Combined power/brake handle continuous on the right TCA throttle (-0.9..1, 0 dead band raw 0.5 ±0.02 with fixed min-brake -0.1 and 5 %-power 0.1 notches beside it, free brake and power zones outside, Emergency left out; user decisions), left throttle unassigned, headlight intensity on the flap lever, parking brake apply/release on the left/right throttle buttons, slow-speed mode on the round aux, signal lights on AUTO BRK.
- DB BR 440 revisited (2026-10-10): real capture `tools/captures/RVM_NWB_DB_BR440_0_C.json` + handle probe, profile cleaned (direct controls only) with the SNG handle geometry (Emergency left out, 0 band ±0.02), manual with cab band, train brake pills in orientation order (Drive on top), start dot at Max brake; cab-tested by the user ("handles quite nicely"). No side view (user choice: Commons has no drawing of the Coradia Continental and the photo was too small); the renderer spreads the checklists and the cab band over the free space (`nodiag`).
- NS ICMm: recaptured (`tools/captures/RVM_ZGN_NS_ICMm3_mBfk_C.json`), profile cleaned (direct controls, ATB/deadman fuses on the aux squares, traction reduction on the left throttle button), new schematic manual with the desk photo band and Arthur's 3-car drawing, release rebuilt, legacy docx removed. README stays `DONE ✅`; the user still has to drive it with the new profile once (notch pill orientation: lever forward = raw 0, see CLAUDE.md).
- BR Class 153 redone (2026-10-10): real capture `tools/captures/RVM_TFW_Class153_PRM_C.json` (Cardiff City Network, 2C34 Penarth–Coryton, single car, cab pair L/S), profile `tsw-class-153-dtg-thejag-1791606571` drafted from it: train brake on the left TCA throttle and power handle on the right as in the Sprinter cab (desk photo: brake with its round base on the left, throttle slot on the right), throttle inverted (forward = 7), reverser 0..0.75 inverted (forward = Forward, back = Off), AWS reset stays key Q like the 333, sander as direct control. Manual with cab band, pills in orientation order (Forward / Release / 7 on top), start dots Off / Full service / Off, drawing credited to Vauxhallvauxhall (Commons CC BY-SA 4.0; Arthur's site has no British DMUs). First cab test (user): throttle and brake went the wrong way; profile fixed (throttle plain, brake inverted). Second check (user): the cab now works the right way (power pulled towards you, brake pushed away) and the manual pills must match the cab: Off / Emergency / Forward at the top (far end), 7 / Release / Off at the bottom (nearest the driver), which is the drafter's default from the profile. Lever direction rule written into CLAUDE.md (four steps). The ICMm, SNG and BR 440 manuals were right as drafted. Headlight dial dot is always on Off. README still `SOON 🟨`: second cab test pending.

## Next, one train at a time (user decision 2026-10-10: no batches yet)

2. (done) Class 153 cab-tested and released.
3. Then the UK order from the plan (`~/.claude/plans/starry-honking-puddle.md`), Germany after.

## Open points

- The Class 333 manual still has the old controller block instead of a cab band; redo when it is revisited.
- `tools/assets/logo-ns.svg` is the Commons PD logo; Arthur's site has no logos.
