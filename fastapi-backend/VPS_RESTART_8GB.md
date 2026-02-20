# VPS Restart Instructions - 8GB RAM

## Copy-paste commands ini di SSH terminal:

```bash
# SSH ke VPS
ssh root@152.42.199.99

# 1. Check memory usage
echo "=== Memory Status ==="
free -h
echo ""

# 2. Check if process still running
echo "=== Python Processes ==="
ps aux | grep python
echo ""

# 3. Kill all python processes
pkill -f python
sleep 2

# 4. Check error logs
echo "=== Last 50 lines of log ==="
tail -50 ~/ultramaxo-ai/llm.log
echo ""

# 5. Go to directory
cd ~/ultramaxo-ai

# 6. Check model files
echo "=== Model Files ==="
ls -lh models/
echo ""

# 7. Activate venv
source venv/bin/activate

# 8. Start server (with verbose logging)
echo "=== Starting Server ==="
nohup python main.py > llm.log 2>&1 &

# 9. Wait for startup
echo "Waiting 10 seconds for model to load..."
sleep 10

# 10. Test health endpoint
echo "=== Testing Health ==="
curl localhost:8000/health
echo ""

# 11. Check if running
echo "=== Process Status ==="
ps aux | grep python | grep -v grep
echo ""

# 12. Show recent logs
echo "=== Recent Logs ==="
tail -20 llm.log
```

## Jika masih crash, coba model kecil:

```bash
cd ~/ultramaxo-ai
pkill -f python
export LOCAL_MODEL_NAME="Llama-3.2-3B-Instruct-Q4_K_M.gguf"
source venv/bin/activate
nohup python main.py > llm.log 2>&1 &
sleep 10
curl localhost:8000/health
```

## Atau tambahkan monitoring:

```bash
# Watch memory usage in real-time
watch -n 1 free -h

# In another terminal, watch logs
ssh root@152.42.199.99 "tail -f ~/ultramaxo-ai/llm.log"
```
