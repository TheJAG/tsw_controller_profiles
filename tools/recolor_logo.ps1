# Recolour a white-on-transparent (or any single-colour) logo PNG to one flat colour, keeping its alpha, and downscale it
# with a high-quality resampler so the edges come out soft. Usage:
#   powershell -NoProfile -File tools/recolor_logo.ps1 -In tools/assets/logo-x-white.png -Out tools/assets/logo-x-navy.png [-Color '#223261'] [-Height 160]
param([string]$In, [string]$Out, [string]$Color = '#223261', [int]$Height = 160)
Add-Type -AssemblyName System.Drawing
$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $In))
$c = [System.Drawing.ColorTranslator]::FromHtml($Color)
$tmp = New-Object System.Drawing.Bitmap $src.Width, $src.Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
for ($y = 0; $y -lt $src.Height; $y++) { for ($x = 0; $x -lt $src.Width; $x++) {
  $p = $src.GetPixel($x, $y)
  # coverage = alpha scaled by luminance, so a white logo keeps its anti-aliasing and dark pixels (if any) vanish
  $lum = (0.299 * $p.R + 0.587 * $p.G + 0.114 * $p.B) / 255
  $a = [int][Math]::Round($p.A * $lum)
  $tmp.SetPixel($x, $y, [System.Drawing.Color]::FromArgb($a, $c.R, $c.G, $c.B))
} }
$w = [int][Math]::Round($src.Width * $Height / $src.Height)
$dst = New-Object System.Drawing.Bitmap $w, $Height, ([System.Drawing.Imaging.PixelFormat]::Format32bppArgb)
$g = [System.Drawing.Graphics]::FromImage($dst)
$g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
$g.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
$g.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
$g.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
$g.Clear([System.Drawing.Color]::Transparent)
$g.DrawImage($tmp, (New-Object System.Drawing.Rectangle 0, 0, $w, $Height))
$g.Dispose()
$dst.Save((Join-Path (Get-Location) $Out), [System.Drawing.Imaging.ImageFormat]::Png)
"$Out $w x $Height, colour $Color"
