# App SEO + Chat UX (Streaming + History) Design

Tanggal: 2026-04-29
Pemilik: Putra
Status: Draft

## Tujuan
- Membuat halaman publik di app.ultramaxo.tech yang bisa diindeks Google: /docs, /models, /pricing.
- Menambahkan metadata SEO lengkap (title, description, canonical, Open Graph, Twitter, schema.org).
- Menjaga halaman private tetap login-only (billing, keys, playground, dll).
- Membuat UX chat terasa seperti GPT untuk streaming halus + riwayat chat yang rapi.

## Bukan Tujuan
- Merombak total layout UI.
- Membuka halaman private untuk publik.
- Membangun fitur baru selain streaming polish dan history.

## Scope
### Publik (SEO)
- app.ultramaxo.tech/docs
- app.ultramaxo.tech/models
- app.ultramaxo.tech/pricing

### Private (Login only)
- app.ultramaxo.tech/billing
- app.ultramaxo.tech/keys
- app.ultramaxo.tech/playground
- Semua rute sensitif lain tetap disallow di robots.

### Chat UX (ultramaxo.tech/chat)
- Streaming halus dengan auto-scroll pintar.
- Riwayat chat stabil dan judul otomatis.

## Arsitektur & Data Flow
### SEO app.ultramaxo.tech
- Layout khusus subdomain app untuk metadataBase, canonical, Open Graph, Twitter card.
- Rute publik SSR/SSG agar mudah diindeks.
- robots.txt app mengizinkan hanya rute publik, disallow semua rute private.
- sitemap app hanya memuat rute publik.
- Structured data:
  - /pricing: Product atau SoftwareApplication
  - /models: ItemList + Product per model bila perlu
  - /docs: TechArticle atau WebPage

### Chat UX
- Streaming: render token-by-token tanpa jank, auto-scroll hanya saat user berada di bottom.
- Auto-scroll toggle: jika user scroll ke atas, auto-scroll nonaktif sampai user kembali ke bawah atau klik tombol.
- History: judul otomatis dibuat sekali saat chat pertama selesai; SWR cache di-refresh setelah selesai stream.

## Komponen & Perubahan File
### SEO
- Layout metadata subdomain app.
- robots dan sitemap disesuaikan untuk publik vs private.
- Tambah komponen JsonLd per halaman publik.

### Chat UX
- useMessages hook: perbaiki logika isAtBottom/scrollToBottom saat streaming.
- Messages: konsisten dengan status streaming dan tombol scroll.
- History: memastikan update list di onFinish dan title stabil.

## Error Handling
- Rute publik tidak boleh redirect ke login.
- Jika streaming terputus, UI bisa resume atau regenerate tanpa duplicate message.
- Auto-scroll tidak boleh memaksa saat user membaca chat lama.

## Testing
- E2E manual: buka /docs, /models, /pricing di app tanpa login.
- Cek metadata output (title/description/canonical/og) pada rute publik.
- Cek sitemap app hanya berisi rute publik.
- Chat: kirim pesan panjang, scroll ke atas saat streaming, pastikan tidak auto-jump.
- Chat: pastikan title history tidak berubah setelah regenerate.

## Risiko & Mitigasi
- SEO tidak naik karena konten tipis -> tambahkan deskripsi panjang, FAQ, dan contoh kode.
- Streaming terasa patah -> throttle render jika perlu.

## Open Questions
- Tidak ada.
