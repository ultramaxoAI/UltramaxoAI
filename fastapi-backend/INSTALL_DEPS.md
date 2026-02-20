# Setup Virtual Environment and Install Dependencies

## Run these commands in your SSH terminal:

```bash
# 1. Create virtual environment (if not exists)
cd ~/ultramaxo-ai
python3 -m venv venv

# 2. Activate virtual environment
source venv/bin/activate

# 3. Install dependencies
pip install fastapi uvicorn gpt4all pydantic python-multipart

# 4. Start server
nohup python main.py > llm.log 2>&1 &

# 5. Wait and test
sleep 5
curl localhost:8000/health

# If successful, you should see:
# {"status":"ok","model":"Meta-Llama-3-8B-Instruct.Q4_0.gguf","timestamp":"..."}
```

## If it works, exit SSH:
```bash
exit
```

Then test from local:
```powershell
curl -UseBasicParsing http://152.42.199.99:8000/health
```
