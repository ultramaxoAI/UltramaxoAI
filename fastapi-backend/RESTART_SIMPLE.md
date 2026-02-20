# 🚀 Simple Restart Guide

## File main.py sudah berhasil diupload! ✅

Sekarang restart server dengan 2 cara:

---

## Option 1: One-Line Command (Fastest) ⚡

Copy-paste command ini:

```bash
ssh root@152.42.199.99 "cd ~/ultramaxo-ai && pkill -f 'python.*main' && sleep 2 && nohup python3 main.py > llm.log 2>&1 & sleep 3 && curl localhost:8000/health"
```

Masukkan password VPS, dan done!

---

## Option 2: SSH Manual (Step by Step) 🔧

### 1. SSH ke VPS
```bash
ssh root@152.42.199.99
```

### 2. Kill proses lama
```bash
pkill -f 'python.*main'
```

### 3. Masuk ke folder
```bash
cd ~/ultramaxo-ai
```

### 4. Start server baru
```bash
nohup python3 main.py > llm.log 2>&1 &
```

### 5. Test server
```bash
curl localhost:8000/health
```

Seharusnya muncul response dengan **timestamp** (ini tandanya versi baru):
```json
{
  "status": "ok",
  "model": "Meta-Llama-3-8B-Instruct.Q4_0.gguf",
  "timestamp": "2026-02-19T..."  <- INI HARUS ADA!
}
```

### 6. Exit SSH
```bash
exit
```

---

## Verify dari Local PC

```powershell
curl http://152.42.199.99:8000/health
```

Atau buka browser:
http://152.42.199.99:8000/health

---

## Test di Frontend

1. Buka http://localhost:3000
2. Pilih model **UltraAgent Pro**
3. Ketik "Hello"
4. **No more "Oops" error!** ✅

---

## Troubleshooting

### Server tidak responding

Check logs:
```bash
ssh root@152.42.199.99 "tail -50 ~/ultramaxo-ai/llm.log"
```

### Port sudah dipakai

```bash
ssh root@152.42.199.99 "lsof -i :8000"
ssh root@152.42.199.99 "kill -9 <PID>"
```

### Model tidak ditemukan

```bash
ssh root@152.42.199.99 "ls -lh ~/ultramaxo-ai/models/"
```

---

## Quick Commands Reference

| Action | Command |
|--------|---------|
| Check if running | `ssh root@152.42.199.99 'curl -s localhost:8000/health'` |
| View logs | `ssh root@152.42.199.99 'tail -f ~/ultramaxo-ai/llm.log'` |
| Stop server | `ssh root@152.42.199.99 'pkill -f python.*main'` |
| Check process | `ssh root@152.42.199.99 'ps aux \| grep python'` |

---

**Status**: ✅ main.py uploaded - just needs restart!
