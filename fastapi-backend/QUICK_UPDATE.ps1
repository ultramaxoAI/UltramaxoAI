# All-in-One Update and Restart Script
# ==========================================

$VPS_IP = "152.42.199.99"
$VPS_USER = "root"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Ultramaxo AI - Update and Restart" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Step 1: Upload main.py
Write-Host "[1/4] Uploading main.py..." -ForegroundColor Yellow
scp main.py "$VPS_USER@$VPS_IP`:~/ultramaxo-ai/main.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed!" -ForegroundColor Red
    pause
    exit 1
}
Write-Host "Upload successful!" -ForegroundColor Green

# Step 2: Upload restart script
Write-Host ""
Write-Host "[2/4] Uploading restart script..." -ForegroundColor Yellow
scp restart_server.sh "$VPS_USER@$VPS_IP`:~/ultramaxo-ai/"

# Step 3: Stop old process and start new one
Write-Host ""
Write-Host "[3/4] Restarting server..." -ForegroundColor Yellow

# Single command to stop and restart
ssh "$VPS_USER@$VPS_IP" 'cd ~/ultramaxo-ai; chmod +x restart_server.sh; bash restart_server.sh'

# Step 4: Verify
Write-Host ""
Write-Host "[4/4] Verifying server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

try {
    $health = Invoke-RestMethod -Uri "http://$VPS_IP`:8000/health" -TimeoutSec 10 -UseBasicParsing
    
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "SUCCESS! Server is running with NEW code" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "Server Response:" -ForegroundColor Cyan
    Write-Host "  Status: $($health.status)" -ForegroundColor Gray
    Write-Host "  Model: $($health.model)" -ForegroundColor Gray
    
    # Check if timestamp exists (indicates new version)
    if ($health.timestamp) {
        Write-Host "  Timestamp: $($health.timestamp) <- NEW VERSION CONFIRMED!" -ForegroundColor Green
    } else {
        Write-Host "  WARNING: No timestamp field (might still be old version)" -ForegroundColor Yellow
    }
    
} catch {
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Red
    Write-Host "Could not verify server" -ForegroundColor Red
    Write-Host "================================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "Manual check:" -ForegroundColor Yellow
    Write-Host "  curl http://$VPS_IP`:8000/health" -ForegroundColor Gray
    Write-Host ""
    Write-Host "Check logs:" -ForegroundColor Yellow
    Write-Host "  ssh $VPS_USER@$VPS_IP 'tail -f ~/ultramaxo-ai/llm.log'" -ForegroundColor Gray
}

Write-Host ""
Write-Host "Test from frontend:" -ForegroundColor Cyan
Write-Host "  1. Open http://localhost:3000" -ForegroundColor Gray
Write-Host "  2. Select 'UltraAgent Pro' model" -ForegroundColor Gray
Write-Host "  3. Send a message" -ForegroundColor Gray
Write-Host "  4. Should work without 'Oops' error!" -ForegroundColor Gray
Write-Host ""

pause
