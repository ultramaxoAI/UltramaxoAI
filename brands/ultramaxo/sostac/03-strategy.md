# Strategy — Ultramaxo

> **Realitas**: Solo founder, modal minus, TikTok views 200-500 (jarang FYP), SEO masih lemah, belum ada Telegram/Discord. Strategi harus pragmatis dan memanfaatkan apa yang sudah ada.

---

## Strategic Summary

Target anak sekolahan dan mahasiswa IT/hacking di Indonesia yang frustrasi dengan AI mainstream yang mahal dan banyak sensor. Positioning sebagai **AI workspace lokal pertama yang unfiltered dan murah**. Growth dari **guerrilla marketing di komunitas IT yang sudah ada** (bukan bangun audience dari nol), konversi via produk yang sudah functional.

---

## Segmentation Table

| Segment | Description | Size (est.) | Urgency to Buy | Ease to Reach | Fit Score | Recommendation |
|---|---|---|---|---|---|---|
| **A. Newbie Hacker/CTF** | Pelajar/mahasiswa belajar hacking, CTF, pen-test. Butuh AI yang bisa explain exploit, generate script. | 500K+ | Tinggi — AI censored jadi blocker | Tinggi — ada di Discord/Telegram grup hacking | 9/10 | **PRIMARY** |
| **B. Mahasiswa IT/Coding** | Jurusan informatika/teknik. Butuh AI buat tugas, coding, debug, belajar. | 1M+ | Sedang — bisa pakai ChatGPT free tapi terbatas | Sedang — ada di kampus, forum | 7/10 | **SECONDARY** |
| **C. Script Kiddie / Self-Taught** | Anak muda otodidak yang belajar dari YouTube/TikTok. Budget sangat terbatas. | 300K+ | Sedang | Tinggi — aktif di sosmed IT | 6/10 | Tertiary |
| **D. Guru/Dosen IT** | Pengajar yang butuh AI tools untuk demo/ajar | 50K+ | Rendah | Rendah — sulit dijangkau | 4/10 | Nanti |

---

## Targeting Decision

### Primary: Newbie Hacker / CTF Players

**Mengapa ini segment terbaik untuk monetisasi cepat:**

1. **Pain point paling akut** — ChatGPT dan Claude menolak pertanyaan tentang exploit, reverse engineering, payload, dll. Ini blocker nyata buat belajar.
2. **Sudah berkumpul** — Ada di grup Discord/Telegram hacking Indonesia yang bisa kamu infiltrasi langsung.
3. **Willingness to pay lebih tinggi** — Mereka paham value dari tools. Rp 30.000 itu murah dibanding beli course hacking.
4. **Word-of-mouth kuat** — Komunitas niche = rekomendasi menyebar cepat.
5. **Content gampang dibuat** — Demo Ultramaxo bantu solve CTF challenge = konten yang menarik.

### Secondary: Mahasiswa IT/Coding

- Volume lebih besar tapi pain point kurang akut (ChatGPT free masih cukup buat banyak tugas)
- Capture secara natural lewat overlap dengan segment A

---

## Competitive Positioning Map

```
                    MAHAL
                      |
     Cursor -----    ChatGPT Plus
                      |
                      |       Claude Pro
     TypingMind       |
                      |
   ─────────────CENSORED────────────UNFILTERED─────
                      |
     Google Gemini    |
                      |
     Poe Free         |       ★ ULTRAMAXO ★
                      |
     ChatGPT Free     |
                      |
                    MURAH
```

**White space yang Ultramaxo occupy**: Murah + Unfiltered. Tidak ada pemain lain di kuadran ini, terutama yang lokal Indonesia.

---

## Positioning Statement (Moore's Formula)

**Selected:**

> Untuk **pelajar dan mahasiswa IT Indonesia** yang **frustrasi dengan AI yang terlalu banyak sensor dan terlalu mahal**, Ultramaxo adalah **AI workspace** yang **memberikan akses ke model AI terbaik tanpa filter dan tanpa biaya langganan mahal** — tidak seperti ChatGPT dan Claude yang **membatasi jawaban dan membebankan $20/bulan**.

**Versi pendek (untuk konten/bio):**

> "AI workspace tanpa batas. Gratis mulai, Rp 30rb/bulan buat unlimited."

---

## Ansoff Matrix Position

**Market Penetration** — Produk existing, pasar existing.

- Produk sudah live dan functional
- Pasar (anak IT/hacking Indonesia) sudah ada dan aktif pakai AI
- Fokus 100% pada penetrasi pasar yang ada, bukan develop fitur baru atau masuk market baru
- Jangan tergoda bangun fitur baru. Yang ada sudah cukup untuk monetisasi.

---

## Porter's Generic Strategy

**Focus Differentiation**

- **Focus**: Niche sempit (pelajar IT/hacking Indonesia)
- **Differentiation**: Unfiltered + BYOK + harga Rupiah + UI premium
- Bukan cost leadership (masih ada yang free), bukan broad differentiation
- Menang di satu niche dulu, expand kemudian

---

## Value Proposition Canvas

| Customer Side | Product Side | Fit? |
|---|---|---|
| **Job**: Belajar hacking/coding dengan bantuan AI | AI chat yang bisa jawab pertanyaan cybersecurity | Ya |
| **Job**: Bikin script/exploit/tool dengan cepat | Code artifact + multi-model workspace | Ya |
| **Pain**: ChatGPT tolak pertanyaan security | Unfiltered AI persona | Ya — key differentiator |
| **Pain**: $20/bulan terlalu mahal | Free tier + Rp 30.000/bulan | Ya — 10x lebih murah |
| **Pain**: Harus ganti-ganti platform | Satu workspace (chat + code + file) | Ya |
| **Gain**: Merasa jago/advanced | UI premium + tools yang terasa exclusive | Ya |
| **Gain**: Bisa flex ke teman | Brand yang "keren" di komunitas | Perlu dibangun |

---

## Customer Journey Map

| Stage | Customer Action | Emotion | Touchpoint | Drop-off Risk | Intervention |
|---|---|---|---|---|---|
| **1. Trigger** | Frustrasi ChatGPT tolak jawab pertanyaan hacking | Kesal, stuck | ChatGPT response | — | — |
| **2. Discovery** | Lihat post/video tentang Ultramaxo di komunitas IT | Penasaran | Discord/Telegram share, konten | Low | Konten harus show "before/after" (ChatGPT tolak vs Ultramaxo jawab) |
| **3. First Visit** | Kunjungi ultramaxo.tech, lihat landing page | Impressed tapi skeptis | Landing page | Medium — bisa bounce | Landing page harus straight to the point. CTA jelas. |
| **4. Registration** | Daftar akun (Google OAuth) | Mudah, tanpa friction | Register page | Low — Google OAuth gampang | Pastikan 1-click registration works |
| **5. First Use** | Coba tanya hal yang ditolak ChatGPT | Excited kalau berhasil | Chat interface | HIGH — kalau pengalaman pertama buruk | Onboarding message + contoh prompt yang impressive |
| **6. Habit** | Pakai sehari-hari buat belajar/coding | Comfortable, valuable | Workspace | Medium — bisa lupa | Push notification (PWA) + email reminder |
| **7. Upgrade** | Merasa perlu lebih (limit tercapai) | Willing to pay | Pricing page / upgrade prompt | HIGH — payment friction | Upgrade flow seamless. Tunjukkan value yang sudah dinikmati. |
| **8. Advocacy** | Share ke teman di grup hacking/IT | Bangga, helpful | Discord/Telegram/WA | Low (kalau puas) | Berikan referral incentive / shareable content |

**Drop-off terbesar**: Stage 5 (first use) dan Stage 7 (upgrade). Fokus intervensi di sini.

---

## Strategic Phasing (Disesuaikan dengan Kondisi Nyata)

| Phase | Timeline | Priority | Success Signal |
|---|---|---|---|
| **Phase 1: Infiltrate Communities** | Minggu 1-4 | Masuk ke 5-10 grup Discord/Telegram hacking/IT Indonesia. Share value (jawab pertanyaan), softly introduce Ultramaxo. | 100 registrasi pertama |
| **Phase 2: Content Proof** | Minggu 2-6 | Buat 10-15 konten "ChatGPT ditolak, Ultramaxo bisa" — screenshot/screen recording. Post di grup + TikTok + X. | Konten deshare di luar grup asal |
| **Phase 3: Activate Community** | Minggu 4-8 | Buat grup Telegram/Discord sendiri. Undang user yang sudah aktif. | 100 members di community sendiri |
| **Phase 4: Monetize** | Minggu 6-12 | Push konversi Free→Pro. In-app upgrade prompt. Limited-time offer. | 50 paying users, Rp 1.5 juta MRR |

### Mengapa BUKAN TikTok/YouTube-First?

- TikTok kamu saat ini 200-500 views, jarang FYP. Butuh waktu lama buat grow.
- SEO juga belum bisa diandalkan (butuh 3-6 bulan buat ranking).
- **Community infiltration jauh lebih cepat dan targeted** — langsung ke orang yang butuh, tanpa butuh algoritma.
- TikTok dan YouTube jadi **supporting channel** (repurpose konten dari community), bukan main channel.

---

## Strategic Alignment Check

| Situation Finding | Strategy Response |
|---|---|
| ChatGPT 85% market tapi mahal + censored | Position di kuadran Murah + Unfiltered |
| Target audience ada di Discord/Telegram | Channel utama = community infiltration, bukan sosmed/SEO |
| Solo founder, zero budget | Guerrilla approach: manual, high-touch, community-first |
| Modal minus, butuh revenue cepat | Fast monetization via tight funnel: community → register → use → upgrade |
| TikTok 200-500 views, SEO lemah | Bukan primary channel. Supporting/repurpose saja |
| 86% mahasiswa sudah pakai GenAI | Market sudah teredukasi, tidak perlu educate "apa itu AI" |
