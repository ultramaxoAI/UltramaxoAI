ssh root@152.42.199.99# ⚠️ VPS SERVER MATI - NEED RESTART!

Server di VPS tidak responding. Ikuti langkah ini untuk restart:

---

## 🚀 Restart Command (Copy-Paste)

### 1. SSH ke VPS
```bash
ssh root@152.42.199.99
```
**Masukkan password VPS Anda**

### 2. Jalankan command ini (one-line):
```bash
cd ~/ultramaxo-ai && pkill -f 'python.*main' && sleep 2 && nohup python3 main.py > llm.log 2>&1 & sleep 3 && curl localhost:8000/health
```

**Response yang benar harus seperti ini:**
```json
{
  "status": "ok",
  "model": "Meta-Llama-3-8B-Instruct.Q4_0.gguf",
  "timestamp": "2026-02-19T18:45:00Z"
}
```

✅ **Jika ada `timestamp` = SUCCESS! Versi baru sudah jalan!**

### 3. Exit SSH
```bash
exit
```

---

## 🧪 Test dari Local PC

```powershell
# Test di PowerShell
curl -UseBasicParsing http://152.42.199.99:8000/health
```

Atau buka browser:
**http://152.42.199.99:8000/health**

---

## 🎯 Test di Frontend

1. Refresh browser (Ctrl+F5) di http://localhost:3000
2. Start new chat
3. Pilih **UltraAgent Pro**
4. Ketik "Hello"
5. **Should work!** ✅

---

## 📋 Troubleshooting

### Jika masih error "Oops, an error occurred!"

1. **Check VPS logs:**
   ```bash
   ssh root@152.42.199.99 "tail -50 ~/ultramaxo-ai/llm.log"
   ```

2. **Restart Next.js dev server:**
   Tekan `Ctrl+C` di terminal yang running `npm run dev`, lalu:
   ```bash
   npm run dev
   ```

3. **Clear browser cache:**
   - Chrome: Ctrl+Shift+Delete
   - Pilih "Cached images and files"
   - Clear data
   - Refresh page

### Jika port 8000 sudah dipakai:

```bash
ssh root@152.42.199.99 "lsof -i :8000 | grep LISTEN"
# Kill the PID shown
ssh root@152.42.199.99 "kill -9 <PID>"
```

### Check if Python process is running:

```bash
ssh root@152.42.199.99 "ps aux | grep python"
```

---

## 🔍 Quick Diagnostics

| Check | Command |
|-------|---------|
| Server alive? | `curl http://152.42.199.99:8000/health` |
| View logs | `ssh root@152.42.199.99 'tail -f ~/ultramaxo-ai/llm.log'` |
| Check process | `ssh root@152.42.199.99 'ps aux \| grep python'` |
| Check port | `ssh root@152.42.199.99 'netstat -tuln \| grep 8000'` |

---

## ℹ️ What Changed in New Version

- ✅ Better error handling
- ✅ Usage statistics (prompt_tokens, completion_tokens)
- ✅ Improved streaming support
- ✅ Better logging for debugging
- ✅ Health endpoint with timestamp

---

**Current Status:** 🔴 Server DOWN - needs manual restart via SSH

**Action Required:** Follow steps above to SSH and restart server
