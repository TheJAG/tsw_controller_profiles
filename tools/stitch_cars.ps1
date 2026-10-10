param([string]$out, [string]$list)
$files = $list -split ","
Add-Type -AssemblyName System.Drawing
$imgs = $files | ForEach-Object { [System.Drawing.Image]::FromFile($_) }
$w = ($imgs | Measure-Object -Property Width -Sum).Sum
$h = ($imgs | Measure-Object -Property Height -Maximum).Maximum
$bmp = New-Object System.Drawing.Bitmap $w, $h, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($bmp)
$g.Clear([System.Drawing.Color]::Transparent)
$g.InterpolationMode = 'NearestNeighbor'
$x = 0
foreach ($i in $imgs) { $g.DrawImage($i, (New-Object System.Drawing.Rectangle $x, ($h - $i.Height), $i.Width, $i.Height)); $x += $i.Width }
$g.Dispose()
$bmp.Save($out, [System.Drawing.Imaging.ImageFormat]::Png)
"$out $w x $h"
$c = $imgs[0]; $b = New-Object System.Drawing.Bitmap $c; "corner pixel: " + $b.GetPixel(0,0)
