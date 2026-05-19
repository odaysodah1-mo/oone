$workDir = "C:\Users\MSI\Downloads\Team-Design (1)\Team-Design"
$env:PORT = "5173"
$env:BASE_PATH = "/"
$env:API_URL = "http://localhost:3000"

Set-Location $workDir
Write-Host "Starting Basmah app on port 5173..."
pnpm --filter @workspace/basmah run dev
