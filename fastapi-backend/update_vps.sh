#!/bin/bash
# Script untuk update FastAPI backend di VPS
# Usage: ./update_vps.sh

echo "================================================"
echo "🔄 Updating Ultramaxo AI Backend on VPS"
echo "================================================"

# Change to the project directory
cd ~/ultramaxo-ai

# Backup current main.py
echo "📦 Backing up current main.py..."
cp main.py main.py.backup.$(date +%Y%m%d_%H%M%S)

# Stop the current server (if using PM2)
echo "⏸️  Stopping current server..."
pm2 stop llm-server 2>/dev/null || echo "No PM2 process found"

# Or kill uvicorn process if running manually
# pkill -f "uvicorn main:app" 2>/dev/null || echo "No uvicorn process found"

# Activate virtual environment
echo "🐍 Activating virtual environment..."
source venv/bin/activate

# Update main.py from the new file
# (You should upload the new main.py first via scp)
echo "📥 New main.py should be uploaded via:"
echo "   scp main.py user@152.42.199.99:~/ultramaxo-ai/main.py"

# Start the server again
echo "🚀 Starting server..."
pm2 start main.py --name llm-server --interpreter python3

# Or if not using PM2:
# nohup python main.py > llm.log 2>&1 &

# Check status
echo ""
echo "✅ Update complete!"
echo ""
echo "📊 Server status:"
pm2 status

echo ""
echo "📋 Recent logs:"
pm2 logs llm-server --lines 20 --nostream

echo ""
echo "🔍 Test the server:"
echo "   curl http://152.42.199.99:8000/health"
echo ""
echo "================================================"
