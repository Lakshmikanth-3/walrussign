# WalrusSign — Deploy & Configure Script
# Run this from PowerShell in the project root
# Usage: .\deploy.ps1

$ErrorActionPreference = "Stop"

$CONTRACT_DIR = "$PSScriptRoot\contract"
$APP_ENV      = "$PSScriptRoot\app\.env"
$SUI_EXE      = "sui"
$TATUM_KEY    = $env:TATUM_KEY
$APP_TATUM_KEY = $env:VITE_TATUM_KEY
$TATUM_RPC    = "https://sui-testnet.gateway.tatum.io"

if (-not $TATUM_KEY) {
    $TATUM_KEY = $APP_TATUM_KEY
}

if (-not $TATUM_KEY) {
    throw "Set TATUM_KEY or VITE_TATUM_KEY in your environment before running deploy.ps1."
}

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  WalrusSign — Deploy Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# ── Step 1: Verify sui.exe ─────────────────────────────────────────────────────
Write-Host "[1/5] Checking Sui CLI..." -ForegroundColor Yellow
$version = & $SUI_EXE --version 2>&1
Write-Host "      $version" -ForegroundColor Gray

# ── Step 2: Set Tatum testnet as active environment ────────────────────────────
Write-Host ""
Write-Host "[2/5] Configuring Tatum Testnet RPC..." -ForegroundColor Yellow

# Add Tatum testnet env (ignore error if it already exists)
& $SUI_EXE client new-env --alias tatum-testnet --rpc $TATUM_RPC 2>&1 | Out-Null

# Switch to tatum-testnet
& $SUI_EXE client switch --env tatum-testnet 2>&1 | Out-Null
Write-Host "      Active RPC: $TATUM_RPC" -ForegroundColor Gray

# ── Step 3: Show active address & check balance ───────────────────────────────
Write-Host ""
Write-Host "[3/5] Checking wallet..." -ForegroundColor Yellow
$address = (& $SUI_EXE client active-address 2>&1).Trim()
Write-Host "      Address: $address" -ForegroundColor Green

Write-Host ""
Write-Host "      Checking gas balance..." -ForegroundColor Gray
$gas = & $SUI_EXE client gas 2>&1
Write-Host $gas -ForegroundColor Gray

# Check if balance is empty
if ($gas -match "No.*gas" -or $gas -match "0 MIST" -or $gas -match "No gas") {
    Write-Host ""
    Write-Host "======================================================" -ForegroundColor Red
    Write-Host "  NO GAS FOUND! You need testnet SUI first." -ForegroundColor Red
    Write-Host "======================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "  1. Open this URL in your browser:" -ForegroundColor Yellow
    Write-Host "     https://faucet.sui.io/?address=$address" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "  2. Select 'Testnet' and click 'Request Tokens'" -ForegroundColor Yellow
    Write-Host "  3. Wait for the green confirmation" -ForegroundColor Yellow
    Write-Host "  4. Run this script again: .\deploy.ps1" -ForegroundColor Yellow
    Write-Host ""
    exit 1
}

# ── Step 4: Publish the Move contract ─────────────────────────────────────────
Write-Host ""
Write-Host "[4/5] Publishing Move contract to Sui Testnet..." -ForegroundColor Yellow
Write-Host "      (This may take 30-60 seconds)" -ForegroundColor Gray
Write-Host ""

$publishOutput = & $SUI_EXE client publish `
    --gas-budget 100000000 `
    --skip-dependency-verification `
    "$CONTRACT_DIR" 2>&1

Write-Host $publishOutput -ForegroundColor Gray

# ── Step 5: Extract Package ID ─────────────────────────────────────────────────
Write-Host ""
Write-Host "[5/5] Extracting Package ID..." -ForegroundColor Yellow

$packageId = ""

# Parse the output for the Package ID (looks like 0x followed by 64 hex chars)
foreach ($line in $publishOutput) {
    if ($line -match "PackageID:\s*(0x[a-fA-F0-9]+)") {
        $packageId = $Matches[1]
        break
    }
    if ($line -match '"type":\s*"published"') {
        # Next few lines will have the package ID
    }
    if ($line -match '"packageId":\s*"(0x[a-fA-F0-9]+)"') {
        $packageId = $Matches[1]
        break
    }
    if ($line -match 'Package ID:\s*(0x[a-fA-F0-9]+)') {
        $packageId = $Matches[1]
        break
    }
}

# Fallback: find any 0x + 64-hex-char string in the output (package IDs are 32 bytes = 64 hex)
if (-not $packageId) {
    foreach ($line in $publishOutput) {
        if ($line -match '\b(0x[a-fA-F0-9]{64})\b') {
            $packageId = $Matches[1]
            break
        }
    }
}

if (-not $packageId) {
    Write-Host ""
    Write-Host "ERROR: Could not extract Package ID from output." -ForegroundColor Red
    Write-Host "Please look for 'PackageID' in the output above and manually set:" -ForegroundColor Yellow
    Write-Host "VITE_PACKAGE_ID=<your_package_id>" -ForegroundColor Cyan
    Write-Host "in: $APP_ENV" -ForegroundColor Cyan
    exit 1
}

Write-Host "      Package ID: $packageId" -ForegroundColor Green

# ── Update .env ────────────────────────────────────────────────────────────────
Write-Host ""
Write-Host "      Updating app\.env ..." -ForegroundColor Gray

$envContent = Get-Content $APP_ENV -Raw

# Replace VITE_PACKAGE_ID line
$envContent = $envContent -replace 'VITE_PACKAGE_ID=.*', "VITE_PACKAGE_ID=$packageId"

# Switch to testnet RPC
$envContent = $envContent -replace 'VITE_TATUM_RPC=.*', "VITE_TATUM_RPC=$TATUM_RPC"
$envContent = $envContent -replace 'VITE_TATUM_KEY=.*', "VITE_TATUM_KEY=$TATUM_KEY"

Set-Content $APP_ENV $envContent -NoNewline

Write-Host ""
Write-Host "========================================" -ForegroundColor Green
Write-Host "  DEPLOYMENT COMPLETE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green
Write-Host ""
Write-Host "  Package ID: $packageId" -ForegroundColor Green
Write-Host "  Network:    Sui Testnet (Tatum RPC)" -ForegroundColor Green
Write-Host "  .env:       Updated automatically" -ForegroundColor Green
Write-Host ""
Write-Host "  Start the app:" -ForegroundColor Yellow
Write-Host "  cd app" -ForegroundColor Cyan
Write-Host "  npm run dev" -ForegroundColor Cyan
Write-Host ""
Write-Host "  Then open: http://localhost:3000" -ForegroundColor Cyan
Write-Host ""
