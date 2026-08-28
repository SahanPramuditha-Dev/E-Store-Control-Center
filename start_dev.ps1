# ============================================================
#  E-Store Business & License Platform - Dev Launcher
#  Starts: Backend (FastAPI :8080) -> Frontend (Vite :5180)
# ============================================================

param(
    [switch]$SkipFrontend,
    [switch]$NoBrowser,
    [switch]$LocalDB
)

$ROOT          = $PSScriptRoot
$BACKEND_PORT  = 8080
$FRONTEND_PORT = 5180
$VENV_PYTHON   = "c:\D\Projects\Websites\I Store Website\.venv\Scripts\python.exe"
$BACKEND_DIR   = Join-Path $ROOT "backend"
$FRONTEND_DIR  = Join-Path $ROOT "frontend"
$BACKEND_URL   = "http://127.0.0.1:$BACKEND_PORT/docs"
$FRONTEND_URL  = "http://localhost:$FRONTEND_PORT"

Clear-Host
Write-Host ""
Write-Host "  ==========================================================" -ForegroundColor Cyan
Write-Host "   E-Store Business & License Platform - Dev Launcher       " -ForegroundColor Cyan
Write-Host "  ==========================================================" -ForegroundColor Cyan
Write-Host ""

if ($LocalDB) {
    Write-Host "  [⚡] Running in Ultra-Fast LOCAL SQLITE Mode (28ms latency)" -ForegroundColor Magenta
    $env:USE_LOCAL_DB = "true"
} else {
    Write-Host "  [☁] Running with Supabase Cloud Database" -ForegroundColor Gray
}

# Verify Python
if (-not (Test-Path $VENV_PYTHON)) {
    Write-Host "  [!] Virtual environment python not found at: $VENV_PYTHON" -ForegroundColor Red
    $VENV_PYTHON = "python"
}

# 1. Start Backend
Write-Host "  [*] Launching FastAPI Backend on port $BACKEND_PORT..." -ForegroundColor Green
$LOCAL_ENV_CMD = if ($LocalDB) { "set USE_LOCAL_DB=true && " } else { "" }
Start-Process -FilePath "cmd.exe" -ArgumentList "/k title E-Store License Backend && cd /d `"$BACKEND_DIR`" && $LOCAL_ENV_CMD `"$VENV_PYTHON`" -m uvicorn app.main:app --host 127.0.0.1 --port $BACKEND_PORT --reload"

# 2. Start Frontend
if (-not $SkipFrontend) {
    Write-Host "  [*] Launching Vite Frontend on port $FRONTEND_PORT..." -ForegroundColor Green
    Start-Process -FilePath "cmd.exe" -ArgumentList "/k title E-Store Admin Portal && cd /d `"$FRONTEND_DIR`" && npm run dev"
}

Start-Sleep -Seconds 2

Write-Host ""
Write-Host "  ==========================================================" -ForegroundColor DarkGray
Write-Host "  Backend API:  $BACKEND_URL" -ForegroundColor Yellow
Write-Host "  Admin Portal: $FRONTEND_URL" -ForegroundColor Cyan
Write-Host "  ==========================================================" -ForegroundColor DarkGray
Write-Host ""

if (-not $NoBrowser) {
    Start-Process $FRONTEND_URL
}
