# FastAPI Backend for Llama 3 (Local AI Server)

This is a FastAPI backend that runs Llama 3 models locally using GPT4All. It provides an OpenAI-compatible API for the UltramaxoAI frontend.

## Features

- ✅ OpenAI-compatible API endpoints
- ✅ Supports multiple Llama models
- ✅ CORS enabled for frontend access
- ✅ Optimized for VPS deployment
- ✅ Configurable via environment variables

## Quick Start

### Local Development

```bash
# Navigate to this directory
cd fastapi-backend

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

Server will start at `http://localhost:8000`

### Using Virtual Environment (Recommended)

```bash
# Create virtual environment
python -m venv venv

# Activate (Windows)
venv\Scripts\activate

# Activate (Linux/Mac)
source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Run
python main.py
```

## VPS Deployment (Singapore Server)

### Method 1: Quick Setup Script

```bash
# 1. SSH into your VPS
ssh your-user@152.42.199.99

# 2. Upload files
scp -r ../fastapi-backend your-user@152.42.199.99:~/ultramaxo-ai/

# 3. Run setup script
cd ~/ultramaxo-ai
chmod +x setup_vps.sh
./setup_vps.sh

# 4. Configure environment
nano .env
# Add: LOCAL_MODEL_NAME=Meta-Llama-3-8B-Instruct.Q4_0.gguf

# 5. Run the server
source venv/bin/activate
python main.py
```

### Method 2: PM2 Process Manager (Recommended for Production)

```bash
# Install PM2
npm install -g pm2

# Start the server with PM2
pm2 start main.py --name llm-server --interpreter python3

# Save PM2 configuration
pm2 save

# Setup PM2 to start on boot
pm2 startup
# Follow the instructions shown

# Check status
pm2 status

# View logs
pm2 logs llm-server

# Restart
pm2 restart llm-server
```

### Method 3: systemd Service (Alternative)

Create a systemd service file:

```bash
sudo nano /etc/systemd/system/ultramaxo-llm.service
```

Content:

```ini
[Unit]
Description=Ultramaxo LLM Server
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/home/your-user/ultramaxo-ai
Environment="PATH=/home/your-user/ultramaxo-ai/venv/bin"
ExecStart=/home/your-user/ultramaxo-ai/venv/bin/python main.py
Restart=always

[Install]
WantedBy=multi-user.target
```

Enable and start:

```bash
sudo systemctl enable ultramaxo-llm
sudo systemctl start ultramaxo-llm
sudo systemctl status ultramaxo-llm
```

## Configuration

### Environment Variables

Create a `.env` file in the `fastapi-backend` directory:

```bash
# Model configuration
LOCAL_MODEL_NAME=Meta-Llama-3-8B-Instruct.Q4_0.gguf
LOCAL_MODEL_PATH=./models
N_THREADS=4

# Server configuration
HOST=0.0.0.0
PORT=8000
```

### Available Models

The system automatically downloads models from GPT4All repository. Recommended models:

| Model | Size | Speed | Quality | Use Case |
|-------|------|-------|---------|----------|
| Meta-Llama-3-8B-Instruct.Q4_0.gguf | ~4.3GB | Fast | Good | Production (Default) |
| Llama-3.2-3B-Instruct-Q4_K_M.gguf | ~2GB | Fastest | Good | VPS with limited RAM |
| Meta-Llama-3.1-8B-Instruct-Q4_0.gguf | ~4.3GB | Fast | Better | Higher quality responses |

To change model, set environment variable:

```bash
export LOCAL_MODEL_NAME="Llama-3.2-3B-Instruct-Q4_K_M.gguf"
```

### CPU Threads

Adjust `N_THREADS` based on your VPS CPU cores:

```bash
# Check CPU cores
nproc

# Set threads (usually CPU cores - 1)
export N_THREADS=4
```

## API Endpoints

### POST /v1/chat/completions

OpenAI-compatible chat completions endpoint.

**Request:**

```json
{
  "model": "gpt-3.5-turbo",
  "messages": [
    {"role": "system", "content": "You are a helpful assistant."},
    {"role": "user", "content": "Hello!"}
  ],
  "temperature": 0.7,
  "max_tokens": 1024
}
```

**Response:**

```json
{
  "id": "chatcmpl-...",
  "object": "chat.completion",
  "created": 1234567890,
  "model": "gpt-3.5-turbo",
  "choices": [
    {
      "index": 0,
      "message": {
        "role": "assistant",
        "content": "Hello! How can I help you today?"
      },
      "finish_reason": "stop"
    }
  ],
  "usage": {
    "prompt_tokens": 20,
    "completion_tokens": 10,
    "total_tokens": 30
  }
}
```

### GET /health

Health check endpoint.

**Response:**

```json
{
  "status": "ok",
  "model": "Meta-Llama-3-8B-Instruct.Q4_0.gguf",
  "timestamp": "2024-02-19T10:00:00Z"
}
```

## Testing

### Test Locally

```bash
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

### Test VPS

```bash
curl -X POST http://152.42.199.99:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Say hello"}],
    "max_tokens": 50
  }'
```

### Health Check

```bash
# Local
curl http://localhost:8000/health

# VPS
curl http://152.42.199.99:8000/health
```

## Firewall Configuration

If you're deploying to VPS, ensure port 8000 is open:

```bash
# Ubuntu/Debian with UFW
sudo ufw allow 8000/tcp
sudo ufw reload

# Check status
sudo ufw status
```

Or with iptables:

```bash
sudo iptables -A INPUT -p tcp --dport 8000 -j ACCEPT
sudo iptables-save
```

## Performance Optimization

### 1. Use Quantized Models

Quantized models (Q4, Q5) are much faster and use less RAM:
- Q4_0: Fast, good quality (recommended)
- Q4_K_M: Slightly better quality
- Q5_K_M: Best quality, slower

### 2. Adjust Thread Count

```python
N_THREADS = 4  # CPU cores - 1 usually optimal
```

### 3. Model Caching

Models are cached in `./models/` directory. First run downloads the model, subsequent runs are instant.

### 4. RAM Requirements

| Model Size | Minimum RAM | Recommended RAM |
|------------|-------------|-----------------|
| 2-3GB | 4GB | 8GB |
| 4-5GB | 8GB | 16GB |
| 7-8GB | 16GB | 32GB |

## Troubleshooting

### Port Already in Use

```bash
# Find process using port 8000
lsof -i :8000

# Kill it
kill -9 <PID>

# Or change port in main.py
uvicorn.run(app, host="0.0.0.0", port=8001)
```

### Model Download Fails

```bash
# Manually download model
cd models/
wget https://gpt4all.io/models/gguf/Meta-Llama-3-8B-Instruct.Q4_0.gguf
```

### Out of Memory

Switch to a smaller model:

```bash
export LOCAL_MODEL_NAME="Llama-3.2-3B-Instruct-Q4_K_M.gguf"
```

### Connection Refused

Check if server is running:

```bash
ps aux | grep python
netstat -tulpn | grep 8000
```

Check firewall:

```bash
sudo ufw status
curl http://localhost:8000/health  # Test locally first
```

### Slow Responses

1. Use a smaller/quantized model
2. Reduce max_tokens
3. Increase N_THREADS
4. Check CPU usage: `htop`

## Monitoring

### View Logs (PM2)

```bash
pm2 logs llm-server --lines 100
```

### View Logs (systemd)

```bash
sudo journalctl -u ultramaxo-llm -f
```

### Resource Usage

```bash
# CPU and Memory
htop

# Or
top

# Disk space (for models)
du -h models/
```

## Production Checklist

- [ ] VPS with sufficient RAM (8GB+ recommended)
- [ ] Port 8000 opened in firewall
- [ ] PM2 or systemd service configured
- [ ] Model downloaded and cached
- [ ] Health check endpoint working
- [ ] Frontend can connect from Vercel
- [ ] Logs configured and monitored
- [ ] Auto-restart on failure enabled

## Integration with Frontend

The frontend automatically detects and uses this backend:

1. **Local Development**: `http://localhost:8000/v1`
2. **Vercel Production**: `http://152.42.199.99:8000/v1`
3. **Custom**: Set `LOCAL_AI_URL` environment variable

No frontend code changes needed - it's all automatic! 🚀

## Support

For issues or questions:
- Check logs: `pm2 logs llm-server`
- Health check: `curl http://localhost:8000/health`
- Restart: `pm2 restart llm-server`

## License

Part of UltramaxoAI project.
