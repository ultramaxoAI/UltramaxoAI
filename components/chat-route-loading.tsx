export function ChatRouteLoading({ label = "Loading..." }: { label?: string }) {
	return (
		<div className="flex h-dvh w-full items-center justify-center bg-[#f3efe6] dark:bg-[#111315]">
			<div className="flex flex-col items-center gap-5">
				{/* Minimal logo mark */}
				<div className="flex items-center gap-2.5">
					<span className="text-2xl font-serif tracking-[-0.04em] text-[#171717] dark:text-[#f3f4f1]">
						Ultramaxo
					</span>
				</div>

				{/* Subtle animated dots */}
				<div className="flex items-center gap-1.5">
					<span
						className="h-1.5 w-1.5 rounded-full bg-[#171717]/30 dark:bg-white/30 animate-pulse"
						style={{ animationDelay: "0ms" }}
					/>
					<span
						className="h-1.5 w-1.5 rounded-full bg-[#171717]/30 dark:bg-white/30 animate-pulse"
						style={{ animationDelay: "300ms" }}
					/>
					<span
						className="h-1.5 w-1.5 rounded-full bg-[#171717]/30 dark:bg-white/30 animate-pulse"
						style={{ animationDelay: "600ms" }}
					/>
				</div>

				{/* Minimal label */}
				<span className="text-xs font-medium text-[#5f6258]/60 dark:text-[#8f9790]/60 tracking-wide uppercase">
					{label}
				</span>
			</div>
		</div>
	);
}
