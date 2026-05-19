$env:PORT='3000'
$env:NODE_ENV='development'
$env:DATABASE_URL='postgresql://postgres:oDay%400788712344@db.garubydkynlycfwkllvn.supabase.co:5432/postgres'
$env:ADMIN_SECRET='JS+ZRS9IkT5sOR5giwugEo6MTzsiH9j05Aq7byYmbD4='
$env:SESSION_SECRET='W7o6Jt/2rdHdS587ZsAkc9aflyq1ZxZ+qqnk3Wdknkk='
$env:BASE_URL='http://localhost:5173'
$env:CORS_ORIGINS='http://localhost:5173,http://localhost:5174,http://localhost:3000'

Set-Location 'C:\Users\MSI\Downloads\Team-Design (1)\Team-Design\artifacts\api-server'
Write-Host "Starting Real API Server on port 3000..."
node --enable-source-maps ./dist/index.mjs
