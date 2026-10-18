// Freightliner Class 70 (All Aboard Studios for DTG, "TSW 7: Freightliner BR Class 70", 2026-10-18; WCML Trent Valley and Midland
// Main Line). Cab pair F_/B_ by prefix, but GetActiveCab and IS_GetActiveCab both fail on this loco, so the F cab is wired by name
// (no apply_side; swap F_ for B_ by hand if the user drives from the B cab). GE stand, left to right on the desk: independent brake,
// automatic brake, throttle, reverser; the manual says push away to apply the brakes and to open the throttle, so all four levers
// are inverted. Probe 2026-10-18 (Fable, key on): F_Reverser -1 / 0 / 1, any value in a zone snaps (0.99 -> 1, 0.5 -> 1, 0.01 -> 0);
// the first set after the master key goes on is refused (DTG one-event lag), so the reverser is doubled as the F7 / SD70ACe.
// F_Throttle stores Idle 0.2 and N1..N8 at 0.3..1.0 (0.35 -> 0.3, 0.95 -> 1), moves only in Forward. F_AutomaticBrake Release 0 /
// Minimum Reduction 0.2 / Service 0.21..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.8 (loads here) / Emergency 1.
// F_IndependentBrake Release 0.2 / continuous 0.25..1, Bail Off below 0.2 is a spring; the AutoBrakeBailOff button does it instead.
// F_DynamicBrake stores the automatic brake's table and does nothing on its own: left off. Loads cold: master keys and Cab Enable
// 0, AWS/TPWS full isolation and DVD Isolated, brake mode Goods, MU-2A valve Lead, parking brake released.
// SPLIT NODES (Fable, live API, 2026-10-18 after the user's first drive stuck at 5 mph): the F_ levers of the automatic brake and
// the reverser are the cab's visuals only. The 26C brake valve follows the bare `AutomaticBrake` node (at load 0.8 = Handle Off,
// which cuts the brake pipe off; F_AutomaticBrake at Release left EQ at 0 bar, AutomaticBrake at Release charged BP to 5 bar in
// 8 s), and traction direction follows the bare `Reverser` (F_Reverser Forward + N1 gave target power but no movement, bare
// Reverser Forward moved the loco), while F_Reverser Forward is what unlocks the throttle lever. So the profile sends both nodes.
// F_Throttle moves one notch per set from Idle (0.2 -> 0.5 stores 0.3, the next set goes anywhere), so the throttle is doubled
// with the SAME values (a second identical set passes; the earlier +0.01 doubling made the cab lever wobble on every re-send).
// Bail-off: AutoBrakeBailOff 1 (the SA26 fills its actuating pipe) and F_IndependentBrake 0 with Interacting both leave the loco
// brake cylinder where it is under a Full Service application; kept on the round aux for the user's test.
const { load, save, writeManual, pakClasses, mom, tog, momA, key, set } = require('./lib');
const { f, dlc, p } = load('store.steampowered.com/app/4680650');
p.name = 'TSW | Class 70 | DTG | TheJAG';
p.rail_class_information = pakClasses(/^(CL70_FL_RVM|RVM_AABS_Class70(New)?)$/);
const R = 'F_Reverser', TH = 'F_Throttle', AB = 'F_AutomaticBrake', IB = 'F_IndependentBrake', MK = 'F_MasterKey', CE = 'F_CabEnable',
  HORN = 'EngineersHorn_F (Irregular Lever)', WL = 'F_WindscreenWiper_L (SimpleLever)', WR = 'F_WindscreenWiper_R (SimpleLever)', HL = 'F_HeadlightSelectorKnob';
const lights = v => ({ name: 'AutoBrake' + v, description: 'Lights | ' + ['Off', 'Day', 'Night', 'Marker', 'Tail', 'Hazard'][v] + ' (' + HL + ' ' + v + ')', assignments: [set(HL, v)] });
p.controls = [
  { name: 'SpeedbrakeLever', description: 'Reverser (Reverse -1 / Neutral 0 / Forward 1; any value in a zone snaps), inverted: Forward at the far end, Reverse nearest. Two nodes: F_Reverser is the cab lever and unlocks the throttle, the bare Reverser gives the traction direction. The first set after the master key goes on may be refused: move it again', assignments: [
    { type: 'direct_control', controls: R, input_value: { min: -1, max: 1, steps: [-1, 0, 1], invert: true } },
    { type: 'direct_control', controls: 'Reverser', input_value: { min: -1, max: 1, steps: [-1, 0, 1], invert: true } }] },
  { name: 'LeftThrottle', description: 'Automatic brake (Release 0 / Minimum Reduction 0.2 / service continuous 0.21..0.6 / Full Service 0.65 / Suppression 0.7 / Handle Off 0.8 / Emergency 1), inverted as on the desk (push away to apply): Emergency at the far end (raw 0 +-0.04), Handle Off 0.1 +-0.04, Suppression 0.2 +-0.04, Full Service 0.3 +-0.04 on the idle detent, service zone 0.36..0.86, Minimum 0.9 +-0.03, Release 1 +-0.06 nearest. Two nodes: the bare AutomaticBrake drives the 26C brake valve (it loads in Handle Off, brake pipe cut off), F_AutomaticBrake only moves the cab lever', assignments: [
    { type: 'direct_control', controls: 'AutomaticBrake', input_value: { min: 0, max: 1, steps: [0, 0.2, null, 0.65, 0.7, 0.8, 1], invert: true, step_thresholds: [{ threshold: 1, threshold_tolerance: 0.06 }, { threshold: 0.9, threshold_tolerance: 0.03 }, { threshold: 0.86, threshold_end: 0.36 }, { threshold: 0.3, threshold_tolerance: 0.04 }, { threshold: 0.2, threshold_tolerance: 0.04 }, { threshold: 0.1, threshold_tolerance: 0.04 }, { threshold: 0, threshold_tolerance: 0.04 }] } },
    { type: 'direct_control', controls: AB, input_value: { min: 0, max: 1, steps: [0, 0.2, null, 0.65, 0.7, 0.8, 1], invert: true, step_thresholds: [{ threshold: 1, threshold_tolerance: 0.06 }, { threshold: 0.9, threshold_tolerance: 0.03 }, { threshold: 0.86, threshold_end: 0.36 }, { threshold: 0.3, threshold_tolerance: 0.04 }, { threshold: 0.2, threshold_tolerance: 0.04 }, { threshold: 0.1, threshold_tolerance: 0.04 }, { threshold: 0, threshold_tolerance: 0.04 }] } }] },
  { name: 'RightThrottle', description: 'Throttle F_Throttle (Idle 0.2 / N1..N8 at 0.3..1.0, the stored values), inverted as on the desk (push away for power): N8 at the far end, Idle nearest; nine equal bands. Sent twice with the same value: from Idle the game takes only one notch per set (0.5 stores 0.3), the second set lands on the notch. Moves only with the reverser in Forward', assignments: [
    { type: 'direct_control', controls: TH, input_value: { min: 0.2, max: 1, steps: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], invert: true } },
    { type: 'direct_control', controls: TH, input_value: { min: 0.2, max: 1, steps: [0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1], invert: true } }] },
  { name: 'FlapLever', description: 'Independent (loco) brake F_IndependentBrake, continuous: Release 0.2 nearest, full application 1 at the far end (inverted). Bail Off is the round aux', assignments: [
    { type: 'direct_control', controls: IB, input_value: { min: 0.2, max: 1, invert: true } }] },
  { name: 'ParkingBrake', description: 'Cab Enable (F_CabEnable 1 / 0, the loco loads with it off) and master key (F_MasterKey MasterSwitch 1 / 0). PARK BRK up = in; wait a few seconds before the first reverser move', assignments: [momA(CE, 1, 0), momA(MK, 1, 0)] },
  key('GearLever', 'AWS reset / vigilance acknowledge', 'Q'),
  mom('LeftThrottleButton', 'Sand (Sand push button, held)', 'Sand', 1, 0),
  mom('RightThrottleButton', 'Engine start (F_Button_EngineStart, held; the engine stops itself when parked at Idle with the brakes on)', 'F_Button_EngineStart', 1, 0),
  mom('LeftEngineOn', 'Horn | High (EngineersHorn_F 1 while up, 0.5 rest)', HORN, 1, 0.5),
  mom('RightEngineOn', 'Horn | Low (EngineersHorn_F 0 while up, 0.5 rest)', HORN, 0, 0.5),
  key('RudderTrimLeft', 'Doors | Left', 'y'),
  key('RudderTrimRight', 'Doors | Right', 'u'),
  { name: 'RoundAuxButton', description: 'Bail off: pushes the direct brake lever F_IndependentBrake down into its spring Bail Off position (0, held) while the button is held, back to Release 0.2 on release; the AutoBrakeBailOff push button is sent as well. Through the API neither released the loco brake cylinder under a train brake application (2026-10-18), user test pending', assignments: [
    { type: 'momentary', threshold: 0.9, action_activate: { controls: IB, value: 0, hold: true }, action_deactivate: { controls: IB, value: 0.2, hold: false } },
    momA('AutoBrakeBailOff', 1, 0)] },
  tog('LeftAuxButton', 'AWS / TPWS full isolation switch (F_Switch_TpwsFullIsolation Normal 1 / Isolated 0). Lit = Normal; loads Isolated', 'F_Switch_TpwsFullIsolation', 1, 0),
  tog('RightAuxButton', 'DVD (vigilance) isolation switch (DVD_IsolatorSwitch Normal 1 / Isolated 0). Lit = Normal; loads Isolated', 'DVD_IsolatorSwitch', 1, 0),
  { name: 'RotaryCrank', description: 'Wipers off (both F_WindscreenWiper levers 0)', assignments: [set(WL, 0), set(WR, 0)] },
  { name: 'RotaryIgnStart', description: 'Wipers on (both F_WindscreenWiper levers 1)', assignments: [set(WL, 1), set(WR, 1)] },
  lights(0), lights(1), lights(2), lights(3), lights(4), lights(5),
];
save(f, p);
writeManual({
  name: 'tsw-class-70-dtg-thejag', title: 'Class 70', eyebrow: 'Freightliner · All Aboard Studios / Dovetail Games · TCA Quadrant Airbus', profileName: p.name,
  developer: 'All Aboard Studios (published by Dovetail Games)', route: 'WCML Trent Valley: Crewe – Milton Keynes · Midland Main Line',
  colors: { navy: '#223261', blue: '#4a66a8', paper: '#f3f5f9' },
  logos: [{ file: '../../assets/logo-freightliner-navy.svg', alt: 'Freightliner' }, { file: '../../assets/logo-dtg-navy.png', alt: 'Dovetail Games' }],
  dlc, credit: '© TheJAG', cab: { file: '../../assets/class-70-dtg-cab.jpg', height: 196, position: '50% 50%' },
  controls: {
    speedbrake: { name: 'Reverser', notches: ['Forward', 'Neutral', 'Reverse'], start: 1 },
    leftThrottle: { name: 'Automatic brake', continuous: true, notches: ['Emergency', 'Handle off', 'Suppression', 'Full service', null, 'Minimum', 'Release'], start: 3 },
    rightThrottle: { name: 'Throttle', notches: ['8', '7', '6', '5', '4', '3', '2', '1', 'Idle'], start: 8 },
    flap: { name: 'Independent brake', continuous: true, notches: ['Full', null, null, null, 'Release'], start: 0 },
    leftThrottleButton: { name: 'Sand' }, rightThrottleButton: { name: 'Engine start' }, gearLever: { name: 'AWS / vigilance' },
    autoBrk: { name: 'Headlights', positions: [{ short: '0', desc: 'Off' }, { short: 'BTV', desc: 'Day' }, { short: 'LO', desc: 'Night' }, { short: '2', desc: 'Marker' }, { short: '3', desc: 'Tail' }, { short: 'HI', desc: 'Hazard' }], start: 0 },
    eng1: { name: 'Horn high', start: true }, eng2: { name: 'Horn low', start: true },
    leftAux: { name: 'AWS/TPWS isolation' }, rightAux: { name: 'DVD isolation' },
    modeSwitch: { name: 'Wipers', left: 'off', right: 'on' }, roundAux: { name: 'Bail off' }, rudTrim: { name: 'Doors L / R' },
    parkBrk: { name: 'Cab enable + master key', flat: 'out', up: 'in' } },
  setup: [
    'Cab enable and master key in (PARK BRK up); give the key a few seconds before the first reverser move',
    'AWS/TPWS and DVD to Normal: both aux squares lit (the loco loads with both isolated)',
    'TMS: F1 Air Brakes, F3 Cut In, F4 Lead, F6 Save when the brake screen shows Cut Out; brake mode Goods / Passenger in the cab',
    'Headlights to Day (AUTO BRK); Tail in the rear cab when running light',
    'Automatic brake from Handle off to Full service (the loco loads with the brake pipe cut off), independent applied, throttle Idle',
    'Parking brake released in the cab; engine stopped itself while parked? Right throttle button starts it again',
    'Passenger / Goods brake mode: the switch sits on the rear-wall auxiliary panel beneath the red fuel cut-off button; Goods for freight (as loaded)'],
  depart: [
    'Check the signal; reverser to Forward a few seconds after PARK BRK (move it again if it does not take)',
    'Automatic brake to Release (pull back), wait for the brake pipe to reach 5 bar / 72 psi',
    'Independent brake to Release (flap lever back)',
    'Throttle notch by notch; a heavy train may need Notch 8 to get going, go easy in the wet',
    'Acknowledge AWS and the vigilance with the gear lever',
    'Braking: throttle to Idle, automatic brake into the service zone; bail off the loco (round aux) on a heavy train',
    'TMS says PCS Open (no power after an emergency or a vented pipe): stop, throttle Idle, automatic brake to Emergency for a full minute, then Release; it clears as the pipe recharges'],
});
