import { ArrowLeft, Bot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Syarat & Ketentuan — Ultramaxo AI",
  description:
    "Syarat dan ketentuan penggunaan Ultramaxo AI — aturan dan pedoman penggunaan layanan.",
};

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-[#f7f9fc] via-white to-[#eef2f7] text-slate-900">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-slate-200 bg-white/90 backdrop-blur-md shadow-sm">
        <div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
          <Link className="flex items-center gap-2" href="/">
            <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <span className="text-base font-bold text-slate-900">
              Ultramaxo AI
            </span>
          </Link>
          <Link
            className="flex items-center gap-1.5 text-sm text-slate-500 hover:text-slate-800 transition-colors"
            href="/"
          >
            <ArrowLeft className="w-4 h-4" />
            Kembali
          </Link>
        </div>
      </header>

      {/* Content */}
      <main className="max-w-4xl mx-auto px-6 py-12 sm:py-20">
        <div className="mb-12">
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900 mb-3">
            Syarat & Ketentuan
          </h1>
          <p className="text-slate-500 text-sm">
            Terakhir diperbarui: 15 Februari 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              1. Penerimaan Syarat
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Dengan mengakses atau menggunakan Ultramaxo AI
              (&quot;Layanan&quot;) yang tersedia di{" "}
              <strong>ultramaxo.tech</strong>, Anda menyetujui untuk terikat
              oleh Syarat dan Ketentuan ini. Jika Anda tidak menyetujui
              syarat-syarat ini, harap jangan gunakan layanan kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              2. Deskripsi Layanan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Ultramaxo AI adalah platform kecerdasan buatan yang menyediakan
              akses ke berbagai model AI untuk keperluan penulisan, pemrograman,
              analisis, dan percakapan umum. Layanan kami tersedia dalam paket
              Gratis dan Pro dengan fitur dan batasan yang berbeda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              3. Akun Pengguna
            </h2>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              3.1 Pendaftaran
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Untuk menggunakan layanan ini, Anda wajib membuat akun dengan
              memberikan informasi yang akurat dan lengkap. Anda bertanggung
              jawab untuk menjaga kerahasiaan kredensial akun Anda.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              3.2 Verifikasi Email
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Pendaftaran memerlukan verifikasi email melalui kode OTP. Akun
              yang tidak diverifikasi tidak akan dapat mengakses layanan
              sepenuhnya.
            </p>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              3.3 Keamanan Akun
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Anda bertanggung jawab penuh atas semua aktivitas yang terjadi di
              bawah akun Anda. Segera laporkan kepada kami jika ada akses tidak
              sah ke akun Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              4. Paket Layanan
            </h2>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              4.1 Paket Gratis
            </h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>
                Akses ke 3 model AI (WormGPT, Gemini 2.0 Flash, Groq Llama 3.3
                70B)
              </li>
              <li>Batas 20 chat per hari (reset setiap 24 jam)</li>
              <li>Riwayat chat disimpan selama 7 hari</li>
              <li>Upload file hingga 5MB</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              4.2 Paket Pro
            </h3>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>Akses ke seluruh 26 model AI</li>
              <li>Chat tanpa batas</li>
              <li>Riwayat chat tanpa batas</li>
              <li>Upload file hingga 100MB</li>
              <li>Dukungan prioritas</li>
              <li>Akses API</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              4.3 Pembayaran
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Paket Pro diaktifkan melalui sistem kode voucher (redeem code).
              Harga paket Pro adalah Rp 30.000/bulan. Pembayaran bersifat
              non-refundable kecuali ditentukan lain.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              5. Penggunaan yang Diperbolehkan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Anda setuju untuk menggunakan layanan kami hanya untuk tujuan yang
              sah. Anda <strong>dilarang</strong>:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>
                Menggunakan layanan untuk aktivitas ilegal atau melanggar hukum
              </li>
              <li>
                Mencoba mengeksploitasi, meretas, atau merusak infrastruktur
                kami
              </li>
              <li>
                Menggunakan bot atau skrip otomatis untuk mengakses layanan
                secara berlebihan
              </li>
              <li>
                Membuat konten yang mengandung ujaran kebencian, kekerasan, atau
                konten dewasa
              </li>
              <li>Membagikan akun atau kredensial kepada pihak lain</li>
              <li>
                Membalikkan rekayasa (reverse-engineer) atau menyalin layanan
                kami
              </li>
              <li>Menggunakan layanan untuk spam atau phishing</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              6. Konten yang Dihasilkan AI
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Respons yang dihasilkan oleh model AI diberikan apa adanya
              (&quot;as-is&quot;). Kami tidak menjamin keakuratan, kelengkapan,
              atau keandalan konten yang dihasilkan. Anda bertanggung jawab
              untuk memverifikasi informasi yang diterima sebelum
              menggunakannya.
            </p>
            <p className="text-slate-700 leading-relaxed mt-2">
              Ultramaxo AI tidak bertanggung jawab atas keputusan yang diambil
              berdasarkan output AI, termasuk namun tidak terbatas pada
              keputusan bisnis, medis, hukum, atau keuangan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              7. Hak Kekayaan Intelektual
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Platform Ultramaxo AI, termasuk desain, kode, logo, dan konten
              asli, merupakan hak milik kami dan dilindungi oleh hukum hak
              cipta. Konten yang Anda hasilkan melalui interaksi dengan AI
              menjadi milik Anda, dengan ketentuan bahwa kami berhak
              menggunakannya secara anonim untuk peningkatan layanan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              8. Batasan Tanggung Jawab
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Sejauh diizinkan oleh hukum, Ultramaxo AI tidak bertanggung jawab
              atas:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>
                Kerugian langsung atau tidak langsung yang timbul dari
                penggunaan layanan
              </li>
              <li>Gangguan layanan, downtime, atau kehilangan data</li>
              <li>Tindakan pihak ketiga termasuk penyedia model AI</li>
              <li>Konten yang dihasilkan oleh model AI</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              9. Penghentian Layanan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami berhak menangguhkan atau menghentikan akun Anda tanpa
              pemberitahuan sebelumnya jika Anda melanggar Syarat dan Ketentuan
              ini. Anda juga dapat menghapus akun Anda kapan saja melalui
              pengaturan akun atau dengan menghubungi kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              10. Ketersediaan Layanan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami berusaha menjaga ketersediaan layanan 99.9%, namun kami tidak
              menjamin layanan akan tersedia tanpa gangguan. Pemeliharaan
              terjadwal akan diinformasikan sebelumnya jika memungkinkan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              11. Perubahan Syarat
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami dapat memperbarui Syarat dan Ketentuan ini kapan saja.
              Perubahan signifikan akan diberitahukan melalui email atau
              notifikasi di platform. Penggunaan berkelanjutan setelah perubahan
              dianggap sebagai persetujuan Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              12. Hukum yang Berlaku
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Syarat dan Ketentuan ini diatur oleh dan ditafsirkan sesuai dengan
              hukum yang berlaku di Republik Indonesia. Segala sengketa yang
              timbul akan diselesaikan melalui musyawarah terlebih dahulu.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              13. Hubungi Kami
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Jika Anda memiliki pertanyaan mengenai Syarat dan Ketentuan ini,
              silakan hubungi kami di:
            </p>
            <div className="mt-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
              <p className="text-slate-800 font-semibold">Ultramaxo AI</p>
              <p className="text-slate-600 text-sm mt-1">
                Email: admin@ultramaxo.tech
              </p>
              <p className="text-slate-600 text-sm">Website: ultramaxo.tech</p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-6">
        <div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <p className="text-slate-500 text-sm">
            © 2025 Ultramaxo AI. Hak cipta dilindungi.
          </p>
          <div className="flex gap-4 text-sm">
            <Link
              className="text-slate-500 hover:text-slate-800 transition-colors"
              href="/privacy"
            >
              Kebijakan Privasi
            </Link>
            <Link
              className="text-slate-500 hover:text-slate-800 transition-colors"
              href="/"
            >
              Beranda
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
