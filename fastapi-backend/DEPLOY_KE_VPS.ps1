$VPS_IP = "152.42.199.99"
$VPS_USER = "root"

Write-Host "`n--- Ultramaxo AI VPS Deployer ---" -ForegroundColor Cyan
Write-Host "Step 1: Mindahin file ke VPS (main.py, requirements.txt, setup_vps.sh)..."

# Copy files using scp
scp -o StrictHostKeyChecking=no main.py requirements.txt setup_vps.sh ${VPS_USER}@${VPS_IP}:~/

Write-Host "`nStep 2: Menjalankan script setup di VPS..."
Write-Host "Nanti kalo ditanya password, masukin: 12345Buyer"

# SSH and run setup
ssh -o StrictHostKeyChecking=no ${VPS_USER}@${VPS_IP} "bash ~/setup_vps.sh"

Write-Host "`n--- SETUP VPS SELESAI! ---" -ForegroundColor Green
Write-Host "Sekarang AI lu udah siap di sana."
Write-Host "Langkah terakhir, lu masuk ke VPS lu (ssh root@$VPS_IP) terus ketik:"
Write-Host "cd ~/ultramaxo-ai && source venv/bin/activate && python3 main.py" -ForegroundColor Yellow
pause
