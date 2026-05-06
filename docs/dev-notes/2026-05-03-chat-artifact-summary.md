# Summary Pekerjaan - 2026-05-03

Ringkasan ini fokus ke perubahan yang kita kerjakan hari ini di area chat, artifact, dan UI workspace UltramaxoAI.
10
## Goal utama hari ini

1. Ngebenerin chat yang blank / kosong setelah agent jalan.
2. Ngebenerin artifact panel yang sering kebuka prematur atau tampil file kosong (`code.txt`, `1`, `0`, atau workspace kosong).
3. Ngerapihin layout chat + artifact supaya tidak collapse.
4. Ngerapihin UI empty state, message list, dan composer biar lebih enak dipakai.

## Area yang diubah

### 1. Chat + layout stability

File utama:

- `components/chat.tsx`
- `components/chat-header.tsx`
- `components/messages.tsx`
- `components/message.tsx`
- `components/multimodal-input.tsx`
- `components/chat-error-boundary.tsx`
- `app/(chat)/chat/[id]/page.tsx`

Yang dilakukan:

- Layout chat dan artifact dibikin lebih stabil sebagai sibling flex.
- Chat column dijaga tetap ada di tree, lalu lebarnya berubah via class/layout, bukan lewat render tree yang bikin remount.
- Ditambah error boundary supaya crash render di area chat tidak langsung bikin halaman gelap total.
- `messages` dan `message` dibikin lebih defensif terhadap data yang null, shape part yang tidak konsisten, dan tool part yang incomplete.
- Composer diperbesar dan dibuat lebih rounded.
- Ukuran message bubble, padding, avatar, dan spacing dinaikkan.

## 2. Artifact flow + streaming

File utama:

- `components/artifact.tsx`
- `components/data-stream-handler.tsx`
- `artifacts/code/client.tsx`
- `backend/ai/tools/code-workspace.ts`
- `app/(chat)/api/chat/route.ts`

Yang dilakukan:

- Artifact tidak lagi dipaksa kebuka terlalu awal hanya karena metadata awal (`id`, `title`, `kind`) sudah datang.
- Empty bootstrap artifact event dikurangi supaya panel tidak kebuka dengan konten kosong.
- Sinkronisasi antara streamed content dan fetched document dibikin lebih aman, supaya konten yang sudah lebih lengkap tidak ketimpa data lama / pendek dari DB.
- Parser file di artifact code dibikin fallback ke parsing content kalau metadata files kosong.
- Streaming `codeDelta` disesuaikan ke snapshot kumulatif yang memang dipakai server.

## 3. Root cause render assistant kosong

File utama:

- `components/message.tsx`
- `lib/utils.ts`

Temuan penting:

- Sebagian response tool dari SDK tampil dalam format `dynamic-tool` / `tool-invocation`.
- Renderer chat sebelumnya lebih banyak ngandelin format `tool-*` lama.
- Akibatnya assistant message bisa lolos sampai state message, tapi part render-nya tidak muncul, jadi yang terlihat hanya bubble user atau panel kosong.

Fix yang masuk:

- `lib/utils.ts` sekarang tetap mempertahankan `dynamic-tool` saat sanitize message dari DB.
- `components/message.tsx` sekarang normalize `dynamic-tool` / `tool-invocation` menjadi format tool yang renderer lama sudah pahami.
- Akses ke `state`, `input`, `output`, dan `toolCallId` dibuat lebih aman lewat helper lokal.
- Render part dibungkus guard supaya satu part rusak tidak menjatuhkan seluruh message.

## 4. Greeting + empty state

File utama:

- `components/greeting.tsx`
- `components/messages.tsx`

Yang dilakukan:

- Greeting dibuat dinamis berdasarkan waktu.
- Greeting memakai nama depan user.
- Greeting beda antara user yang sudah punya history dan yang belum.
- Suggestion chips dibuang.
- Ukuran heading/subtext dibesarkan dan posisinya diturunkan supaya lebih dekat ke composer.

## 5. Styling / UX yang dirapihin

File utama:

- `app/globals.css`
- `components/app-sidebar.tsx`
- `components/sidebar-user-nav.tsx`
- `components/chat-header.tsx`
- `components/multimodal-input.tsx`
- `components/message.tsx`
- `components/messages.tsx`

Yang dilakukan:

- Tema digeser ke gaya gelap yang lebih minimal.
- Composer dibuat lebih besar, lebih lebar, lebih rounded.
- Message area dibuat lebih lega (`max width`, spacing, font size, padding).
- Header/sidebar dibersihkan dari elemen yang terlalu rame.

## File penting yang ditambah hari ini

- `components/chat-error-boundary.tsx`
- `components/agent-thinking-panel.tsx`
- `backend/ai/tools/request-clarification.ts`

## Verifikasi yang sudah dijalankan

Beberapa kali dijalankan:

```bash
npx tsc --noEmit --pretty false
```

Status terakhir sebelum summary ini dibuat: compile lolos setelah patch renderer message terbaru.

## Catatan penting untuk lanjut besok

1. Repo ini punya banyak file lain yang juga sedang berubah, jadi jangan anggap semua diff hari ini murni dari task chat/artifact.
2. Jalur yang paling sensitif sekarang tetap:
   - `components/message.tsx`
   - `components/data-stream-handler.tsx`
   - `artifacts/code/client.tsx`
   - `app/(chat)/api/chat/route.ts`
3. Kalau nanti hasil masih kosong:
   - cek console browser
   - cek bentuk `message.parts` assistant terakhir
   - pastikan part tool yang datang memang ikut lewat `sanitizeMessagePart`
4. Kalau artifact masih kosong:
   - cek event stream yang benar-benar terkirim
   - cek apakah konten baru datang sebagai `data-codeDelta`, `data-finish`, atau dari tool result

## Suggested next debugging path

Kalau besok mau lanjut dari titik paling efektif:

1. kirim satu prompt agent yang sederhana
2. inspect `messages[messages.length - 1].parts`
3. pastikan assistant turn punya part `dynamic-tool` / `tool-*` / `text`
4. cocokkan dengan renderer di `components/message.tsx`
5. kalau artifact masih kosong, log event di `components/data-stream-handler.tsx` dan `artifacts/code/client.tsx`

## File summary ini

Lokasi:

`docs/dev-notes/2026-05-03-chat-artifact-summary.md`
