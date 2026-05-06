import type { TaskType } from "./detect-task-type";

export interface ThinkingStep {
	id: string;
	label: string;
	detail?: string;
	status: "running" | "done";
	durationMs?: number;
}

function summarizePrompt(userMessage: string) {
	const compact = userMessage.replace(/\s+/g, " ").trim();
	if (!compact) {
		return "permintaan ini";
	}

	return compact.length > 88 ? `${compact.slice(0, 85)}...` : compact;
}

function asUserIntent(userMessage: string) {
	return `User meminta saya ${summarizePrompt(userMessage).toLowerCase()}, jadi saya perlu memahami konteks dan tujuan utamanya dulu.`;
}

export function getThinkingSteps(
	taskType: TaskType,
	userMessage: string,
): ThinkingStep[] {
	const promptSummary = summarizePrompt(userMessage);

	switch (taskType) {
		case "math":
			return [
				{
					id: "math-1",
					label: "Mengidentifikasi tipe soal dan variabel",
					detail: `Saya perlu mengenali bentuk soal dari "${promptSummary}" supaya langkah hitungnya tepat.`,
					status: "running",
				},
				{
					id: "math-2",
					label: "Menyusun persamaan",
					detail: "Setelah polanya jelas, saya susun rumus atau persamaan yang paling relevan.",
					status: "running",
				},
				{
					id: "math-3",
					label: "Menghitung langkah demi langkah",
					detail: "Saya kerjakan urut supaya hasil akhirnya bisa ditelusuri dengan jelas.",
					status: "running",
				},
				{
					id: "math-4",
					label: "Memverifikasi hasil",
					detail: "Sebelum menjawab, saya cek lagi apakah hasilnya konsisten dan masuk akal.",
					status: "running",
				},
			];

		case "coding":
			return [
				{
					id: "coding-1",
					label: "Memahami struktur dan requirements",
					detail: `User meminta saya ${promptSummary.toLowerCase()}, jadi saya harus pahami struktur, kebutuhan, dan output yang diinginkan dulu.`,
					status: "running",
				},
				{
					id: "coding-2",
					label: "Merancang arsitektur solusi",
					detail: "Saya tentukan pendekatan implementasi yang paling pas sebelum mulai menyentuh kode.",
					status: "running",
				},
				{
					id: "coding-3",
					label: "Menulis implementasi",
					detail: "Sesudah arahnya jelas, saya mulai menyusun perubahan inti yang benar-benar dibutuhkan.",
					status: "running",
				},
				{
					id: "coding-4",
					label: "Memeriksa edge cases dan error handling",
					detail: "Saya cek apakah solusi ini aman buat kondisi pinggir dan tidak gampang jebol saat dipakai.",
					status: "running",
				},
				{
					id: "coding-5",
					label: "Review dan optimasi kode",
					detail: "Terakhir saya rapikan supaya hasilnya lebih stabil, jelas, dan enak dilanjutkan.",
					status: "running",
				},
			];

		case "writing":
			return [
				{
					id: "writing-1",
					label: "Menganalisis tone dan target audiens",
					detail: `Saya baca dulu maksud dari "${promptSummary}" supaya tone dan gaya tulisannya pas.`,
					status: "running",
				},
				{
					id: "writing-2",
					label: "Menyusun struktur dan outline",
					detail: "Kalau kerangkanya jelas dari awal, hasil akhirnya akan terasa lebih rapi dan meyakinkan.",
					status: "running",
				},
				{
					id: "writing-3",
					label: "Menulis draft pertama",
					detail: "Saya mulai tuangkan inti pesannya dulu sebelum masuk ke perapihan detail.",
					status: "running",
				},
				{
					id: "writing-4",
					label: "Menyempurnakan diksi dan alur",
					detail: "Terakhir saya poles pilihan kata dan alurnya supaya lebih enak dibaca.",
					status: "running",
				},
			];

		case "reasoning":
			return [
				{
					id: "reasoning-1",
					label: "Memahami pertanyaan inti",
					detail: asUserIntent(userMessage),
					status: "running",
				},
				{
					id: "reasoning-2",
					label: "Mengidentifikasi asumsi dan konteks",
					detail: "Saya cari dulu konteks tersembunyi dan asumsi yang mempengaruhi jawabannya.",
					status: "running",
				},
				{
					id: "reasoning-3",
					label: "Membangun argumen dan bukti",
					detail: "Setelah konteksnya kebaca, saya susun jawaban yang punya alasan jelas, bukan sekadar opini mentah.",
					status: "running",
				},
				{
					id: "reasoning-4",
					label: "Mempertimbangkan sudut pandang alternatif",
					detail: "Saya cek juga apakah ada sisi lain yang perlu dipertimbangkan sebelum mengunci jawaban.",
					status: "running",
				},
				{
					id: "reasoning-5",
					label: "Menarik kesimpulan",
					detail: "Terakhir saya padatkan jadi kesimpulan yang jelas dan langsung berguna buat user.",
					status: "running",
				},
			];

		default:
			return [
				{
					id: "general-1",
					label: "Memahami permintaan",
					detail: asUserIntent(userMessage),
					status: "running",
				},
				{
					id: "general-2",
					label: "Menyusun respons terbaik",
					detail: "Saya pilih bentuk jawaban yang paling pas supaya hasilnya tidak muter-muter dan langsung kena kebutuhan user.",
					status: "running",
				},
				{
					id: "general-3",
					label: "Memfinalisasi jawaban",
					detail: "Setelah alurnya oke, saya rapikan jadi jawaban akhir yang enak dibaca dan siap dikirim.",
					status: "running",
				},
			];
	}
}
