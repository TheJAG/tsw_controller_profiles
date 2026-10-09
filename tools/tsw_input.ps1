# Desktop input helper for driving Train Sim World (borderless window) from a script.
# Usage: powershell -NoProfile -File tools/tsw_input.ps1 <command> [args]
#   focus                 bring the TSW window to the front
#   shot [scale] [file]   screenshot of the primary screen (scale 0.5 = half size); default file %TEMP%\tsw-screen.png
#   click x y             left click at screen pixels (full resolution, 3440x1440 on this PC)
#   move x y              move the cursor
#   mmove dx dy           relative mouse move (mouse look in the cab: +dy tilts down, 95 shows the desk)
#   wheel n               mouse wheel, n ticks (negative = down)
#   key VK                tap a virtual key (27 Esc, 49 '1' cab camera, 51 '3', 112 F1 HUD toggle, 83 'S')
#   hold VK ms            hold a key
#   keys "text"           type letters/digits (upper-cased)
param([string]$cmd, [string]$a, [string]$b, [string]$c)
Add-Type -TypeDefinition @'
using System; using System.Runtime.InteropServices;
public class W {
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int n);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, int x, int y, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern void keybd_event(byte vk, byte sc, uint f, UIntPtr e);
  [DllImport("user32.dll")] public static extern uint MapVirtualKey(uint c, uint t);
}
'@
[W]::SetProcessDPIAware() | Out-Null
$defaultShot = Join-Path $env:TEMP 'tsw-screen.png'
function Focus-Tsw { $p = Get-Process TrainSimWorld -ErrorAction SilentlyContinue | Where-Object { $_.MainWindowHandle -ne 0 } | Select-Object -First 1; if ($p) { [W]::ShowWindow($p.MainWindowHandle, 5) | Out-Null; [W]::SetForegroundWindow($p.MainWindowHandle) | Out-Null; Start-Sleep -Milliseconds 400; "focused $($p.MainWindowTitle)" } else { "TSW window not found" } }
function Shot([double]$scale = 1, [string]$file = $defaultShot) { Add-Type -AssemblyName System.Windows.Forms,System.Drawing; $r=[System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $bmp=New-Object System.Drawing.Bitmap $r.Width,$r.Height; $g=[System.Drawing.Graphics]::FromImage($bmp); $g.CopyFromScreen($r.Location,[System.Drawing.Point]::Empty,$r.Size); if ($scale -ne 1) { $w=[int]($r.Width*$scale); $h=[int]($r.Height*$scale); $s=New-Object System.Drawing.Bitmap $bmp,$w,$h; $s.Save($file); $s.Dispose() } else { $bmp.Save($file) }; $bmp.Dispose(); "shot $($r.Width)x$($r.Height) scale $scale -> $file" }
function KeyTap([int]$vk, [int]$ms = 60) { $sc=[W]::MapVirtualKey($vk,0); [W]::keybd_event($vk,$sc,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds $ms; [W]::keybd_event($vk,$sc,2,[UIntPtr]::Zero) }
switch ($cmd) {
  'focus' { Focus-Tsw }
  'shot'  { $sc = if ($a) { [double]$a } else { 1 }; $f = if ($b) { $b } else { $defaultShot }; Shot $sc $f }
  'move'  { [W]::SetCursorPos([int]$a,[int]$b) | Out-Null; "moved $a,$b" }
  'click' { [W]::SetCursorPos([int]$a,[int]$b) | Out-Null; Start-Sleep -Milliseconds 150; [W]::mouse_event(2,0,0,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 80; [W]::mouse_event(4,0,0,0,[UIntPtr]::Zero); "clicked $a,$b" }
  'mmove' { $n=[Math]::Max([Math]::Abs([int]$a),[Math]::Abs([int]$b)); $steps=[Math]::Max(1,[int]($n/10)); $dx=[int]$a/$steps; $dy=[int]$b/$steps; for($i=0;$i -lt $steps;$i++){ [W]::mouse_event(1,[int]$dx,[int]$dy,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds 8 }; "mouse moved $a,$b (relative)" }
  'wheel' { $n=[int]$a; $d=if($n -lt 0){[uint32]4294967176}else{[uint32]120}; for($i=0;$i -lt [Math]::Abs($n);$i++){ [W]::mouse_event(0x0800,0,0,$d,[UIntPtr]::Zero); Start-Sleep -Milliseconds 60 }; "wheel $n" }
  'key'   { KeyTap ([int]$a); "key $a" }
  'hold'  { $sc=[W]::MapVirtualKey([int]$a,0); [W]::keybd_event([int]$a,$sc,0,[UIntPtr]::Zero); Start-Sleep -Milliseconds ([int]$b); [W]::keybd_event([int]$a,$sc,2,[UIntPtr]::Zero); "held $a for $b ms" }
  'keys'  { foreach ($ch in $a.ToCharArray()) { $vk=[int][char]::ToUpper($ch); KeyTap $vk 40; Start-Sleep -Milliseconds 40 }; "typed" }
  default { "usage: focus | shot [scale] [file] | click x y | move x y | mmove dx dy | wheel n | key VK | hold VK ms | keys text" }
}
