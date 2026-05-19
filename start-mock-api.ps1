$workDir = "C:\Users\MSI\Downloads\Team-Design (1)\Team-Design"
$env:MOCK_API_PORT = "3000"

# Load .env
Get-Content "$workDir\.env" | ForEach-Object {
  if ($_ -match "^\s*([^#=]+)=(.+)\s*$") {
    $k = $matches[1].Trim(); $v = $matches[2].Trim("`"'".ToCharArray())
    Set-Item -Path "env:$k" -Value $v
  }
}

Set-Location $workDir
Write-Host "Starting Mock API server on port 3000..."
node scripts/mock-api-server.mjs
