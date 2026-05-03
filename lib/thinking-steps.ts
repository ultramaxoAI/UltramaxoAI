import type { TaskType } from "./detect-task-type";

export interface ThinkingStep {
	id: string;
	label: string;
	detail?: string;
	status: "running" | "done";
	durationMs?: number;
}

export function getThinkingSteps(
	taskType: TaskType,
	userMessage: string,
): ThinkingStep[] {
	const clippedPrompt = userMessage.trim().slice(0, 72);

	switch (taskType) {
		case "math":
			return [
				{
					id: "math-1",
					label: "Mengidentifikasi tipe soal dan variabel",
					detail: clippedPrompt ? `Input: ${clippedPrompt}` : undefined,
					status: "running",
				},
				{ id: "math-2", label: "Menyusun persamaan", status: "running" },
				{
					id: "math-3",
					label: "Menghitung langkah demi langkah",
					status: "running",
				},
				{ id: "math-4", label: "Memverifikasi hasil", status: "running" },
			];

		case "coding":
			return [
				{
					id: "coding-1",
					label: "Memahami struktur dan requirements",
					status: "running",
				},
				{
					id: "coding-2",
					label: "Merancang arsitektur solusi",
					status: "running",
				},
				{ id: "coding-3", label: "Menulis implementasi", status: "running" },
				{
					id: "coding-4",
					label: "Memeriksa edge cases dan error handling",
					status: "running",
				},
				{
					id: "coding-5",
					label: "Review dan optimasi kode",
					status: "running",
				},
			];

		case "writing":
			return [
				{
					id: "writing-1",
					label: "Menganalisis tone dan target audiens",
					status: "running",
				},
				{
					id: "writing-2",
					label: "Menyusun struktur dan outline",
					status: "running",
				},
				{ id: "writing-3", label: "Menulis draft pertama", status: "running" },
				{
					id: "writing-4",
					label: "Menyempurnakan diksi dan alur",
					status: "running",
				},
			];

		case "reasoning":
			return [
				{
					id: "reasoning-1",
					label: "Memahami pertanyaan inti",
					status: "running",
				},
				{
					id: "reasoning-2",
					label: "Mengidentifikasi asumsi dan konteks",
					status: "running",
				},
				{
					id: "reasoning-3",
					label: "Membangun argumen dan bukti",
					status: "running",
				},
				{
					id: "reasoning-4",
					label: "Mempertimbangkan sudut pandang alternatif",
					status: "running",
				},
				{ id: "reasoning-5", label: "Menarik kesimpulan", status: "running" },
			];

		default:
			return [
				{ id: "general-1", label: "Memahami permintaan", status: "running" },
				{
					id: "general-2",
					label: "Menyusun respons terbaik",
					status: "running",
				},
				{
					id: "general-3",
					label: "Memfinalisasi jawaban",
					status: "running",
				},
			];
	}
}
