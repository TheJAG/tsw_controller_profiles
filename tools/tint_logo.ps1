# Tint a coloured raster logo that has a white mark on a brand-coloured ground (DTG cyan square, DB red box) to the
# manual's scheme colour: every pixel is mixed between the scheme colour and white by its "whiteness", read from one
# RGB channel that is ~0 on the brand colour and 255 on white (R for cyan, G for red). Alpha is kept, the result is
# downscaled with a high-quality resampler. For white-on-transparent logos use recolor_logo.ps1 instead. Usage:
#   powershell -NoProfile -File tools/tint_logo.ps1 -In tools/assets/logo-dtg.jpg -Out tools/assets/logo-dtg-navy.png -Color '#223261' -Channel R [-Height 160]
param([string]$In, [string]$Out, [string]$Color = '#223261', [string]$Channel = 'R', [int]$Height = 160)
Add-Type -AssemblyName System.Drawing
$c = [System.Drawing.ColorTranslator]::FromHtml($Color)
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $In))
$tmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) {
  $p = $src.GetPixel($x, $y)
  $t = switch ($Channel) { 'G' { $p.G / 255.0 } 'B' { $p.B / 255.0 } default { $p.R / 255.0 } }
  $t = [Math]::Min(1.0, [Math]::Max(0.0, ($t - 0.15) / 0.7))   # clip JPEG noise at both ends
  $r = [int]($c.R + (255 - $c.R) * $t); $g = [int]($c.G + (255 - $c.G) * $t); $b = [int]($c.B + (255 - $c.B) * $t)
  $tmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($p.A, $r, $g, $b))
} }
$w = [int][Math]::Round($src.Width * $Height / $src.Height)
$dst = New-Object System.Drawing.Bitmap $w, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$gr = [System.Drawing.Graphics]::FromImage($dst)
$gr.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$gr.SmoothingMode = 'HighQuality'; $gr.PixelOffsetMode = 'HighQuality'; $gr.CompositingQuality = 'HighQuality'
$gr.Clear([System.Drawing.Color]::Transparent)
$gr.DrawImage($tmp, (New-Object System.Drawing.Rectangle 0, 0, $w, $Height)); $gr.Dispose()
$dst.Save((Join-Path (Get-Location) $Out), [System.Drawing.Imaging.ImageFormat]::Png)
"$Out $($src.Width)x$($src.Height) -> $w x $Height, colour $Color"
