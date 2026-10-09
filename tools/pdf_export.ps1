param([string]$In,[string]$Out)
$word = New-Object -ComObject Word.Application
$word.Visible = $false
$doc = $word.Documents.Open($In, $false, $true)
$doc.ExportAsFixedFormat($Out, 17)
$doc.Close(0)
$word.Quit()
[System.Runtime.Interopservices.Marshal]::ReleaseComObject($word) | Out-Null
Write-Output "exported $Out"
