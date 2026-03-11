/**
 * Contoh Input Box Reagent.codes Style
 *
 * Warna yang digunakan:
 * - bg-app-bg: #09090b (background utama)
 * - bg-app-sidebar: #18181b (sidebar)
 * - bg-app-input: #27272a (input bar)
 * - bg-app-accent: #6366f1 (accent indigo)
 * - text-app-text: #f4f4f5 (text putih)
 */

export default function ReagentInputExample() {
	return (
		<div className="min-h-screen bg-app-bg flex items-center justify-center p-4">
			<div className="w-full max-w-3xl space-y-6">
				{/* Header */}
				<div className="text-center">
					<h1 className="text-app-text text-3xl font-bold mb-2">
						Reagent.codes Style
					</h1>
					<p className="text-zinc-400 text-sm">
						Ultra Dark Theme - Minimalist Design
					</p>
				</div>

				{/* Example 1: Basic Rounded-Full Input */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						Basic Input (Rounded-Full)
					</h2>
					<div className="bg-app-input rounded-full px-6 py-4 flex items-center gap-3 border border-zinc-800 focus-within:border-app-accent transition-colors">
						<svg
							className="w-5 h-5 text-zinc-400"
							fill="none"
							stroke="currentColor"
							viewBox="0 0 24 24"
						>
							<path
								d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
								strokeLinecap="round"
								strokeLinejoin="round"
								strokeWidth={2}
							/>
						</svg>
						<input
							className="flex-1 bg-transparent text-app-text placeholder:text-zinc-500 outline-none text-sm"
							placeholder="Lanjutkan percakapan"
							type="text"
						/>
						<button className="bg-app-accent hover:bg-indigo-600 text-white rounded-full p-2 transition-colors">
							<svg
								className="w-5 h-5"
								fill="none" 
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Example 2: Advanced Rounded-Full with Multiple Actions */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						Advanced Input (Multi-Action)
					</h2>
					<div className="bg-app-input rounded-full px-6 py-4 flex items-center gap-3 border border-zinc-800 focus-within:border-app-accent focus-within:ring-2 focus-within:ring-app-accent/20 transition-all">
						{/* Attachment Button */}
						<button className="text-zinc-400 hover:text-app-text transition-colors p-1">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M15.172 7l-6.586 6.586a2 2 0 102.828 2.828l6.414-6.586a4 4 0 00-5.656-5.656l-6.415 6.585a6 6 0 108.486 8.486L20.5 13"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>

						{/* Input Field */}
						<input
							className="flex-1 bg-transparent text-app-text placeholder:text-zinc-500 outline-none text-sm"
							placeholder="Lanjutkan percakapan"
							type="text"
						/>

						{/* Voice Button */}
						<button className="text-zinc-400 hover:text-app-text transition-colors p-1">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M19 11a7 7 0 01-7 7m0 0a7 7 0 01-7-7m7 7v4m0 0H8m4 0h4m-4-8a3 3 0 01-3-3V5a3 3 0 116 0v6a3 3 0 01-3 3z"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>

						{/* Send Button */}
						<button className="bg-app-accent hover:bg-indigo-600 text-white rounded-full p-2 transition-colors">
							<svg
								className="w-5 h-5"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Example 3: Floating Bottom Input (Full Width) */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						Floating Bottom Style
					</h2>
					<div className="relative">
						<div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-app-bg via-app-bg to-transparent pt-8 pb-6 px-6">
							<div className="max-w-3xl mx-auto">
								<div className="bg-app-input rounded-full px-6 py-4 flex items-center gap-3 border border-zinc-800 shadow-2xl focus-within:border-app-accent focus-within:ring-2 focus-within:ring-app-accent/20 transition-all">
									<button className="text-zinc-400 hover:text-app-text transition-colors">
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M12 4v16m8-8H4"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
											/>
										</svg>
									</button>
									<input
										className="flex-1 bg-transparent text-app-text placeholder:text-zinc-500 outline-none text-sm"
										placeholder="Lanjutkan percakapan"
										type="text"
									/>
									<button className="bg-app-accent hover:bg-indigo-600 text-white rounded-full p-2 transition-all hover:scale-105">
										<svg
											className="w-5 h-5"
											fill="none"
											stroke="currentColor"
											viewBox="0 0 24 24"
										>
											<path
												d="M13 7l5 5m0 0l-5 5m5-5H6"
												strokeLinecap="round"
												strokeLinejoin="round"
												strokeWidth={2}
											/>
										</svg>
									</button>
								</div>
							</div>
						</div>
					</div>
				</div>

				{/* Example 4: Compact Rounded-Full */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						Compact Input
					</h2>
					<div className="bg-app-input rounded-full px-5 py-3 flex items-center gap-2 border border-zinc-800 focus-within:border-app-accent transition-colors">
						<input
							className="flex-1 bg-transparent text-app-text placeholder:text-zinc-600 outline-none text-xs"
							placeholder="Type here..."
							type="text"
						/>
						<button className="bg-app-accent hover:bg-indigo-600 text-white rounded-full p-1.5 transition-colors">
							<svg
								className="w-4 h-4"
								fill="none"
								stroke="currentColor"
								viewBox="0 0 24 24"
							>
								<path
									d="M14 5l7 7m0 0l-7 7m7-7H3"
									strokeLinecap="round"
									strokeLinejoin="round"
									strokeWidth={2}
								/>
							</svg>
						</button>
					</div>
				</div>

				{/* Example 5: With Model Selector */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						With Model Selector
					</h2>
					<div className="space-y-3">
						{/* Model Selector */}
						<div className="flex items-center gap-2">
							<button className="bg-app-input hover:bg-zinc-800 text-app-text rounded-full px-4 py-2 text-xs border border-zinc-800 hover:border-app-accent transition-all flex items-center gap-2">
								<div className="w-2 h-2 bg-app-accent rounded-full" />
								<span>Reagent</span>
								<svg
									className="w-3 h-3"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M19 9l-7 7-7-7"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</button>
						</div>

						{/* Input */}
						<div className="bg-app-input rounded-full px-6 py-4 flex items-center gap-3 border border-zinc-800 focus-within:border-app-accent transition-colors">
							<button className="text-zinc-400 hover:text-app-text transition-colors">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</button>
							<input
								className="flex-1 bg-transparent text-app-text placeholder:text-zinc-500 outline-none text-sm"
								placeholder="Lanjutkan percakapan"
								type="text"
							/>
							<button className="bg-app-accent hover:bg-indigo-600 text-white rounded-full p-2 transition-colors">
								<svg
									className="w-5 h-5"
									fill="none"
									stroke="currentColor"
									viewBox="0 0 24 24"
								>
									<path
										d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8"
										strokeLinecap="round"
										strokeLinejoin="round"
										strokeWidth={2}
									/>
								</svg>
							</button>
						</div>
					</div>
				</div>

				{/* Color Palette Reference */}
				<div className="bg-app-sidebar rounded-3xl p-6">
					<h2 className="text-app-text text-lg font-semibold mb-4">
						Color Palette
					</h2>
					<div className="grid grid-cols-2 md:grid-cols-5 gap-3">
						<div className="space-y-2">
							<div className="bg-app-bg h-16 rounded-xl border border-zinc-800" />
							<p className="text-xs text-zinc-400 text-center">
								app-bg
								<br />
								#09090b
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-app-sidebar h-16 rounded-xl border border-zinc-800" />
							<p className="text-xs text-zinc-400 text-center">
								app-sidebar
								<br />
								#18181b
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-app-input h-16 rounded-xl border border-zinc-800" />
							<p className="text-xs text-zinc-400 text-center">
								app-input
								<br />
								#27272a
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-app-accent h-16 rounded-xl" />
							<p className="text-xs text-zinc-400 text-center">
								app-accent
								<br />
								#6366f1
							</p>
						</div>
						<div className="space-y-2">
							<div className="bg-app-text h-16 rounded-xl" />
							<p className="text-xs text-zinc-400 text-center">
								app-text
								<br />
								#f4f4f5
							</p>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
