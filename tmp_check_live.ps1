$ErrorActionPreference = 'Stop'
$live = (Invoke-WebRequest 'https://www.jtsbeautyllc.com/' -UseBasicParsing -TimeoutSec 15).Content
Write-Host '---Live head---'
if ($live.Length -gt 400) { Write-Host $live.Substring(0,400) } else { Write-Host $live }
$match = [regex]::Match($live, '/assets/index-[A-Za-z0-9]+\.js')
Write-Host '---Live asset---'
Write-Host $match.Value
if ($match.Success) {
  $assetUrl = 'https://www.jtsbeautyllc.com' + $match.Value
  try {
    $ra = Invoke-WebRequest $assetUrl -UseBasicParsing -TimeoutSec 15
    Write-Host '---Live asset response---'
    Write-Host 'Status:' $ra.StatusCode
    Write-Host 'Content-Type:' $ra.Headers['Content-Type']
    if ($ra.Content.Length -gt 200) { Write-Host 'Length:' $ra.Content.Length; Write-Host 'Head:' $ra.Content.Substring(0,200) } else { Write-Host $ra.Content }
  } catch { Write-Host 'ERROR fetching asset:' $_.Exception.Message }
} else { Write-Host 'No asset matched on live page' }

$localIndex = Get-Content index.html -Raw
$localMatch = [regex]::Match($localIndex, '/assets/index-[A-Za-z0-9]+\.js')
Write-Host '---Local index.html asset---'
Write-Host $localMatch.Value

$localDist = Get-Content dist/index.html -Raw
$localDistMatch = [regex]::Match($localDist, '/assets/index-[A-Za-z0-9]+\.js')
Write-Host '---Local dist/index.html asset---'
Write-Host $localDistMatch.Value

if ($localMatch.Success) {
  $localAssetPath = '.' + $localMatch.Value
  if (Test-Path $localAssetPath) { Write-Host 'Local asset file size:' (Get-Item $localAssetPath).Length } else { Write-Host 'Local asset file not found:' $localAssetPath }
}
if ($localDistMatch.Success) {
  $localDistAssetPath = '.' + $localDistMatch.Value
  if (Test-Path $localDistAssetPath) { Write-Host 'Local dist asset file size:' (Get-Item $localDistAssetPath).Length } else { Write-Host 'Local dist asset not found:' $localDistAssetPath }
}
