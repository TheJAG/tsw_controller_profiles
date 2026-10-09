# Crop (and optionally downscale) an image, saving JPEG or PNG by the output extension.
# Usage: powershell -File tools/crop_image.ps1 -In shot.png -Out tools/assets/x-cab.jpg -X 300 -Y 400 -W 3100 -H 816 [-MaxWidth 1800] [-Quality 88]
param([Parameter(Mandatory=$true)][string]$In, [Parameter(Mandatory=$true)][string]$Out, [int]$X=0, [int]$Y=0, [int]$W=0, [int]$H=0, [int]$MaxWidth=0, [int]$Quality=88)
Add-Type -AssemblyName System.Drawing
$src=[System.Drawing.Image]::FromFile((Resolve-Path $In))
if ($W -le 0) { $W=$src.Width-$X }; if ($H -le 0) { $H=$src.Height-$Y }
$ow=$W; $oh=$H; if ($MaxWidth -gt 0 -and $W -gt $MaxWidth) { $ow=$MaxWidth; $oh=[int][Math]::Round($H*$MaxWidth/$W) }
$bmp=New-Object System.Drawing.Bitmap $ow,$oh
$g=[System.Drawing.Graphics]::FromImage($bmp); $g.InterpolationMode=[System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic; $g.SmoothingMode='HighQuality'; $g.PixelOffsetMode='HighQuality'
$g.DrawImage($src,(New-Object System.Drawing.Rectangle 0,0,$ow,$oh),(New-Object System.Drawing.Rectangle $X,$Y,$W,$H),[System.Drawing.GraphicsUnit]::Pixel)
if ([System.IO.Path]::IsPathRooted($Out)) { $outPath=$Out } else { $outPath=[System.IO.Path]::GetFullPath((Join-Path (Get-Location) $Out)) }
if ($Out -match '\.jpe?g$') {
  $codec=[System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
  $ep=New-Object System.Drawing.Imaging.EncoderParameters 1; $ep.Param[0]=New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality, [long]$Quality)
  $bmp.Save($outPath,$codec,$ep)
} else { $bmp.Save($outPath,[System.Drawing.Imaging.ImageFormat]::Png) }
$g.Dispose(); $bmp.Dispose(); $src.Dispose()
"wrote $outPath ${ow}x${oh} ($([int]((Get-Item $outPath).Length/1024)) KB)"
