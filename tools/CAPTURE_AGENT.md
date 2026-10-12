# Brief for a capture subagent (one train in TSW 7)

You drive Train Sim World 7 on the user's PC through `tools/tsw_input.ps1` (screenshots and simulated mouse/keyboard), load one train, capture its controls with `tools/capture_train.js` and take a photo of the driver's desk. Report back; leave profiles, manuals and git to the orchestrator. Repo root: `C:\Users\m_jag\AppData\Roaming\tswcontrollerapp\config`; run every helper from there. Screen: 3440×1440, TSW runs borderless; all coordinates below are full-resolution pixels. The user's browsers and other programs stay open.

Screenshots: `powershell -NoProfile -File tools/tsw_input.ps1 shot <scale> <file>`, then look with the Read tool. Use scale 0.35 to confirm where you are in the menus (trial since 2026-10-12: if the text is unreadable, use 0.5 and say so in the report); use 0.5 (coordinates ×2) for the service list, for finding a click target and for the cab check.

## Inputs you get

Train name (as on the timetable tile), DLC pak, output slug for the cab photo, the service wanted, what the desk should hold, and precedent entries in `HANDOFF.md` to read. The brief may say "spawn": then use `tools/CAPTURE_SPAWN.md` instead of steps 2–6.

## Loop

0. Free memory first: TSW 7 leaks over a long run. `powershell -NoProfile -Command "(Get-CimInstance Win32_OperatingSystem).FreeVirtualMemory"` gives KB. Under 2 000 000: quit the game (Esc, Options tab (710,194), Exit Game, Yes; a "Fatal Error" dialog on exit is known and may hide behind a browser window, close it), confirm with `Get-Process TrainSimWorld*` that nothing remains, relaunch with `powershell -NoProfile -Command "Start-Process steam://rungameid/4678800"` (keeps the `-HTTPAPI` launch option; launch options stay as they are), wait about 90 s, get past the attract demo and the press-any-key screen.
1. `tsw_input.ps1 focus`, screenshot. Decide where the game is: home screen, route menu, in a session, or a pause menu.
2. If in a session: `key 27` (Esc), click the Options tab (710,194), Main Menu (970,575), Yes (1530,728), wait 14 s.
3. Home screen: To the Trains (1340,620) → Choose a Route (970,780). The route grid shows tiles at x 840 / 1344 / 1850 and y 550 / 750 / 954, sorted by recently played; the search box is at (1256,338) (`keys` types upper-case letters, 32 = space). Click the route tile, then Timetable (870,720) (Scenarios 1436, Training 2000, Free Roam 2566 at the same y).
4. Train tiles (same grid, first row y 548, second row y 750). Click the train, then the service layer button on the right (2400,610).
5. Service list: rows at y 500, 596, 692, 788, 884, 980, 1076, 1172 (x 836). Scroll with `wheel -25` over (1100,900) per hour of timetable. Pick a service that starts between 11:00 and 15:00 at an open station where the train stands ready, with the wanted cab leading (push-pull sets are cab-car-led one way), a full run of the route rather than a short shunt. Screenshot to confirm the selected row and the "Drive this service from X to Y" text.
6. Weather: click ▶ at (2780,480) once; the Dynamic Weather "Clear" preset is fine. Get Started (2516,1150). Wait 60 s, screenshot: the role screen appears; click Driver (1340,740). Wait 75 s, screenshot: the service card; click its Get Started (1720,1048).
7. Confirm the cab through the API: `curl -s -H "DTGCommKey: $(cat "C:/Users/m_jag/OneDrive/Documenten/My Games/TrainSimWorld7/Saved/Config/CommAPIKey.txt")" http://127.0.0.1:31270/get/CurrentDrivableActor.ObjectClass`. If it answers with a class, you are in the cab.
8. Desk photo first (before the sweep moves levers): `key 112` (F1 hides the HUD), `mmove 0 95` (tilt down so the whole desk and a strip of windscreen show), `shot 1 <scratch>\cab-<slug>.png`, then `key 112` again. Check the shot: no HUD, no menus, desk fully visible, daylight. Crop: `powershell -NoProfile -File tools/crop_image.ps1 -In <shot> -Out tools/assets/<slug>-cab.jpg -X 0 -Y 0 -W 3440 -H 1100 -MaxWidth 1900` (about 3.1:1; down to 2.6:1 when the desk sits low and the handle quadrant would be cut).
9. Capture. Bring TSW to the front (`focus`, or the taskbar icon), then run the sweep in the foreground with the Bash timeout at 600000 and the output in a log, and read the log when it returns:
   ```
   node tools/capture_train.js > <scratch>/cap.log 2>&1; tail -80 <scratch>/cap.log
   ```
   A foreground run keeps you working on one tool call for the 3–5 minutes of the sweep; a background run with polling wakes the orchestrator on every turn you end, so the sweep always runs in the foreground. The script has no `--help`; its options are on line 3 of `tools/capture_train.js` (`--no-sweep`, `--no-keys`, `--levers A,B`, `--cab L`, `--step`, `--range lo,hi`). It turns the keys on, puts a mode selector into Driving and the reverser into Neutral or Forward, sweeps every lever and restores everything.
10. Every main lever (reverser, throttle or combined handle, train brake) must show more than one notch. For one that shows a single notch, probe it: put the reverser in Forward if the lever needs it, set the key-like nodes (identifier MasterSwitch, BrakeKey, MoveToLap; cycle a reverser handle button) through `tools/tswapi.js`, then `node tools/probe_lever.js <Lever> --from 0 --to 1 --step 0.05` and report the stored positions. Run `node tools/capture_train.js --levers <Name>` once more only if the probe leaves it unexplained (it merges into the existing file). The sweep's snapped values for reversers and brakes are often artefacts: confirm the stored values of every main lever with `probe_lever.js --values ...`.
11. Leave the game in the cab, stationary. No quitting, saving or settings changes after the capture.

## Pitfalls

- Clicks only land when the TSW window is in front; call `focus` after any other window may have taken focus. If a browser covers the game, `focus` may report success without bringing TSW to the front; clicking the TSW taskbar icon (about 2006,1416) does.
- A negative `wheel` count is parsed as 0 through `powershell -File`; call it as `powershell -NoProfile -Command "& ./tools/tsw_input.ps1 wheel '-25'"`.
- The desk of some units sits low in the frame (313/314): tilt further (`mmove 0 70` more) and crop from Y 250–300 instead of 0.
- The pause menu opens on the tab used last; always click the Options tab before Main Menu or Exit Game.
- If no `TrainSimWorld` process is running (a crash), relaunch as in step 0 and report the crash folder from `My Games\TrainSimWorld7\Saved\Crashes`.
- Locos often load part cold or as a trailing unit (brake mode Trail / Test, generator field off, fuses at 0); report such switches and their values. Bail-off levers are springs. Some brake handles move one gate per API set; `probe_lever.js` ramps, a plain set does not.
- A MasterSwitch push button that the script "switches on for the sweep" can be the wrong way round: the BR 155 reverser locks while `ReverserHandle_F` reads 1. If a main lever still shows one notch after the probe and the script printed such a line, rerun with `--no-keys` and report both results.
- Master key and brake key are push buttons; the capture script reads their state and toggles only when needed. Toggling them by hand can lock a brake handle in Off for the rest of the session (then reload the service).
- The throttle of some units (ICMm) only moves with the reverser in Forward; the script retries that itself with the brakes applied and the handbrake set or pulsed. If the end-of-service screen appears during a sweep, kill the script, reload the service and run `--no-sweep` then `--levers` for the main levers.
- Two-cab units with per-cab node names (`L_…`/`S_…`) are detected and reported as `cab.pair`.
- More vendor interlocks and lever behaviour: `tools/GOTCHAS.md`. A finished capture looks like `tools/captures/RVM_ZGN_NS_ICMm3_mBfk_C.json`.

## Report

Under 60 lines: ObjectClass, capture file path, route and service used, `cab.pair`, for each main lever its stored positions with raw input and output values, levers that stayed at one notch and what the probe found, push buttons with an identifier (name, identifier, named values), switches that loaded cold, the cab photo path, size and what it shows, free memory before and after, problems, and the game state you leave behind.

## Brief template (for the orchestrator)

```
Read tools/CAPTURE_AGENT.md completely and follow it.
Train: <name on the tile> (<developer>). Pak: <pak> (grep <pattern> in tools/pak_classes.txt). Slug: <slug>.
Service: <route>, around midday, <cab> leading, from <station>.
Expect: <main levers and desk switches>.
Precedent: HANDOFF.md entries for <similar trains>.
```
