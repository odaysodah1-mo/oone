@echo off
cd /d "C:\Users\MSI\Downloads\Team-Design (1)\Team-Design"
set PORT=5173
set BASE_PATH=/
pnpm --filter @workspace/basmah run dev
