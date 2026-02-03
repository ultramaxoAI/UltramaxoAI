# Setup Email dengan Nodemailer

Sekarang Ultramaxo AI menggunakan **Nodemailer** untuk kirim email verifikasi dan reset password. Lebih reliable daripada Resend!

## 📧 Cara Setup

### 1. Gmail (Recommended)

#### Langkah-langkah:

1. **Login ke Google Account** kamu
2. Buka **[App Passwords](https://myaccount.google.com/apppasswords)**
3. Pilih **"Mail"** dan **"Other (Custom name)"**
4. Kasih nama: `Ultramaxo AI`
5. Klik **Generate** → Simpan password yang muncul (16 karakter)

#### Config `.env.local`:

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=youremail@gmail.com
SMTP_PASS=your-16-char-app-password
EMAIL_FROM="Ultramaxo AI <youremail@gmail.com>"
```

> ⚠️ **Penting**: Gunakan **App Password**, bukan password akun biasa!

---

### 2. Outlook / Hotmail

#### Config `.env.local`:

```env
SMTP_HOST=smtp-mail.outlook.com
SMTP_PORT=587
SMTP_USER=youremail@outlook.com
SMTP_PASS=your-outlook-password
EMAIL_FROM="Ultramaxo AI <youremail@outlook.com>"
```

---

### 3. Yahoo Mail

#### Config `.env.local`:

```env
SMTP_HOST=smtp.mail.yahoo.com
SMTP_PORT=587
SMTP_USER=youremail@yahoo.com
SMTP_PASS=your-yahoo-app-password
EMAIL_FROM="Ultramaxo AI <youremail@yahoo.com>"
```

> **Note**: Yahoo juga butuh App Password, bisa generate di **[Yahoo Account Security](https://login.yahoo.com/account/security)**

---

### 4. SMTP Custom (SendGrid, Mailgun, dll)

Bisa juga pakai service SMTP lain. Contoh untuk **SendGrid**:

```env
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=your-sendgrid-api-key
EMAIL_FROM="Ultramaxo AI <noreply@yourdomain.com>"
```

---

## 🧪 Test Email

Buat test email berhasil atau nggak, coba fitur:
1. **Register user baru** → Cek kode verifikasi di inbox
2. **Forgot password** → Cek link reset di inbox

Logs akan muncul di terminal:
```
[email] Email sent: { to: 'user@example.com', subject: '🔐 Kode Verifikasi', messageId: '...' }
```

---

## ❓ Troubleshooting

### Email Tidak Terkirim

1. **Cek credentials**: Pastikan `SMTP_USER` dan `SMTP_PASS` benar
2. **Cek logs**: Terminal akan show error detail
3. **Gmail error "Less secure apps"**: Pakai **App Password**, bukan password biasa
4. **Port blocked**: Coba port `465` (SSL) kalau `587` (TLS) gak work:

```env
SMTP_PORT=465  # Change dari 587
```

### Rate Limit Gmail

Gmail free tier limit: **500 emails/day** (2000/day kalau pake Google Workspace)

---

## 🔒 Security Best Practices

1. **Jangan commit `.env.local`** ke Git
2. Pakai **App Passwords** untuk Gmail
3. Setup **Vercel Environment Variables** untuk production:

```bash
vercel env add SMTP_HOST
vercel env add SMTP_PORT
vercel env add SMTP_USER
vercel env add SMTP_PASS
vercel env add EMAIL_FROM
```

---

## 📦 Packages Installed

```json
{
  "nodemailer": "^6.9.16",
  "@types/nodemailer": "^6.4.17"
}
```

---

Sekarang email udah lebih stable! 🚀
