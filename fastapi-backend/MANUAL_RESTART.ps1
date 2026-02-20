# Simple Manual Restart Instructions
# ==============================================

$VPS_IP = "152.42.199.99"
$VPS_USER = "root"

Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host "Manual Restart Instructions" -ForegroundColor Cyan
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "File main.py berhasil diupload!" -ForegroundColor Green
Write-Host ""
Write-Host "Sekarang restart server secara manual:" -ForegroundColor Yellow
Write-Host ""
Write-Host "1. SSH ke VPS:" -ForegroundColor Cyan
Write-Host "   ssh $VPS_USER@$VPS_IP" -ForegroundColor Gray
Write-Host ""
Write-Host "2. Kill proses Python yang lama:" -ForegroundColor Cyan
Write-Host "   pkill -f 'python.*main'" -ForegroundColor Gray
Write-Host "   atau" -ForegroundColor Gray
Write-Host "   killall python3" -ForegroundColor Gray
Write-Host ""
Write-Host "3. Start server dengan nohup:" -ForegroundColor Cyan
Write-Host "   cd ~/ultramaxo-ai" -ForegroundColor Gray
Write-Host "   nohup python3 main.py > llm.log 2>&1 &" -ForegroundColor Gray
Write-Host ""
Write-Host "4. Check if running:" -ForegroundColor Cyan
Write-Host "   curl localhost:8000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "5. Exit SSH and test from local:" -ForegroundColor Cyan
Write-Host "   curl http://$VPS_IP`:8000/health" -ForegroundColor Gray
Write-Host ""
Write-Host "================================================" -ForegroundColor Cyan
Write-Host ""

# Ask if user wants to open SSH
$response = Read-Host "Mau langsung SSH ke VPS sekarang? (Y/N)"
if ($response -eq "Y" -or $response -eq "y") {
    Write-Host ""
    Write-Host "Opening SSH connection..." -ForegroundColor Yellow
    Write-Host "Jalankan commands di atas setelah login" -ForegroundColor Yellow
    Write-Host ""
    ssh "$VPS_USER@$VPS_IP"
}

Write-Host ""
Write-Host "Done!" -ForegroundColor Green
