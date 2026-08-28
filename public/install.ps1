$ErrorActionPreference = "Stop"
$repo = "B-Divyesh/sf-mail-attachment-archive"
$manifestUrl = "https://github.com/$repo/releases/latest/download/latest.json"
$manifest = Invoke-RestMethod -Uri $manifestUrl
$asset = $manifest.platforms.windows
$target = Join-Path $env:TEMP $asset.filename
Invoke-WebRequest -Uri $asset.url -OutFile $target
$actual = (Get-FileHash -Path $target -Algorithm SHA256).Hash.ToLowerInvariant()
if ($actual -ne $asset.sha256.ToLowerInvariant()) {
  Remove-Item $target -Force
  throw "Checksum verification failed; nothing was installed."
}
Write-Host "Downloaded and verified $target"
Write-Host "Starting the unsigned installer. Windows may show a SmartScreen notice."
Start-Process -FilePath $target -Wait
Write-Host "Mail Attachment Archive installation finished."
