# Gotchas learned

Read before probing a lever, writing an mk script for a new vendor or lever type, or when a capture shows a main lever with one notch. Add a new gotcha under the heading it belongs to, with the train and the date.

## Profile values and the app

- Numeric `step_thresholds` are mirrored when `invert` is true; express them on the raw lever axis. A dead band around a notch is done with `threshold_tolerance`; a continuous zone is a `null` step with `threshold`..`threshold_end` (BR 440 and SNG combined handles: 0 at raw 0.5 with tolerance 0.07–0.08, free brake and power zones either side).
- Push buttons toggle on every value change through the mod, so a `momentary` 1-then-0 toggles twice. Use `toggle`.
- Spring switches (horn, sander, cab light, PZB buttons) rest at 0.5; send 1 or 0 while held and 0.5 on release.
- The gear lever is the safety acknowledge: AWS reset (UK), SiFa (Germany), and on Dutch stock the deadman pedal, since ATB has no acknowledge button. Setting the ICMm `DeadmanPedal` through the API moves the pedal but does not clear the warning, so Dutch stock uses the game key `Q` on the gear lever (user test, 2026-10-10).
- Notch beeps / "lever wobbles" on a stepped handle (Class 171, 2026-10-10, fixed): the app raises a change event on every axis reading and re-sends the step value each time (no "unchanged, skip" check; inside a band it sends the same value, in a gap nothing), and the mod re-applies it to the lever. A re-send is only silent when the value is exactly what the game stores. Two things made it audible: (1) the game snaps a lever set through the mod to its own notch positions (171 power notches are k/14), and a step value a hair *below* such a position re-snaps with a click on every re-send (P1, P4, P5 were below, P2, P3, P6 above and silent): read the lever's `InputValue` after the TCA has set it (`node tools/probe_lever.js <Lever>` shows stored value, output and notch per set value) and put the step values on or 0.0002 above what the game stores; (2) pot noise on a band edge: the TCA throttle levers have detents at raw ≈0.31 (idle), ≈0.44 (soft stop), ≈0.724 (CL), ≈0.84 (FLX) and 1.0 (TOGA) (`tools/joyread.ps1` logs the raw axes, X = left, Y = right throttle), so centre a band on each detent and keep band edges 0.02 away. The calibration file has `anti_jitter` 0.008 on the four levers so a lever that has rested for a second does not re-send on noise.
- Cab side: `IS_GetActiveCab` fails or answers false/false on most locos (43, 66, 86, 87, 90, 220). `CurrentDrivableActor.Function.GetActiveCab` (without `IS_`) works on such a loco and follows the seat, and the app resolves `{SIDE:F:B}` on it anyway (Class 31, user seated, 2026-10-11), so use the placeholder (`Reverser_{SIDE:F:B} (IrregularLever)`, `Horn_{SIDE:F:B}L`); a profile hard-wired to `_F` keeps driving the F cab after a cab change. Check `GetActiveCab` with the user seated before switching an F-wired loco: with both flags false the placeholder drops every command. `node tools/apply_side.js profiles/<file>.json` does the rewrite from the capture (nodes without a B twin stay on F) and the `tools/mk` scripts call it last; rolled out to all 23 F-wired locos on 2026-10-11, only the 31 tested.
- The app's API-key auto-detect does not see the OneDrive Documents path; the key path is set in the app settings.

## Combined handles

- SNG `MasterController` (identifier `Throttle`) runs -1..1: Emergency -1, Max Brake -0.9, the game snaps inputs -0.06..-0.10 to min brake (-0.1, 5 %) and 0.05..0.10 to 5 % power (0.1), 0 is -0.05..0.04, beyond ±0.1 brake and power are continuous. The profile gives min brake and 5 % power their own notches beside a 0 dead band (raw 0.5 ±0.02, user-tuned) and free zones outside them. `direct_control` takes negative `min`/`steps` (Class 323 precedent). Through the API the handle once stuck at -0.1 when sent 0 straight from -0.9; `capture_train.js` ramps on restore. The sweep covers the lever's own range since 2026-10-10 (`--range` to clip).
- BR 440 `MasterController` is 0..1: Emergency 0..0.04, max brake snapped 0.1, brake continuous 0.10..0.40, min brake 0.41 (0.41..0.45), 0 at 0.46..0.54, min power 0.59 (0.55..0.59), power continuous 0.60..1; one API set crosses at most one of those gates (probe in `tools/captures/RVM_NWB_DB_BR440_0_C_handle_probe.txt`). The DTG 423 / 425 / 430 handles are the BR 440 one with the 423 gates at 0.36 / 0.65.
- Both handles use the same lever geometry: max brake at raw 1 ±0.04, free brake zone to 0.58, min brake 0.55 ±0.03, 0 at 0.5 ±0.02, min power 0.45 ±0.03, free power zone from 0.42, full at 0 ±0.04.

## Vendor interlocks

- Just Trains 86/87 (2026-10-11): the reverser, train brake and loco brake are free only with the master key (`MasterKeySwitch_F`, identifier MasterSwitch) AND the brake key (`CabChangeLever_F`, BrakeKey) in; their reverser is named `MasterSwitch_F` (the capture script ignores driving levers when it looks for keys); Reverse needs the `ReverserLockButton` held.
- Rivet Voyager (220): the reverser moves only while the combined handle is in Emergency, so its profile keeps Emergency on the handle.
- ATS Class 90: the straight air brake springs back to Hold within 400 ms of any set above 0.5, so it is left off the TCA.
- TSG BR 628: the brake valve (`TrainBrake`) only moves with `TrainBrakeCutoff` (MoveToLap) at Cut In; the sweep sees one notch otherwise. Its Release position never stores (spring).
- DTG Talent 2 (BR 442): the reverser ignores API sets until `MasterSwitch` is set to On again, even when it already reads 1.
- Rivet GBR 802 and Thameslink 700: the handles move one gate per API set (ramp them, as the BR 440).
- DTG 805 / 807 store power as four notches at k/4, while the 801 and the Rivet 802 store the set value above Power 1.
- DTG BR 155 (2026-10-11): the reverser and brake valve only move with `DriversBrakeKey_F` (identifier MoveToLap, a lever, On 0.89) in, and the reverser LOCKS while the `ReverserHandle_F` MasterSwitch push button reads 1. `capture_train.js` presses every MasterSwitch button it finds before a sweep, which locked the 155 reverser in both runs; `--no-keys` skips that step (set the keys by hand through `tools/tswapi.js` first). Its handwheel `TapChanger_F` stores Fahrstufe k at 0.10 + 0.03 k and moves one step on the first API set from rest, then jumps.
- Spawned locos start with cold keys (DTG BR 147: brake valve cut out, desk inactive, PZB / SiFa / LZB isolated; after activating, both sides of its combined handle are continuous, output = (|input|-0.1)/0.9). Details in `tools/CAPTURE_SPAWN.md`.

## Environment

- Pak class names can contain hyphens (`Class377-3`, `SD40-2`), so keep `-` in the grep class. Newer paks (Medway Valley, Birmingham–Crewe, Tadami, BR 147) store names without the `.uasset` suffix and far from the end: grep the whole file for `RVM_[A-Za-z0-9_-]*` instead. Some vendors put the prefix later (`DB_767pbzfa_RVM`, `AC4400CW_RVM`, `LZN_523_RVM_*`).
- TSW 7 leaks memory over a long capture session (2026-10-12, after about twelve services in a row): its commit charge grew to 16 GB, the page file hit 47 of 49 GB and Claude Code killed `capture_train.js` mid-sweep (JT Class 20). Step 0 of `tools/CAPTURE_AGENT.md` relaunches the game when free commit drops under 2 GB.
- The mod installer deletes `dxgi.dll` in the game's Win64 folder, which is OptiScaler. Keep `dxgi.dll.optiscaler` as backup and restore it after a mod install.
- Word exports of the templates come out as two pages unless trailing paragraphs are dropped; the specs already do that.
- Git identity is set locally in this repo. README uses CRLF line endings.
