$workDir = "C:\Users\MSI\Downloads\Team-Design (1)\Team-Design"
$env:PORT = "5174"
$env:BASE_PATH = "/basmah-admin/"
$env:API_URL = "http://localhost:3000"

Set-Location $workDir
Write-Host "Starting Basmah Admin app on port 5174..."
pnpm --filter @workspace/basmah-admin run dev
