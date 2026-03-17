import { Loader2Icon } from "lucide-react";

export function ChatRouteLoading({
	label = "Loading workspace...",
}: {
	label?: string;
}) {
	return (
		<div className="flex h-dvh w-full items-center justify-center bg-[#f3efe6] text-[#171717] dark:bg-[#111315] dark:text-[#f3f4f1]">
			<div className="flex flex-col items-center gap-4 rounded-[28px] border border-[#171717]/8 bg-white/70 px-8 py-7 shadow-[0_18px_50px_rgba(23,23,23,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-[#181a1c]/90 dark:shadow-[0_18px_50px_rgba(0,0,0,0.28)]">
				<Loader2Icon className="h-7 w-7 animate-spin text-teal-600 dark:text-teal-300" />
				<div className="text-sm font-medium">{label}</div>
				<p className="max-w-sm text-center text-xs text-[#5f6258] dark:text-[#8f9790]">
					Halaman chat sedang menyiapkan sidebar, riwayat pesan, dan context
					workspace.
				</p>
			</div>
		</div>
	);
}
