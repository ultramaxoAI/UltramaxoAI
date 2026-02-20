# 🔍 Debug Commands - Run in SSH

Anda sudah SSH ke VPS. **Jalankan commands ini satu per satu:**

---

## 1. Check error log
```bash
tail -50 ~/ultramaxo-ai/llm.log
```

## 2. Check if file exists
```bash
ls -lh ~/ultramaxo-ai/main.py
```

## 3. Check Python version
```bash
python3 --version
```

## 4. Try running manually to see error
```bash
cd ~/ultramaxo-ai
python3 main.py
```

**Tekan Ctrl+C jika ada error, lalu paste error message-nya**

---

## 5. Check dependencies
```bash
cd ~/ultramaxo-ai
python3 -c "import fastapi; import gpt4all; print('OK')"
```

## 6. If dependencies missing, install:
```bash
cd ~/ultramaxo-ai
pip3 install -r requirements.txt
```

---

## Kemungkinan masalah:

### A. Dependencies belum terinstall
**Solution:**
```bash
cd ~/ultramaxo-ai
pip3 install fastapi uvicorn gpt4all pydantic
```

### B. Model file belum didownload
**Solution:**
```bash
cd ~/ultramaxo-ai
mkdir -p models
```

Server akan auto-download model saat pertama kali jalan (tunggu beberapa menit)

### C. Working directory salah
**Solution:**
```bash
cd ~/ultramaxo-ai
pwd  # Should show: /root/ultramaxo-ai
ls -la  # Should show main.py
```

---

## After fixing, restart server:
```bash
cd ~/ultramaxo-ai
nohup python3 main.py > llm.log 2>&1 &
sleep 5
curl localhost:8000/health
```

Seharusnya response: `{"status":"ok",...}`

---

**Jalankan command di atas satu per satu dan share output error-nya!**
