# API Platform: Katalog Model + Docs + Billing (Per Token)

Tanggal: 2026-04-28
Pemilik: Putra
Status: Draft (direvisi berdasarkan arahan terbaru)

## Tujuan
- Membuat katalog model yang stabil dari SwiftRouter, disimpan di DB, dan dipakai oleh API, docs, dan landing page.
- Menyediakan dokumentasi per model yang lengkap (harga, context, capability, contoh request/response).
- Memperbaiki billing agar per token (per 1 juta token) dan konsisten untuk streaming maupun non-streaming.
- Menambahkan rate limit dan enforcement kuota per API key.
- Semua fitur berjalan end-to-end tanpa bug fungsional.

## Bukan Tujuan
- Mengganti SwiftRouter atau menambah provider upstream lain.
- Membuat UI billing baru di luar alur kredit/top-up yang sudah ada.
- Redesain besar untuk pricing/landing (hanya menambah info model dan badge capability).

## Masalah Saat Ini
- [app/api/v1/chat/completions/route.ts](app/api/v1/chat/completions/route.ts) masih punya fallback hardcoded API key.
- Streaming billing memakai flat fee, bukan usage token.
- List model masih live tanpa normalisasi dan tanpa metadata capability.
- Landing page memakai list statis dan badge tidak sinkron dengan source of truth.

## Pendekatan (Disetujui)
Hybrid cache + override (SwiftRouter sebagai source of truth):
- Sync berkala dari SwiftRouter lalu normalisasi ke katalog lokal.
- Katalog menjadi satu-satunya sumber untuk docs, landing, dan API.
- Override map untuk metadata yang tidak tersedia (capability/logo).

## Arsitektur
1) Cron/scheduler menarik data model dari SwiftRouter.
2) Normalisasi: mapping raw payload ke skema katalog.
3) Simpan: upsert ke `model_catalog`, log ke `model_catalog_refresh_log`.
4) Serve:
   - `/api/v1/models` baca dari katalog.
   - Docs publik dan tab API Platform baca dari katalog.
   - Landing page menampilkan badge capability dari katalog.

## Data Model
### Tabel: model_catalog
- id (uuid)
- modelId (text, unique): id asli dari SwiftRouter
- name (text)
- provider (text)
- context (integer atau text)
- priceIn (numeric) -- harga input per 1 juta token
- priceOut (numeric) -- harga output per 1 juta token
- priceUnit (text, default "per_1m")
- currency (text, default "USD")
- isFree (boolean)
- capabilities (json array): contoh ["text", "vision", "logo", "audio", "image"]
- status (text): active|deprecated|hidden
- raw (json): payload asli SwiftRouter
- createdAt (timestamp)
- updatedAt (timestamp)

Indeks yang dibutuhkan: `modelId` (unique), `provider`, `isFree`, `status`.

### Tabel: model_catalog_refresh_log
- id (uuid)
- status (text): success|error
- message (text)
- refreshedAt (timestamp)
- count (integer)

## Aturan Normalisasi
- Harga disimpan per 1 juta token (USD). Jika SwiftRouter memberi format lain, lakukan konversi ke per 1 juta.
- Jika harga tidak ada: `priceIn/priceOut = null`, `status = hidden` sampai diisi override.
- Capability diambil dari metadata SwiftRouter. Jika tidak lengkap, gunakan override map.
- `context` diisi numeric jika tersedia, jika tidak simpan text.

## Aturan Model Gratis & Topup
- Model gratis hanya **GPT-5.3** (pastikan mapping ke `modelId` SwiftRouter).
- Model selain GPT-5.3 dianggap berbayar.
- Untuk memakai model berbayar, user harus memiliki saldo minimal **USD 2**.
- Kredit dihitung dalam **USD**.

## Endpoint API
### Publik
- `GET /api/v1/models`
  - Query: `capability`, `provider`, `free`, `limit`, `offset`
  - Response: daftar model dari katalog

- `GET /api/v1/models/:id`
  - Response: detail model

### Admin/cron
- `POST /api/admin/models/refresh`
  - Auth: admin-only
  - Menjalankan refresh dan mengembalikan ringkasan

## Docs & UI
### Docs Publik
- Halaman list model + halaman detail.
- Konten minimal per model:
  - Nama, provider, context
  - Harga input/output (per 1M)
  - Capability (text/vision/logo/audio/image)
  - Contoh request/response
  - Ketersediaan (free/paid)

### Tab API Platform
- Tabel model dan detail yang sama dengan docs publik.
- Menampilkan saldo kredit dan syarat topup minimal USD 2.

### Landing Page
- Badge capability untuk tiap model.
- Badge "Logo" hanya muncul jika model punya capability image generation.

## Billing (Per Token, USD)
- Rumus biaya:
  - costUSD = (prompt_tokens / 1_000_000) * priceIn + (completion_tokens / 1_000_000) * priceOut
- Non-streaming:
  - Ambil `usage` dari SwiftRouter dan debit `creditAccount`.
- Streaming:
  - Baca usage di final chunk SSE.
  - Jika usage tidak ada, estimasi token dari total teks dan gunakan minimum fee (konfigurasi).
  - Pastikan debit hanya sekali per request.

## Rate Limit & Kuota
- Free (GPT-5.3): 5 request per menit per API key.
- Paid: default 60 request per menit per API key (configurable).
- Return 429 saat limit terlampaui.
- Return 402 saat saldo tidak cukup.

## Testing
- Unit:
  - Normalisasi model (raw -> katalog)
  - Kalkulasi biaya per token

- Integrasi:
  - `/api/v1/models` membaca cache
  - Refresh saat cache kosong
  - Debit kredit pada non-streaming
  - Streaming debit memakai usage final
  - Rule free-only GPT-5.3 + topup minimal USD 2

## Rencana Implementasi
1) Tambah schema & migration.
2) Buat job sync katalog + admin refresh.
3) Update `/api/v1/models` ke katalog.
4) Perbaiki billing per token.
5) Update landing page + tab API Platform + docs publik.
6) Tambah rate limit.
7) Testing dan verifikasi staging.

## Risiko & Mitigasi
- Metadata SwiftRouter tidak lengkap -> gunakan override map, status hidden jika data krusial kosong.
- Upstream down -> katalog cache + refresh manual.
- Streaming usage hilang -> estimasi token + minimum fee.

## Open Questions
- Tidak ada (semua requirement terbaru sudah masuk).
