#!/bin/bash
# Auto Restart Script (untuk dijalankan di VPS via SSH)
# ==============================================

echo "=========================================="
echo "Auto Restart Ultramaxo AI Backend"
echo "=========================================="
echo ""

# 1. Find and kill old process
echo "[1/4] Stopping old process..."
pkill -f 'python.*main.py' 2>/dev/null && echo "✓ Old process stopped" || echo "No process found (OK)"

# Wait a moment
sleep 2

# 2. Go to directory
echo "[2/4] Changing to directory..."
cd ~/ultramaxo-ai || { echo "Error: Directory not found!"; exit 1; }
echo "✓ In directory: $(pwd)"

# 3. Check if main.py exists
echo "[3/4] Checking main.py..."
if [ ! -f "main.py" ]; then
    echo "Error: main.py not found!"
    exit 1
fi
echo "✓ main.py found"

# 4. Start server
echo "[4/4] Starting server..."
nohup python3 main.py > llm.log 2>&1 &
PID=$!
echo "✓ Server started with PID: $PID"

# Wait and test
sleep 3
echo ""
echo "Testing server..."
if curl -s http://localhost:8000/health > /dev/null; then
    echo "✓ Server is responding!"
    curl http://localhost:8000/health | python3 -m json.tool
else
    echo "✗ Server not responding yet. Check logs:"
    echo "  tail -f ~/ultramaxo-ai/llm.log"
fi

echo ""
echo "=========================================="
echo "✓ Restart Complete!"
echo "=========================================="
echo ""
echo "Useful commands:"
echo "  Check logs: tail -f ~/ultramaxo-ai/llm.log"
echo "  Check process: ps aux | grep python"
echo "  Kill process: pkill -f 'python.*main'"
echo ""
