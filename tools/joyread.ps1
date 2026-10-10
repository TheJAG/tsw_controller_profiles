# Log the raw axes of the first joysticks (winmm) for a few seconds: find where the TCA levers rest and how much they jitter.
# Usage: powershell -NoProfile -File tools/joyread.ps1 -Seconds 60 -IntervalMs 40 > log.txt ; X = left throttle, Y = right throttle, raw = value / 65535.
param([int]$Seconds = 3, [int]$IntervalMs = 50)
Add-Type -TypeDefinition @"
using System; using System.Runtime.InteropServices;
public class Joy {
  [StructLayout(LayoutKind.Sequential)] public struct JOYINFOEX { public int dwSize; public int dwFlags; public int dwXpos; public int dwYpos; public int dwZpos; public int dwRpos; public int dwUpos; public int dwVpos; public int dwButtons; public int dwButtonNumber; public int dwPOV; public int dwReserved1; public int dwReserved2; }
  [DllImport("winmm.dll")] public static extern int joyGetPosEx(int uJoyID, ref JOYINFOEX pji);
  [DllImport("winmm.dll")] public static extern int joyGetNumDevs();
  public static int[] Read(int id) { JOYINFOEX j = new JOYINFOEX(); j.dwSize = Marshal.SizeOf(typeof(JOYINFOEX)); j.dwFlags = 0xFF; int r = joyGetPosEx(id, ref j); if (r != 0) return null; return new int[] { j.dwXpos, j.dwYpos, j.dwZpos, j.dwRpos, j.dwUpos, j.dwVpos, j.dwButtons }; }
}
"@
$ids = 0..15 | Where-Object { [Joy]::Read($_) -ne $null }
"devices: $($ids -join ',')"
$end = (Get-Date).AddSeconds($Seconds)
while ((Get-Date) -lt $end) {
  foreach ($id in $ids) { $v = [Joy]::Read($id); $t = (Get-Date).ToString('HH:mm:ss.fff'); "$t dev$id X=$($v[0]) Y=$($v[1]) Z=$($v[2]) R=$($v[3]) U=$($v[4]) V=$($v[5])" }
  Start-Sleep -Milliseconds $IntervalMs
}
