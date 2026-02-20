$VPS_IP = "152.42.199.99"
$VPS_USER = "root"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "🚀 Ultramaxo AI VPS Deployer (Updated)" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

Write-Host "Step 1: 📤 Uploading files to VPS..." -ForegroundColor Yellow
Write-Host "   Files: main.py, requirements.txt, setup_vps.sh" -ForegroundColor Gray

# Copy files using scp
scp -o StrictHostKeyChecking=no main.py requirements.txt setup_vps.sh ${VPS_USER}@${VPS_IP}:~/

if ($LASTEXITCODE -eq 0) {
    Write-Host "   ✅ Files uploaded successfully!" -ForegroundColor Green
} else {
    Write-Host "   ❌ Upload failed!" -ForegroundColor Red
    pause
    exit 1
}

Write-Host ""
Write-Host "Step 2: ⚙️  Running setup script on VPS..." -ForegroundColor Yellow

# SSH and run setup
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "bash ~/setup_vps.sh"

Write-Host ""
Write-Host "Step 3: 🚀 Starting server with PM2..." -ForegroundColor Yellow

# Start or restart with PM2 (use single quotes to prevent PowerShell parsing)
ssh -o StrictHostKeyChecking=no "$VPS_USER@$VPS_IP" 'cd ~/ultramaxo-ai; source venv/bin/activate; pm2 restart llm-server 2>/dev/null || (pm2 start main.py --name llm-server --interpreter python3; pm2 save)'

Write-Host ""
Write-Host "⏳ Waiting for server to start..." -ForegroundColor Yellow
Start-Sleep -Seconds 3

Write-Host ""
Write-Host "🔍 Testing server..." -ForegroundColor Yellow

try {
    $health = Invoke-RestMethod -Uri "http://${VPS_IP}:8000/health" -Method Get -TimeoutSec 10
    Write-Host ""
    Write-Host "================================================" -ForegroundColor Green
    Write-Host "✅ DEPLOYMENT SUCCESSFUL!" -ForegroundColor Green
    Write-Host "================================================" -ForegroundColor Green
    Write-Host ""
    Write-Host "📊 Server Status:" -ForegroundColor Cyan
    Write-Host "   Status: $($health.status)" -ForegroundColor Gray
    Write-Host "   Model: $($health.model)" -ForegroundColor Gray
    Write-Host "   URL: http://${VPS_IP}:8000" -ForegroundColor Gray
    Write-Host ""
} catch {
    Write-Host "⚠️  Server might need manual start" -ForegroundColor Yellow
    Write-Host ""
    Write-Host "Manual start command:" -ForegroundColor Yellow
    Write-Host "   ssh ${VPS_USER}@${VPS_IP}" -ForegroundColor Gray
    Write-Host "   cd ~/ultramaxo-ai && source venv/bin/activate && python3 main.py" -ForegroundColor Gray
}

Write-Host ""
Write-Host "📋 Useful Commands:" -ForegroundColor Cyan
Write-Host "   Check status: ssh ${VPS_USER}@${VPS_IP} 'pm2 status'" -ForegroundColor Gray
Write-Host "   View logs:    ssh ${VPS_USER}@${VPS_IP} 'pm2 logs llm-server'" -ForegroundColor Gray
Write-Host "   Restart:      ssh ${VPS_USER}@${VPS_IP} 'pm2 restart llm-server'" -ForegroundColor Gray
Write-Host ""

pause
