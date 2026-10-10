# Brief for a capture subagent (one train in TSW 7)

You drive Train Sim World 7 on the user's PC through `tools/tsw_input.ps1` (screenshots and simulated mouse/keyboard), load one train, capture its controls with `tools/capture_train.js` and take a photo of the driver's desk. Report back; do not edit profiles, manuals or git. Repo root: `C:\Users\m_jag\AppData\Roaming\tswcontrollerapp\config`. Screen: 3440×1440, TSW runs borderless; all coordinates below are full-resolution pixels. Screenshots: `powershell -NoProfile -File tools/tsw_input.ps1 shot 0.5 <file>` writes a half-size PNG (coordinates ×2 to click); look at it with the Read tool. Run every helper call from the repo root.

## Inputs you get

Route name, train name (as on the timetable tile, e.g. "SNG3 - mABk"), family hints, and whether a previous capture exists (`tools/captures/<ObjectClass>.json`).

## Loop

1. `tsw_input.ps1 focus`, screenshot. Decide where the game is: home screen, route menu, in a session, or a pause menu.
2. If in a session: `key 27` (Esc), click the Options tab (710,194), Main Menu (970,575), Yes (1530,728), wait 14 s.
3. Home screen: To the Trains (1340,620) → Choose a Route (970,780). The route grid shows tiles at x 840 / 1344 / 1850 and y 550 / 750 / 954, sorted by recently played; the search box is at (1256,338) (`keys` types upper-case letters, 32 = space). Click the route tile, then Timetable (870,720) (Scenarios 1436, Training 2000, Free Roam 2566 at the same y).
4. Train tiles (same grid, first row y 548, second row y 750). Click the train, then the service layer button on the right (2400,610).
5. Service list: rows at y 500, 596, 692, 788, 884, 980, 1076, 1172 (x 836). Scroll with `wheel -25` over (1100,900) per hour of timetable. Pick a service that starts between 11:00 and 15:00 and starts at a station where the train stands ready (a full run of the route, not a 0:09 shunt). Screenshot to confirm the selected row and the "Drive this service from X to Y" text.
6. Weather: click ▶ at (2780,480) once; the Dynamic Weather "Clear" preset is fine. Get Started (2516,1150). Wait 60 s, screenshot: the role screen appears; click Driver (1340,740). Wait 75 s, screenshot: the service card; click its Get Started (1720,1048).
7. Confirm the cab through the API: `curl -s -H "DTGCommKey: $(cat "C:/Users/m_jag/OneDrive/Documenten/My Games/TrainSimWorld7/Saved/Config/CommAPIKey.txt")" http://127.0.0.1:31270/get/CurrentDrivableActor.ObjectClass`. If it answers with a class, you are in the cab.
8. Desk photo first (before the sweep moves levers): `key 112` (F1 hides the HUD), `mmove 0 95` (tilt down so the whole desk and a strip of windscreen show), `shot 1 <scratch>\cab-<slug>.png`, then `key 112` again. Check the shot: no HUD, no menus, desk fully visible, daylight. Crop: `powershell -NoProfile -File tools/crop_image.ps1 -In <shot> -Out tools/assets/<slug>-cab.jpg -X 0 -Y 0 -W 3440 -H 1100 -MaxWidth 1900`.
9. Capture: `node tools/capture_train.js` (3–5 minutes; it turns the keys on, puts a mode selector into Driving and the reverser into Neutral or Forward for the throttle, sweeps every lever and restores everything). Read the printed table. Every main lever (reverser, throttle or combined handle, train brake) must show more than one notch. If one shows a single notch, run `node tools/capture_train.js --levers <Name>,<Name>` once more (it merges into the existing file). Do not probe interlocks by hand beyond that; report it.
10. Leave the game in the cab. Do not quit, save, or change settings.

## Pitfalls

- Clicks only land when the TSW window is in front; call `focus` after any other window may have taken focus.
- If another window (a browser) covers the game, `focus` may report success without bringing TSW to the front; clicking the TSW taskbar icon (about 2006,1416) does.
- A negative `wheel` count is parsed as 0 through `powershell -File`; call it as `powershell -NoProfile -Command "& ./tools/tsw_input.ps1 wheel '-25'"`.
- The desk of some units sits low in the frame (313/314): tilt further (`mmove 0 70` more) and crop from Y 250–300 instead of 0.
- The pause menu opens on the tab used last; always click the Options tab before Main Menu.
- Master key and brake key are push buttons; the capture script reads their state and toggles only when needed. Toggling them by hand can lock a brake handle in Off for the rest of the session (then reload the service).
- The throttle of some units (ICMm) only moves with the reverser in Forward; the script retries that itself with the brakes applied and, since 2026-10-11, the handbrake set or pulsed for the retry (the BR 112 crept and ended its service before that). If the end-of-service screen appears during a sweep, kill the script, reload the service and run  then  for the main levers.
- Two-cab units with per-cab node names (`L_…`/`S_…`) are detected and reported as `cab.pair`.
- The ICMm shows how a finished capture looks: `tools/captures/RVM_ZGN_NS_ICMm3_mBfk_C.json`.

## Report

ObjectClass, capture file path, `cab.pair`, for each main lever the notch list (index, name, snapped value), levers that stayed at one notch, push buttons with an identifier (name, identifier, named values), the cab photo path and what it shows, and anything odd on screen (warnings, a locked handle, a moving train). Keep it under 60 lines.
