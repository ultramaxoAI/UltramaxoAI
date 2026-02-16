import { ArrowLeft, Bot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Kebijakan Privasi — Ultramaxo AI",
  description:
    "Kebijakan privasi Ultramaxo AI — pelajari bagaimana kami melindungi data dan privasi Anda.",
};

export default function PrivacyPage() {
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
            Kebijakan Privasi
          </h1>
          <p className="text-slate-500 text-sm">
            Terakhir diperbarui: 15 Februari 2025
          </p>
        </div>

        <div className="prose prose-slate max-w-none space-y-8">
          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              1. Pendahuluan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Ultramaxo AI (&quot;kami&quot;, &quot;milik kami&quot;, atau
              &quot;Layanan&quot;) berkomitmen untuk melindungi privasi dan
              keamanan data pengguna. Kebijakan Privasi ini menjelaskan
              bagaimana kami mengumpulkan, menggunakan, menyimpan, dan
              melindungi informasi pribadi Anda saat menggunakan platform kami
              di <strong>ultramaxo.tech</strong>.
            </p>
            <p className="text-slate-700 leading-relaxed">
              Dengan menggunakan layanan Ultramaxo AI, Anda menyetujui praktik
              yang dijelaskan dalam Kebijakan Privasi ini. Jika Anda tidak
              setuju dengan kebijakan ini, harap hentikan penggunaan layanan
              kami.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              2. Informasi yang Kami Kumpulkan
            </h2>
            <h3 className="text-lg font-semibold text-slate-800 mb-2">
              2.1 Informasi Akun
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Saat Anda mendaftar, kami mengumpulkan:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Alamat email</li>
              <li>Nama (jika disediakan melalui OAuth atau profil)</li>
              <li>Informasi autentikasi (hash kata sandi atau token OAuth)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              2.2 Data Penggunaan
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Kami secara otomatis mengumpulkan:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Riwayat percakapan dengan AI</li>
              <li>Model AI yang digunakan</li>
              <li>Jumlah pesan yang dikirim per hari</li>
              <li>Informasi perangkat dan browser (User-Agent)</li>
              <li>Alamat IP (untuk keamanan dan pencegahan penyalahgunaan)</li>
            </ul>

            <h3 className="text-lg font-semibold text-slate-800 mb-2 mt-4">
              2.3 File yang Diunggah
            </h3>
            <p className="text-slate-700 leading-relaxed">
              Jika Anda mengunggah file sebagai bagian dari percakapan, file
              tersebut diproses untuk memberikan respons AI yang relevan. File
              dihapus secara otomatis setelah sesi percakapan berakhir kecuali
              disimpan secara eksplisit oleh Anda.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              3. Bagaimana Kami Menggunakan Informasi Anda
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami menggunakan informasi yang dikumpulkan untuk:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Menyediakan dan memelihara layanan Ultramaxo AI</li>
              <li>Mengautentikasi identitas Anda dan mengelola akun</li>
              <li>Menerapkan batasan penggunaan (kuota chat harian)</li>
              <li>Meningkatkan kualitas layanan dan pengalaman pengguna</li>
              <li>
                Mendeteksi dan mencegah penyalahgunaan atau aktivitas berbahaya
              </li>
              <li>
                Mengirim pemberitahuan terkait layanan (termasuk kode verifikasi
                email)
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              4. Penyimpanan dan Keamanan Data
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Data Anda disimpan di server yang aman dengan enkripsi standar
              industri. Kami menggunakan langkah-langkah keamanan berikut:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Enkripsi data dalam transit (TLS/SSL)</li>
              <li>Hash kata sandi menggunakan algoritma bcrypt</li>
              <li>
                Pembatasan akses berbasis peran (role-based access control)
              </li>
              <li>Pemantauan keamanan berkala</li>
              <li>Rate limiting untuk mencegah serangan brute force</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              5. Berbagi Data dengan Pihak Ketiga
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami <strong>tidak menjual</strong> data pribadi Anda kepada pihak
              ketiga. Data Anda hanya dibagikan dalam situasi berikut:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>
                <strong>Penyedia Model AI:</strong> Pesan Anda dikirim ke
                penyedia model AI pihak ketiga (seperti Google, Groq, dll.)
                untuk menghasilkan respons. Pesan diproses sesuai kebijakan
                privasi masing-masing penyedia.
              </li>
              <li>
                <strong>Penyedia Infrastruktur:</strong> Kami menggunakan
                layanan hosting dan database pihak ketiga yang mematuhi standar
                keamanan industri.
              </li>
              <li>
                <strong>Kewajiban Hukum:</strong> Kami dapat mengungkapkan data
                jika diwajibkan oleh hukum atau perintah pengadilan.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              6. Hak Anda
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Anda memiliki hak untuk:
            </p>
            <ul className="list-disc pl-6 text-slate-700 space-y-1 mt-2">
              <li>Mengakses dan mengunduh data pribadi Anda</li>
              <li>Memperbarui informasi akun Anda</li>
              <li>Menghapus akun dan seluruh data terkait</li>
              <li>Menolak pengiriman email promosi</li>
              <li>Membatasi pemrosesan data tertentu</li>
            </ul>
            <p className="text-slate-700 leading-relaxed mt-2">
              Untuk menggunakan hak-hak tersebut, silakan hubungi kami melalui
              email di <strong>admin@ultramaxo.tech</strong>.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              7. Cookie dan Teknologi Pelacakan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami menggunakan cookie yang diperlukan untuk keamanan autentikasi
              dan sesi pengguna. Kami tidak menggunakan cookie pelacakan pihak
              ketiga atau teknologi pelacakan iklan.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              8. Retensi Data
            </h2>
            <ul className="list-disc pl-6 text-slate-700 space-y-1">
              <li>
                <strong>Paket Gratis:</strong> Riwayat chat disimpan selama 7
                hari
              </li>
              <li>
                <strong>Paket Pro:</strong> Riwayat chat disimpan tanpa batas
                selama akun aktif
              </li>
              <li>
                <strong>Data akun:</strong> Disimpan selama akun Anda aktif
              </li>
              <li>
                <strong>Setelah penghapusan akun:</strong> Semua data dihapus
                dalam 30 hari kerja
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              9. Layanan untuk Anak di Bawah Umur
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Ultramaxo AI tidak ditujukan untuk anak-anak di bawah usia 13
              tahun. Kami tidak secara sengaja mengumpulkan data dari anak-anak.
              Jika kami mengetahui bahwa data telah dikumpulkan dari anak di
              bawah umur, kami akan segera menghapusnya.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              10. Perubahan Kebijakan
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Kami dapat memperbarui Kebijakan Privasi ini dari waktu ke waktu.
              Perubahan signifikan akan diberitahukan melalui email atau
              pemberitahuan di platform kami. Penggunaan berkelanjutan setelah
              perubahan dianggap sebagai persetujuan terhadap kebijakan yang
              diperbarui.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-bold text-slate-900 mb-3">
              11. Hubungi Kami
            </h2>
            <p className="text-slate-700 leading-relaxed">
              Jika Anda memiliki pertanyaan mengenai Kebijakan Privasi ini,
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
              href="/terms"
            >
              Syarat & Ketentuan
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
