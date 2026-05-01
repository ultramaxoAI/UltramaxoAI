"use client";

import { motion } from "framer-motion";
import {
	Command,
	CreditCard,
	LayoutTemplate,
	Settings,
	User,
} from "lucide-react";
import { useState } from "react";

const showcaseVariants = {
	hidden: { opacity: 0, y: 30 },
	visible: {
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			ease: [0.22, 1, 0.36, 1],
			staggerChildren: 0.1,
		},
	},
};

const itemVariants = {
	hidden: { opacity: 0, y: 15 },
	visible: {
		opacity: 1,
		y: 0,
		transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] },
	},
};

export function UiShowcase() {
	const [activeTab, setActiveTab] = useState(0);
	const [switchOn, setSwitchOn] = useState(true);

	return (
		<section className="px-5 py-24 sm:px-8 lg:px-10 lg:py-32 relative overflow-hidden">
			{/* Decorative background for showcase */}
			<div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_center,rgba(20,184,166,0.08),transparent_50%)] dark:bg-[radial-gradient(ellipse_at_center,rgba(45,212,191,0.05),transparent_50%)]" />

			<div className="mx-auto max-w-344">
				<div className="text-center mb-16">
					<motion.span
						initial={{ opacity: 0, scale: 0.95 }}
						whileInView={{ opacity: 1, scale: 1 }}
						viewport={{ once: true }}
						className="inline-flex rounded-full border border-teal-700/10 bg-teal-600/8 px-3 py-1.5 text-[11px] font-semibold tracking-[0.18em] uppercase text-teal-800 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-300"
					>
						UI Components Showcase
					</motion.span>
					<motion.h2
						initial={{ opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.1 }}
						className="mt-6 text-balance text-4xl font-semibold leading-[1.05] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1] mx-auto max-w-[18ch]"
					>
						Beautifully crafted, ready to deploy.
					</motion.h2>
					<motion.p
						initial={{ opacity: 0, y: 15 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ delay: 0.2 }}
						className="mt-5 text-lg text-[#5f6258] dark:text-[#a6aca6] max-w-[50ch] mx-auto"
					>
						Inspired by top-tier modern UI systems, embedded directly for an
						elegant visual experience.
					</motion.p>
				</div>

				<motion.div
					variants={showcaseVariants}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, amount: 0.1 }}
					className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
				>
					{/* Card 1: Buttons & Interactive Elements */}
					<motion.div
						variants={itemVariants}
						className="interactive-surface rounded-[24px] border border-[#171717]/8 bg-white/60 p-6 shadow-[0_18px_45px_rgba(23,23,23,0.02)] dark:border-white/8 dark:bg-white/4 backdrop-blur-sm"
					>
						<div className="text-sm font-medium tracking-tight mb-5 dark:text-[#f3f4f1]">
							Interactive Controls
						</div>
						<div className="grid gap-4">
							<div className="flex flex-wrap gap-3">
								<button className="rounded-xl bg-[#111315] px-4 py-2.5 text-sm font-semibold text-[#f3f4f1] transition-transform hover:scale-[1.02] active:scale-95 dark:bg-[#f3f4f1] dark:text-[#111315] w-full text-center shadow-lg shadow-black/5 dark:shadow-white/5">
									Primary Action
								</button>
								<button className="rounded-xl border border-[#171717]/10 bg-transparent px-4 py-2.5 text-sm font-medium text-[#171717] transition-all hover:bg-[#171717]/5 active:scale-95 dark:border-white/10 dark:text-[#f3f4f1] dark:hover:bg-white/5 w-full text-center">
									Secondary Outline
								</button>
							</div>

							<div className="flex items-center justify-between p-3 rounded-xl border border-[#171717]/8 bg-white/50 dark:border-white/6 dark:bg-[#111315]/50 mt-2">
								<div className="text-sm dark:text-[#f3f4f1]">
									Push Notifications
								</div>
								<button
									type="button"
									aria-label="Toggle notifications"
									onClick={() => setSwitchOn(!switchOn)}
									className={`w-11 h-6 rounded-full p-1 transition-colors duration-200 ease-in-out flex ${switchOn ? "bg-teal-500 justify-end" : "bg-[#e5e7eb] dark:bg-[#3f3f46] justify-start"}`}
								>
									<motion.div
										layout
										className="w-4 h-4 bg-white rounded-full shadow-sm"
										transition={{ type: "spring", stiffness: 500, damping: 30 }}
									/>
								</button>
							</div>

							<div className="group relative mt-2">
								<div className="absolute left-3 top-1/2 -translate-y-1/2 text-[#5f6258] dark:text-[#a6aca6]">
									<Command className="size-4" />
								</div>
								<input
									type="text"
									placeholder="Quick search..."
									className="w-full rounded-xl border border-[#171717]/10 bg-white px-9 py-2.5 text-sm outline-none transition-all focus:border-teal-500 focus:ring-1 focus:ring-teal-500 dark:border-white/10 dark:bg-[#0f1113] dark:text-[#f3f4f1]"
								/>
								<div className="absolute right-3 top-1/2 -translate-y-1/2 text-[10px] font-medium text-[#5f6258] dark:text-[#a6aca6] border border-[#171717]/10 dark:border-white/10 rounded px-1.5 py-0.5">
									⌘K
								</div>
							</div>
						</div>
					</motion.div>

					{/* Card 2: Complex Component / Menu */}
					<motion.div
						variants={itemVariants}
						className="interactive-surface rounded-[24px] border border-[#171717]/8 bg-white/60 p-6 shadow-[0_18px_45px_rgba(23,23,23,0.02)] dark:border-white/8 dark:bg-white/4 backdrop-blur-sm lg:col-span-1 md:col-span-1"
					>
						<div className="text-sm font-medium tracking-tight mb-5 dark:text-[#f3f4f1]">
							Command Menu
						</div>

						<div className="rounded-xl border border-[#171717]/8 bg-white overflow-hidden dark:border-white/8 dark:bg-[#15181b] shadow-sm">
							<div className="p-2 border-b border-[#171717]/8 dark:border-white/8">
								<input
									className="w-full bg-transparent px-2 py-1 text-sm outline-none dark:text-white"
									placeholder="Type a command or search..."
								/>
							</div>
							<div className="p-2 space-y-1">
								<div className="text-[10px] font-semibold uppercase tracking-wider text-[#5f6258] dark:text-[#a6aca6] px-2 py-1.5">
									Suggestions
								</div>
								{[
									{ icon: LayoutTemplate, label: "Templates" },
									{ icon: User, label: "Profile Settings" },
									{ icon: CreditCard, label: "Billing & Plans" },
									{ icon: Settings, label: "Advanced Configurations" },
								].map((item, i) => (
									<button
										type="button"
										key={item.label}
										className={`flex w-full items-center gap-2 rounded-lg px-2 py-1.5 text-sm transition-colors ${i === 0 ? "bg-teal-500/10 text-teal-700 dark:text-teal-300" : "text-[#171717] hover:bg-[#171717]/5 dark:text-[#f3f4f1] dark:hover:bg-white/5"}`}
									>
										<item.icon className="size-4" />
										{item.label}
									</button>
								))}
							</div>
						</div>
					</motion.div>

					{/* Card 3: Form Layout / Mini Profile */}
					<motion.div
						variants={itemVariants}
						className="interactive-surface rounded-[24px] border border-[#171717]/8 bg-white/60 p-6 shadow-[0_18px_45px_rgba(23,23,23,0.02)] dark:border-white/8 dark:bg-white/4 backdrop-blur-sm md:col-span-2 lg:col-span-1"
					>
						<div className="text-sm font-medium tracking-tight mb-5 dark:text-[#f3f4f1]">
							Data Display
						</div>

						<div className="rounded-[18px] border border-[#171717]/8 bg-white p-4 dark:border-white/8 dark:bg-[#131619] shadow-sm">
							<div className="flex items-center gap-3 border-b border-[#171717]/8 pb-4 dark:border-white/8">
								<div className="size-10 rounded-full bg-linear-to-tr from-teal-500 to-cyan-400 p-[2px]">
									<div className="size-full rounded-full border-2 border-white bg-white dark:border-[#131619] dark:bg-[#131619]" />
								</div>
								<div>
									<div className="text-sm font-semibold dark:text-[#f3f4f1]">
										John Doe
									</div>
									<div className="text-[11px] text-[#5f6258] dark:text-[#a6aca6]">
										Pro Member
									</div>
								</div>
							</div>

							<div className="mt-4 flex gap-2 border-b border-[#171717]/8 pb-4 dark:border-white/8">
								<button
									type="button"
									onClick={() => setActiveTab(0)}
									className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${activeTab === 0 ? "bg-[#111315] text-white dark:bg-white dark:text-[#111315]" : "text-[#5f6258] hover:bg-[#171717]/5 dark:text-[#a6aca6] dark:hover:bg-white/5"}`}
								>
									Overview
								</button>
								<button
									type="button"
									onClick={() => setActiveTab(1)}
									className={`text-xs font-medium px-3 py-1.5 rounded-full transition-colors ${activeTab === 1 ? "bg-[#111315] text-white dark:bg-white dark:text-[#111315]" : "text-[#5f6258] hover:bg-[#171717]/5 dark:text-[#a6aca6] dark:hover:bg-white/5"}`}
								>
									Activity
								</button>
							</div>

							<div className="mt-4">
								{activeTab === 0 ? (
									<div className="space-y-3">
										<div className="flex justify-between items-center text-sm">
											<span className="text-[#5f6258] dark:text-[#a6aca6]">
												Workspace usage
											</span>
											<span className="font-medium dark:text-white">84%</span>
										</div>
										<div className="h-1.5 w-full bg-[#171717]/10 dark:bg-white/10 rounded-full overflow-hidden">
											<motion.div
												initial={{ width: 0 }}
												whileInView={{ width: "84%" }}
												transition={{
													duration: 1.5,
													delay: 0.2,
													ease: "easeOut",
												}}
												className="h-full bg-teal-500 rounded-full"
											/>
										</div>
									</div>
								) : (
									<div className="space-y-3">
										{[1, 2].map((i) => (
											<div key={i} className="flex gap-3 text-sm">
												<div className="mt-1.5 size-1.5 rounded-full bg-teal-500 shrink-0" />
												<div className="dark:text-[#dbe1dc] leading-tight text-xs">
													Generated a new{" "}
													<span className="font-semibold text-teal-600 dark:text-teal-400">
														code artifact
													</span>{" "}
													for authentications layer.
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</div>
					</motion.div>
				</motion.div>
			</div>
		</section>
	);
}
