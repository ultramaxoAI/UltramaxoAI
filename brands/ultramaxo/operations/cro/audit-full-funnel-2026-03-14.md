# CRO Audit -- Ultramaxo
**Tanggal:** 2026-03-14 | **Mode:** Standalone

---

## Ringkasan Funnel Saat Ini

```
Landing Page -> Register/Login -> Chat (Free) -> [???] -> Upgrade Pro
```

**Masalah utama:** Tidak ada trigger konversi di dalam aplikasi. User Free bisa menggunakan chat tanpa pernah melihat alasan untuk upgrade. Funnel "bocor" di antara Chat Free dan Upgrade Pro karena tidak ada jembatan.

---

## Temuan Audit Kritis

### 1. TIDAK ADA Contextual Upgrade Trigger di In-App
Satu-satunya cara user melihat penawaran upgrade:
- Mengklik tombol "Upgrade Plan" di sidebar
- Secara manual mengunjungi `/plan`

**Tidak ada trigger otomatis** yang muncul berdasarkan perilaku user.

### 2. Signup Form Terlalu Berat
Form registrasi: **4 field** (Username, Email, Password, Confirm Password). Setiap field tambahan = -10-20% completion rate.

### 3. Login Page Tidak Menjual
Halaman login hanya form. Tidak ada value prop, social proof, atau preview produk.

### 4. Rate Limit = Error, Bukan Peluang
User free yang terkena rate limit (10 req/menit) hanya melihat error message. Seharusnya ini momen konversi.

---

## Quick Wins (Hari Ini)

| # | Perubahan | File | Dampak |
|---|---|---|---|
| 1 | Hapus "Confirm Password" dari register | `auth-form.tsx` | +10-15% signup |
| 2 | Tambahkan "Gratis selamanya. Tanpa kartu kredit." di bawah CTA | `auth-form.tsx` | +5-10% signup |
| 3 | Pindahkan Google OAuth ke ATAS form email | `auth-form.tsx` | +15-25% signup |
| 4 | Social proof di login: "Digunakan 150+ mahasiswa IT" | `login/page.tsx` | +5-8% trust |
| 5 | Tambahkan "Batalkan kapan saja" di pricing page | `pricing-page.tsx` | +10-15% clicks |

---

## High-Impact Changes (1-3 Hari)

### H1. Contextual Upgrade Prompt (ICE: 24)
Buat banner inline yang muncul otomatis saat:
- User selesai **percakapan ke-5**
- User menyentuh **rate limit**
- User pakai **artifact** pertama kali

Copy: "Anda sudah menyelesaikan 5 percakapan. Nikmati chat tanpa batas -- hanya Rp 15.000/bulan. [Upgrade] [Nanti]"

### H2. Soft Paywall saat Rate Limit (ICE: 21)
Ganti error rate limit dengan modal upgrade: "Batas tercapai. Upgrade untuk chat tanpa limit -- Rp 15.000/bulan."

### H3. Optimasi Alur Registrasi (ICE: 23)
1. Google OAuth jadi CTA utama (paling atas)
2. Hapus "Confirm Password"
3. Username opsional (isi nanti di profil)
4. Value prop singkat di atas form

---

## Prioritas Eksekusi

| Urutan | Item | Effort | Impact |
|---|---|---|---|
| 1 | Quick Wins 1-5 | 1-2 jam | +10-20% signup/upgrade |
| 2 | H3: Optimasi registrasi | 2-3 jam | +15-25% signup |
| 3 | H1: Contextual upgrade | 3-4 jam | +20-40% free-to-pro |
| 4 | H2: Soft paywall rate limit | 2-3 jam | +15-30% upgrade |
