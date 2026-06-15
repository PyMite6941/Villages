# run.ps1 — Start Villages locally (backend + frontend)
# Usage:  .\run.ps1             # normal start
#         .\run.ps1 -Install    # force reinstall deps then start
#         .\run.ps1 -Help       # show help

param(
  [switch]$Install,
  [switch]$Help
)

$ROOT = Split-Path -Parent $MyInvocation.MyCommand.Path
$BACKEND_DIR = Join-Path $ROOT "backend"
$FRONTEND_DIR = Join-Path $ROOT "frontend"

function log   { Write-Host "[villages] $args" -ForegroundColor Cyan }
function ok    { Write-Host "[  ok  ] $args" -ForegroundColor Green }
function warn  { Write-Host "[ warn ] $args" -ForegroundColor Yellow }
function fail  { Write-Host "[ fail ] $args" -ForegroundColor Red; exit 1 }

# ── Prerequisites ────────────────────────────────────────────

function Check-Prereqs {
  # Check Python
  $python = $null
  if (Get-Command "python" -ErrorAction SilentlyContinue) { $python = "python" }
  elseif (Get-Command "python3" -ErrorAction SilentlyContinue) { $python = "python3" }
  else { fail "Python 3 is required (https://python.org)" }

  $ver = & $python -c "import sys; print(f'{sys.version_info.major}.{sys.version_info.minor}')" 2>$null
  if (-not $ver -or [version]$ver -lt [version]"3.10") {
    fail "Python 3.10+ required (found: $(& $python --version 2>&1))"
  }
  ok "Python $ver found"

  # Check Node.js
  $node = $null
  if (Get-Command "node" -ErrorAction SilentlyContinue) { $node = "node" }
  elseif (Get-Command "node.exe" -ErrorAction SilentlyContinue) { $node = "node.exe" }
  else { fail "Node.js is required (https://nodejs.org)" }

  $nodeVer = & $node --version 2>&1
  $cleanVer = $nodeVer -replace 'v', '' -replace '\s', ''
  $majorVer = ($cleanVer -split '\.')[0]
  if ([int]$majorVer -lt 18) {
    fail "Node.js 18+ required (found: $nodeVer)"
  }
  ok "Node $cleanVer found"
}

# ── Environment files ────────────────────────────────────────

function Check-Env {
  $missing = 0
  if (-not (Test-Path (Join-Path $BACKEND_DIR ".env"))) {
    warn "Missing: backend\.env  (copy from .env.example)"
    $missing = 1
  }
  if (-not (Test-Path (Join-Path $FRONTEND_DIR ".env"))) {
    warn "Missing: frontend\.env (copy from .env.example)"
    $missing = 1
  }
  if ($missing -eq 1) {
    Write-Host ""
    warn "Create .env files from the examples:"
    Write-Host "  copy backend\.env.example backend\.env"
    Write-Host "  copy frontend\.env.example frontend\.env"
    Write-Host "  # then edit backend\.env with your keys"
    Write-Host ""
    $reply = Read-Host "Continue anyway? [Y/n]"
    if ($reply -match '^[Nn]') { exit 1 }
  } else {
    ok ".env files found"
  }
}

# ── Install dependencies ─────────────────────────────────────

function Install-Deps {
  log "Installing backend Python dependencies..."
  Push-Location $BACKEND_DIR
  pip install -r requirements.txt -q
  if ($LASTEXITCODE -ne 0) { fail "pip install failed" }
  Pop-Location
  ok "Backend dependencies installed"

  log "Installing frontend Node dependencies..."
  Push-Location $FRONTEND_DIR
  npm install --silent
  if ($LASTEXITCODE -ne 0) { fail "npm install failed" }
  Pop-Location
  ok "Frontend dependencies installed"
}

# ── Start servers ────────────────────────────────────────────

$global:backendJob = $null
$global:frontendJob = $null
$global:LogFile = Join-Path $ROOT "villages.log"

function Cleanup {
  Write-Host ""
  log "Shutting down..."
  if ($global:backendJob -and $global:backendJob.State -eq 'Running') {
    Stop-Job $global:backendJob -ErrorAction SilentlyContinue
    Remove-Job $global:backendJob -ErrorAction SilentlyContinue
  }
  if ($global:frontendJob -and $global:frontendJob.State -eq 'Running') {
    Stop-Job $global:frontendJob -ErrorAction SilentlyContinue
    Remove-Job $global:frontendJob -ErrorAction SilentlyContinue
  }
  ok "Stopped"
  exit 0
}

function Start-Servers {
  # Register Ctrl+C handler
  Register-EngineEvent -SourceIdentifier PowerShell.Exiting -SupportEvent -Action {
    Cleanup
  } | Out-Null

  # Wipe previous log before this run
  Set-Content -Path $global:LogFile -Value "" -NoNewline

  log "Starting backend (uvicorn)..."
  $global:backendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
  } -ArgumentList $BACKEND_DIR

  log "Starting frontend (Vite)..."
  $global:frontendJob = Start-Job -ScriptBlock {
    param($dir)
    Set-Location $dir
    npx vite --host 0.0.0.0 --port 5173
  } -ArgumentList $FRONTEND_DIR

  Write-Host ""
  Write-Host "  Frontend:  http://localhost:5173" -ForegroundColor Green
  Write-Host "  Backend:   http://localhost:8000" -ForegroundColor Green
  Write-Host "  API docs:  http://localhost:8000/docs" -ForegroundColor Green
  Write-Host "  Log:       $($global:LogFile)" -ForegroundColor Yellow
  Write-Host ""
  log "Press Ctrl+C to stop both servers"
  Write-Host ""

  # Show output from both jobs, tee-ing to log file
  try {
    while ($true) {
      Start-Sleep -Seconds 1
      $bOut = Receive-Job $global:backendJob -ErrorAction SilentlyContinue
      $fOut = Receive-Job $global:frontendJob -ErrorAction SilentlyContinue
      if ($bOut) { $bOut | Tee-Object -FilePath $global:LogFile -Append | Out-Host }
      if ($fOut) { $fOut | Tee-Object -FilePath $global:LogFile -Append | Out-Host }

      if ($global:backendJob.State -eq 'Failed') {
        warn "Backend stopped unexpectedly"
        Receive-Job $global:backendJob -ErrorAction SilentlyContinue
        Cleanup
      }
      if ($global:frontendJob.State -eq 'Failed') {
        warn "Frontend stopped unexpectedly"
        Receive-Job $global:frontendJob -ErrorAction SilentlyContinue
        Cleanup
      }
    }
  } catch {
    Cleanup
  }
}

# ── Main ─────────────────────────────────────────────────────

if ($Help) {
  Write-Host "Usage: .\run.ps1 [-Install] [-Help]"
  Write-Host ""
  Write-Host "  -Install    Force reinstall dependencies before starting"
  Write-Host "  -Help       Show this help"
  exit 0
}

Check-Prereqs
Check-Env

if ($Install) {
  Install-Deps
} else {
  if (-not (Test-Path (Join-Path $FRONTEND_DIR "node_modules"))) {
    warn "node_modules not found. Running install..."
    Install-Deps
  }
  $depsFile = Join-Path $BACKEND_DIR ".deps-installed"
  if (-not (Test-Path $depsFile)) {
    warn "Dependencies not installed yet. Running install..."
    Install-Deps
    Set-Content -Path $depsFile -Value "1"
  }
}

Start-Servers
