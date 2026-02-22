export interface EmailTemplate {
	id: string;
	name: string;
	subject: string;
	body: string;
	type:
		| "custom"
		| "upgrade-reminder"
		| "verification-test"
		| "welcome"
		| "announcement";
}

export const EMAIL_TEMPLATES: EmailTemplate[] = [
	{
		id: "custom",
		name: "Custom Email (Blank)",
		subject: "",
		body: "",
		type: "custom",
	},
	{
		id: "upgrade-reminder",
		name: "Upgrade Reminder (Professional)",
		subject: "✨ Unlock Full Potential dengan Ultramaxo PRO!",
		body: `
<p>Halo <strong>User</strong>,</p>

<p>Kami melihat Anda sangat aktif menggunakan Ultramaxo AI. Maksimalkan pengalaman Anda dengan fitur <strong>PRO</strong>:</p>

<ul>
  <li>✨ Akses Ultra Agent Pro (Lebih Cerdas, Logika Tinggi & Coding Expert)</li>
  <li>⚡ Respon Lebih Cepat & Prioritas Antrian</li>
  <li>🎨 Generate Image Tanpa Batas</li>
  <li>📂 Upload Dokumen & Analisis Data</li>
</ul>

<div style="text-align: center; margin: 32px 0;">
  <a href="https://ultramaxo.tech/pricing" class="button">UPGRADE SEKARANG</a>
</div>

<p style="text-align: center;">Jangan lewatkan kesempatan untuk meningkatkan produktivitas Anda!</p>
    `,
		type: "upgrade-reminder",
	},
	{
		id: "welcome",
		name: "Welcome Email (Onboarding)",
		subject: "👋 Selamat Datang di Era Baru AI",
		body: `
<p>Halo <strong>User</strong>,</p>

<p>Selamat datang di <strong>Ultramaxo AI</strong>! Kami sangat senang Anda bergabung dengan komunitas kami yang terus berkembang.</p>

<p>Dengan Ultramaxo, Anda kini memiliki akses ke:</p>
<ul>
  <li>🤖 <strong>Ultra Agent:</strong> Asisten AI cerdas untuk tugas sehari-hari.</li>
  <li>⚡ <strong>Kecepatan Kilat:</strong> Dapatkan jawaban instan untuk pertanyaan kompleks Anda.</li>
  <li>🔒 <strong>Privasi Terjamin:</strong> Data Anda aman bersama kami.</li>
</ul>

<p>Siap memulai? Coba buat percakapan pertama Anda sekarang!</p>

<div style="text-align: center; margin: 32px 0;">
  <a href="https://ultramaxo.tech/chat" class="button">Mulai Chatting</a>
</div>
    `,
		type: "welcome",
	},
	{
		id: "announcement",
		name: "General Announcement",
		subject: "📢 Update Penting dari Ultramaxo AI",
		body: `
<p>Halo Semuanya,</p>

<p>Kami memiliki kabar gembira untuk Anda! Tim kami telah bekerja keras untuk menghadirkan fitur-fitur baru yang akan membuat pengalaman Anda semakin luar biasa.</p>

<h3>Apa yang Baru?</h3>
<ul>
  <li>🚀 <strong>Update Model:</strong> Ultra Agent kini lebih pintar dan cepat!</li>
  <li>🎨 <strong>Ultra Image Generator v2:</strong> Hasil gambar lebih realistis dan detail.</li>
  <li>🐞 <strong>Perbaikan Bug:</strong> Kinerja lebih stabil dan responsif.</li>
</ul>

<p>Terima kasih telah menjadi bagian dari perjalanan kami. Nikmati fitur baru sekarang juga!</p>
    `,
		type: "announcement",
	},
];
