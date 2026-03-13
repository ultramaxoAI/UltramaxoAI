# Hakikat Kontrol (Monitoring & Evaluasi) — Ultramaxo

> **Prinsip Kontrol Solo Founder**: Lupakan *dashboard* yang rumit. Jangan mengukur hal-hal yang tidak bisa Anda pengaruhi secara langsung. Kontrol di sini fokus pada satu pertanyaan: "Apakah apa yang saya lakukan hari ini menghasilkan uang atau pengguna aktif?"

---

## 1. North Star Metric (Satu-satunya Angka yang Paling Penting)

**North Star Metric: Jumlah Pengguna Aktif Mingguan (WAU) yang Melakukan Setidaknya 3 Percakapan**
- **Definisi**: Total pengguna (Gratis + Pro) yang login dan mengirimkan minimal 3 *prompt* berbeda dalam 7 hari terakhir.
- **Baseline Saat Ini**: 0
- **Target 30 Hari**: 50 WAU
- **Mengapa ini (bukan sekadar pendaftar baru)?**: Karena jika pengguna mendaftar tapi tidak mengobrol, mereka tidak akan pernah membeli langganan Pro. *Retention* mendahului monetisasi.

---

## 2. Leading vs Lagging Indicators

Sebagai *solo founder*, Anda butuh indikator peringatan dini (Leading) agar tahu apakah strategi *infiltrasi* berjalan baik, sebelum melihat hasil akhir pendapatan (Lagging).

| Tipe | Metrik | Target 30 Hari | Data Source | Apa yang Diprediksinya? |
|---|---|---|---|---|
| **Leading** (Tanda awal) | **Klik dari Tautan Grup Telegram/Discord** | 50 klik/minggu | Vercel Analytics | Apakah konten "Tolak vs Jawab" bikin orang penasaran atau diabaikan? |
| **Leading** (Tanda awal) | **Jumlah *Artifact* yang Dihasilkan** | 200/minggu | Database | Apakah pengguna benar-benar memakai Ultramaxo untuk tugas *coding/hacking*? |
| **Lagging** (Hasil nyata) | **Registrasi Akun Baru** | 100 total | Database | Seberapa baik halaman *Landing* mengonversi pengunjung menjadi pendaftar? |
| **Lagging** (Hasil akhir) | **Total Pelanggan Pro Aktif (MRR)** | 20 pengguna (Rp 300rb MRR) | DompetX / DB | **Keberhasilan bisnis**. Apakah mereka merasa harga Rp 15rb/30rb ini sepadan? |

---

## 3. Aturan Optimasi (Jika A, Lakukan B)

Ini adalah *SOP* (Standar Operasional Prosedur) otomatis untuk Anda sendiri. Tidak perlu rapat evaluasi, cukup ikuti aturan ini:

| Kondisi Bermasalah (Trigger) | Waktu Evaluasi | Tindakan Korektif (Action) |
|---|---|---|
| **Tautan di grup di-klik (pengunjung naik), TAPI tidak ada yang daftar akun.** | Cek di Hari ke-7 | 1. Teks "Mulai Gratis" di halaman depan kurang jelas.<br>2. Hapus jeda/hambatan saat pendaftaran Google OAuth. |
| **Banyak yang daftar akun (Gratis), TAPI tidak ada yang beli Pro.** | Cek di Hari ke-14 | 1. Fitur gratis mungkin *terlalu bagus* (limitnya terlalu tinggi).<br>2. *Prompt upgrade* di dalam aplikasi kurang memicu rasa *FOMO*. Turunkan limit harian pengguna gratis. |
| **Pengguna mendaftar, tanya 1 kali, lalu tidak pernah kembali (Churn tinggi).** | Cek di Hari ke-14 | Kualitas respons teks buruk atau UI membingungkan. Berikan pesan interaktif saat *login* awal (Contoh: "Buntu ngerjain tugas? Paste error log lo di sini"). |
| **Pertumbuhan benar-benar mandek selama 1 minggu.** | Cek Tiap Minggu | Berhenti memposting konten lama. Ganti sudut pandang! Ambil *screenshot* untuk audiens berbeda (misalnya: berhenti fokus ke Hacking, coba ambil *screenshot* ngerjain tugas React.js kuliah). |

---

## 4. Ritm Evaluasi Solo Founder

Jangan terjebak menatap grafik setiap jam. Jadwalkan waktu Anda.

- **Check-in Harian (5 Menit / Pagi Hari)**: Cek Database/Vercel: Berapa *sign up* baru hari ini? Cek Telegram: Ada pertanyaan dari *user* nggak?
- **Review Mingguan (30 Menit / Minggu Sore)**: Hitung mundur sisa kuota "Early Adopter". Jika 1 minggu cuman dapat 2 orang Pro, artinya butuh revisi konten tangkapan layar untuk *infiltrasi* minggu depannya. 

---

## Control Alignment Check
- [x] Metrik secara langsung mengukur *North Star Metric* (WAU) dan target Revenue/MRR (Phase 2).
- [x] Aturan *trigger* mengatasi kendala teknis *solo founder* yang tidak memiliki tim data analis.
- [x] *Leading/Lagging Indicators* dirancang murni berbasis organik dan *infiltrasi* (tanpa mengukur ROI Iklan).
