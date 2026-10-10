# HANDOFF — status of the collection rollout

Short status page, updated with each train. The rules and the recipe live in `CLAUDE.md`, the pipeline in `tools/README.md`, the subagent brief in `tools/CAPTURE_AGENT.md`. A new session needs nothing else: "continue with the NS SNG" is a complete prompt.

## Done (2026-10-10)

- Phase A tooling: `capture_train.js`, `draft_profile.js` (+ `families.json`), `draft_manual.js`, `readme_status.js` (+ `trains.json`), `crop_image.ps1`, `stitch_cars.ps1`, `tsw_input.ps1`. Verified: the drafter regenerates the Class 153 profile from its capture.
- Phase B: desktop computer-use tools never appeared in the session; `tools/tsw_input.ps1` (PowerShell screenshots + simulated input) drives the TSW menus reliably instead, and a capture subagent runs that loop (`tools/CAPTURE_AGENT.md`).
- NS SNG (2026-10-10): captured as `RVM_ZGN_NS_SNG3_Cab_mBk_C` (the 11:20 SPR service leads with the mBk car), profile `tsw-ns-sng-dtg-thejag-1791600993`, schematic manual with desk photo and Arthur's 3-car drawing, release built, cab-tested by the user, README `DONE ✅`. Combined power/brake handle continuous on the right TCA throttle (-0.9..1, 0 dead band raw 0.5 ±0.02 with fixed min-brake -0.1 and 5 %-power 0.1 notches beside it, free brake and power zones outside, Emergency left out; user decisions), left throttle unassigned, headlight intensity on the flap lever, parking brake apply/release on the left/right throttle buttons, slow-speed mode on the round aux, signal lights on AUTO BRK.
- NS ICMm: recaptured (`tools/captures/RVM_ZGN_NS_ICMm3_mBfk_C.json`), profile cleaned (direct controls, ATB/deadman fuses on the aux squares, traction reduction on the left throttle button), new schematic manual with the desk photo band and Arthur's 3-car drawing, release rebuilt, legacy docx removed. README stays `DONE ✅`; the user still has to drive it with the new profile once (notch pill orientation: lever forward = raw 0, see CLAUDE.md).

## Next, one train at a time (user decision 2026-10-10: no batches yet)

1. DB BR 440 revisit (in progress 2026-10-10): capture + handle probe by the subagent, then the SNG-style handle (fixed notches beside a narrow 0 band, free zones), cab band, manual re-render.
2. Class 153 recapture (its capture file is synthetic) and cab-side check, then its manual gets the cab band and a full-consist drawing.
3. Then the UK order from the plan (`~/.claude/plans/starry-honking-puddle.md`), Germany after.

## Open points

- The Class 153 manual's reverser pill order was written before the orientation rule; check it with the recapture.
- The BR 440 and Class 333 manuals still have the old controller block instead of a cab band; redo when those trains are revisited.
- `tools/assets/logo-ns.svg` is the Commons PD logo; Arthur's site has no logos.
