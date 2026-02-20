# ================================================
# Quick Update Script - Only upload main.py
# ================================================

$VPS_IP = "152.42.199.99"
$VPS_USER = "root"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Quick Update - Uploading main.py only" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Backup and upload
Write-Host "Uploading main.py..." -ForegroundColor Yellow
scp main.py "$VPS_USER@$VPS_IP`:~/ultramaxo-ai/main.py"

if ($LASTEXITCODE -ne 0) {
    Write-Host "Upload failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host "Upload successful!" -ForegroundColor Green
Write-Host ""
Write-Host "Restarting server..." -ForegroundColor Yellow

# Restart PM2 or start if not running
ssh "$VPS_USER@$VPS_IP" 'cd ~/ultramaxo-ai; pm2 restart llm-server 2>/dev/null || (source venv/bin/activate; pm2 start main.py --name llm-server --interpreter python3; pm2 save)'

Write-Host ""
Write-Host "Waiting for server..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
try {
    $health = Invoke-RestMethod -Uri "http://$VPS_IP`:8000/health" -TimeoutSec 10
    Write-Host "Server is running!" -ForegroundColor Green
    Write-Host "Model: $($health.model)" -ForegroundColor Gray
    Write-Host "Status: $($health.status)" -ForegroundColor Gray
} catch {
    Write-Host "Could not verify server status" -ForegroundColor Yellow
    Write-Host "Check manually: curl http://$VPS_IP`:8000/health" -ForegroundColor Gray
}

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Update Complete!" -ForegroundColor Green
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

pause
