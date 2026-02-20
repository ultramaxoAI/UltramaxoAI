# Llama 3 Multi-Environment Setup Guide

## Overview

The Llama 3 model (and other local AI models) is configured to work seamlessly across three environments:
1. **Local Development** - Your laptop/PC
2. **Vercel Production** - Cloud deployment
3. **VPS Deployment** - Singapore VPS (152.42.199.99)

## How It Works

The system automatically detects your environment and routes to the appropriate AI server:

### 🏠 Local Development
- **Default URL**: `http://localhost:8000/v1`
- **When to use**: Running the app on your local machine
- **Setup**: Run your local FastAPI backend or LLM server on port 8000

### ☁️ Vercel Production
- **Default URL**: `http://152.42.199.99:8000/v1` (Singapore VPS)
- **When to use**: Deployed to Vercel
- **Setup**: No configuration needed - automatically uses VPS

### 🖥️ VPS Deployment
- **Default URL**: `http://152.42.199.99:8000/v1`
- **When to use**: Running directly on the VPS
- **Setup**: AI server should be running on the same VPS

## Configuration

### Automatic (Recommended)

Leave `LOCAL_AI_URL` unset in your `.env` file. The system will automatically:
- Use `localhost:8000` for local development
- Use VPS IP for Vercel and production deployments

### Manual Override

If you need a custom AI server URL, set it explicitly:

```bash
# .env or .env.local
LOCAL_AI_URL=http://your-custom-server:8000/v1
```

## Environment Variables Priority

The system checks in this order:

1. **`LOCAL_AI_URL`** - If set, always use this URL
2. **`VERCEL`** or **`NODE_ENV=production`** - Use VPS (152.42.199.99)
3. **Fallback** - Use localhost for development

## Local Development Setup

### Option 1: FastAPI Backend (Included)

The project includes a FastAPI backend in `/fastapi-backend`:

```bash
# Navigate to fastapi backend
cd fastapi-backend

# Install dependencies
pip install -r requirements.txt

# Run the server
python main.py
```

The FastAPI server will start at `http://localhost:8000`

### Option 2: External LLM Server

If you're running a different LLM server (like llama.cpp, Ollama, etc.):

```bash
# .env.local
LOCAL_AI_URL=http://localhost:11434/v1  # For Ollama
# or
LOCAL_AI_URL=http://localhost:8080/v1   # For llama.cpp
```

## Vercel Deployment

### Environment Variables

In your Vercel project settings, you can optionally set:

```
LOCAL_AI_URL=http://152.42.199.99:8000/v1
```

But this is **not required** - it automatically uses the VPS in production.

### Testing

After deploying to Vercel:
1. Open your deployed app
2. Start a chat
3. Check browser console for: `[AI Provider] Initializing localClient with baseURL: http://152.42.199.99:8000/v1`

## VPS Setup (Singapore Server)

### Current Configuration

- **Server IP**: 152.42.199.99
- **Port**: 8000
- **Endpoint**: `/v1/chat/completions`

### Starting the AI Server on VPS

```bash
# SSH into your VPS
ssh your-user@152.42.199.99

# Navigate to the FastAPI backend
cd /path/to/fastapi-backend

# Run the server (with nohup to keep it running)
nohup python main.py > llm.log 2>&1 &

# Or use PM2 for better process management
pm2 start main.py --name llm-server --interpreter python3
pm2 save
```

## Troubleshooting

### Local Development Not Working

**Issue**: Getting connection errors locally

**Solution**:
1. Check if FastAPI backend is running: `curl http://localhost:8000/health`
2. Check the console logs for the actual URL being used
3. Set `LOCAL_AI_URL` explicitly in `.env.local`:
   ```bash
   LOCAL_AI_URL=http://localhost:8000/v1
   ```

### Vercel Deployment Not Working

**Issue**: Vercel can't connect to VPS

**Solution**:
1. Verify VPS is accessible: `curl http://152.42.199.99:8000/health`
2. Check VPS firewall allows connections from Vercel IPs
3. Ensure the AI server is running on the VPS
4. Check Vercel logs for connection errors

### VPS Deployment Issues

**Issue**: Self-hosting on VPS not working

**Solution**:
1. If running on the same VPS, you can use localhost:
   ```bash
   LOCAL_AI_URL=http://localhost:8000/v1
   ```
2. Or continue using the external IP
3. Check if the AI server is running: `pm2 status` or `ps aux | grep python`

## Model Configuration

### Available Models

The app uses these model IDs:
- `ultramaxo/ultra-agent` - Llama 3.3 based (free tier)
- `ultramaxo/ultra-agent-pro` - Advanced model (pro tier)

### Backend Model Mapping

In the FastAPI backend (`fastapi-backend/main.py`), you can configure which actual model file to use:

```python
MODEL_NAME = os.getenv("LOCAL_MODEL_NAME", "Meta-Llama-3-8B-Instruct.Q4_0.gguf")
```

Set in VPS environment:
```bash
export LOCAL_MODEL_NAME="Meta-Llama-3-8B-Instruct.Q4_0.gguf"
```

## Testing

### Test Connection

```bash
# Test VPS (from anywhere)
curl -X POST http://152.42.199.99:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'

# Test local
curl -X POST http://localhost:8000/v1/chat/completions \
  -H "Content-Type: application/json" \
  -d '{
    "model": "gpt-3.5-turbo",
    "messages": [{"role": "user", "content": "Hello"}]
  }'
```

### Check Logs

The app logs which URL it's using:

```
[AI Provider] Environment: production
[AI Provider] Initializing localClient with baseURL: http://152.42.199.99:8000/v1
[AI Provider] Model Requested: ultramaxo/ultra-agent
[AI Provider] Routing to Singapore VPS...
[AI Provider] ACTION: Using Local Chat API
```

## Summary

✅ **No configuration needed** - Works out of the box for all environments
✅ **Smart routing** - Automatically detects local vs production
✅ **Easy override** - Set `LOCAL_AI_URL` when needed
✅ **VPS ready** - Already configured for 152.42.199.99:8000

The system is now ready to work seamlessly across local development, Vercel production, and VPS deployment! 🚀
