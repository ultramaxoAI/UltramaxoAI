"use client";
import {
	AnimatePresence,
	motion,
	useScroll,
	useTransform,
} from "framer-motion";
import {
	ArrowRight,
	Check,
	ChevronDown,
	Code2,
	ExternalLink,
	Github,
	Layers,
	Menu,
	MessageSquare,
	Shield,
	Sparkles,
	Upload,
	X,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import { ThemeToggle } from "./theme-toggle";

/* ────────────────────────────────────────────
   Shared animation config
   ──────────────────────────────────────────── */
const ease = [0.25, 0.1, 0.25, 1];
const springLight = {
	type: "spring" as const,
	stiffness: 200,
	damping: 50,
	mass: 0.8,
};

const fadeUp = {
	hidden: { opacity: 0, y: 40, filter: "blur(8px)" },
	visible: (i = 0) => ({
		opacity: 1,
		y: 0,
		filter: "blur(0px)",
		transition: { ...springLight, delay: i * 0.12 },
	}),
};

const staggerContainer = {
	hidden: {},
	visible: { transition: { staggerChildren: 0.12 } },
};

/* ────────────────────────────────────────────
   Logo SVG component
   ──────────────────────────────────────────── */
const UltramaxoLogo = ({ size = 32 }: { size?: number }) => (
	<svg
		aria-label="Ultramaxo Logo"
		className="shrink-0"
		fill="none"
		height={size}
		role="img"
		viewBox="0 0 64 64"
		width={size}
		xmlns="http://www.w3.org/2000/svg"
	>
		<defs>
			<linearGradient
				gradientUnits="userSpaceOnUse"
				id="logoGrad"
				x1="0"
				x2="64"
				y1="0"
				y2="64"
			>
				<stop offset="0%" stopColor="#a855f7" />
				<stop offset="50%" stopColor="#818cf8" />
				<stop offset="100%" stopColor="#93c5fd" />
			</linearGradient>
			<radialGradient cx="50%" cy="40%" id="logoBg" r="60%">
				<stop offset="0%" stopColor="#1e293b" />
				<stop offset="100%" stopColor="#0f172a" />
			</radialGradient>
		</defs>
		<rect fill="url(#logoBg)" height="64" rx="14" width="64" />
		{/* Left arm of U */}
		<path
			d="M16 14 L16 40 Q16 50 26 50 L32 50"
			fill="none"
			stroke="url(#logoGrad)"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="4"
		/>
		<path
			d="M22 14 L22 38 Q22 46 30 46 L32 46"
			fill="none"
			opacity="0.7"
			stroke="url(#logoGrad)"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="3"
		/>
		{/* Right arm of U */}
		<path
			d="M48 14 L48 40 Q48 50 38 50 L32 50"
			fill="none"
			stroke="url(#logoGrad)"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="4"
		/>
		<path
			d="M42 14 L42 38 Q42 46 34 46 L32 46"
			fill="none"
			opacity="0.7"
			stroke="url(#logoGrad)"
			strokeLinecap="round"
			strokeLinejoin="round"
			strokeWidth="3"
		/>
		{/* Circuit nodes */}
		<circle cx="16" cy="24" fill="#a855f7" r="3" />
		<circle cx="22" cy="32" fill="#818cf8" r="2.5" />
		<circle cx="48" cy="24" fill="#93c5fd" r="3" />
		<circle cx="42" cy="32" fill="#818cf8" r="2.5" />
		<circle cx="32" cy="50" fill="#c084fc" r="3" />
		{/* Node inner glow */}
		<circle cx="16" cy="24" fill="white" opacity="0.6" r="1.5" />
		<circle cx="48" cy="24" fill="white" opacity="0.6" r="1.5" />
		<circle cx="32" cy="50" fill="white" opacity="0.6" r="1.5" />
	</svg>
);

/* ────────────────────────────────────────────
   Main component
   ──────────────────────────────────────────── */
export default function LandingPage() {
	const router = useRouter();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const heroRef = useRef<HTMLDivElement>(null);

	const { scrollYProgress } = useScroll({
		target: heroRef,
		offset: ["start start", "end start"],
	});
	const heroOpacity = useTransform(scrollYProgress, [0, 1], [1, 0]);
	const heroScale = useTransform(scrollYProgress, [0, 1], [1, 0.96]);

	const navLinks = [
		{ name: "Home", href: "#home" },
		{ name: "Features", href: "#features" },
		{ name: "Pricing", href: "#pricing" },
		{ name: "FAQ", href: "#faq" },
	];

	const scrollToSection = (href: string) => {
		setMobileNavOpen(false);
		const el = document.querySelector(href);
		if (el) {
			el.scrollIntoView({ behavior: "smooth" });
		}
	};

	/* ───── data ───── */
	const features = [
		{
			icon: Zap,
			title: "Instant Response",
			desc: "Answers available in seconds — UltraAgent is optimized for the highest inference speed.",
			link: "Learn more",
		},
		{
			icon: Code2,
			title: "Integrated Code Editor",
			desc: "Write, edit, and run code directly within conversations without switching apps.",
			link: "Learn more",
		},
		{
			icon: Layers,
			title: "Artifacts System",
			desc: "Create documents, spreadsheets, or images directly from conversations — export anytime.",
			link: "Learn more",
		},
		{
			icon: Upload,
			title: "Upload & Analyze Files",
			desc: "Upload files in any format and let AI analyze the contents automatically.",
			link: "Learn more",
		},
		{
			icon: MessageSquare,
			title: "Editable Conversations",
			desc: "Edit messages, regenerate answers, and save your entire conversation history.",
			link: "Learn more",
		},
		{
			icon: Shield,
			title: "Secure & Private",
			desc: "Data is encrypted, authentication is secure, and never shared with third parties.",
			link: "Learn more",
		},
	];

	const pricingPlans = [
		{
			name: "Free",
			price: "Rp 0",
			period: "forever",
			desc: "Try all basic features at no cost",
			features: [
				"AI Chat (UltraAgent)",
				"Basic code editor",
				"Limited chat history",
				"Syntax highlighting",
				"Standard file upload",
			],
			popular: false,
		},
		{
			name: "Pro",
			price: "Rp 20,000",
			period: "per month",
			desc: "For more needs — unlimited access",
			features: [
				"AI Chat (UltraAgent Pro)",
				"All Free plan features",
				"Unlimited conversations",
				"Permanent chat history",
				"Full code workspace",
				"Full Artifacts system",
				"Priority support",
			],
			popular: true,
		},
		{
			name: "1 Year",
			price: "Rp 120,000",
			period: "per year",
			desc: "Save more with the annual plan",
			features: [
				"All Pro features",
				"Dedicated support",
				"Custom deployment",
				"SLA guarantee",
				"Advanced analytics",
			],
			popular: false,
		},
	];

	const faqData = [
		{
			q: "Is Ultramaxo really free?",
			a: "Yes. The Free plan can be used immediately without a credit card and without time limits. You can upgrade anytime if you need additional features.",
		},
		{
			q: "What AI model is used?",
			a: "We use UltraAgent — an AI model optimized for speed and high accuracy, producing responses almost instantly.",
		},
		{
			q: "What are Artifacts?",
			a: "Artifacts allow you to create documents, spreadsheets, and images directly from AI conversations. Results can be exported and shared easily.",
		},
		{
			q: "How do I upgrade to Pro?",
			a: "Redeem a Pro code via Settings > Redeem Code after logging in. Codes can be obtained from the administrator.",
		},
		{
			q: "Is my data safe?",
			a: "Your data is safe. We use NextAuth.js, encrypted databases, and never share data with any party.",
		},
	];

	const capabilities = [
		"Chat",
		"Code Editor",
		"Artifacts",
		"File Upload",
		"Image Generation",
	];

	return (
		<div className="min-h-screen bg-background text-foreground overflow-hidden selection:bg-indigo-500/20 transition-colors duration-500 ease-in-out">
			{/* ───── Ambient glow ───── */}
			<div className="pointer-events-none fixed inset-0 z-0">
				<div className="absolute -top-32 left-1/2 -translate-x-1/2 w-[800px] h-[500px] rounded-full bg-indigo-600/10 blur-[120px]" />
				<div className="absolute top-[60%] -right-40 w-[500px] h-[400px] rounded-full bg-violet-600/8 blur-[100px]" />
			</div>

			{/* ═══════════════════════════════════════════
          NAVBAR
          ═══════════════════════════════════════════ */}
			<motion.nav
				animate={{ y: 0, opacity: 1 }}
				className="fixed top-0 left-0 right-0 z-50 border-b border-black/[0.06] dark:border-white/[0.06] bg-[#f8fafc] dark:bg-[#09090b]/80 backdrop-blur-xl transition-colors duration-300"
				initial={{ y: -40, opacity: 0 }}
				transition={{ duration: 0.4 }}
			>
				<div className="max-w-5xl mx-auto flex items-center justify-between h-14 px-4">
					<button
						className="flex items-center gap-2.5 group"
						onClick={() => scrollToSection("#home")}
						type="button"
					>
						<div className="rounded-lg overflow-hidden">
							<UltramaxoLogo size={28} />
						</div>
						<span className="font-bold text-base tracking-tight">
							<span className="text-gradient">ultra</span>
							<span className="text-zinc-900 dark:text-white">maxo</span>
							<span className="text-zinc-600 dark:text-gray-400">.ai</span>
						</span>
					</button>

					<div className="hidden md:flex items-center gap-6">
						{navLinks.map((l) => (
							<button
								className="text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors duration-200"
								key={l.name}
								onClick={() => scrollToSection(l.href)}
								type="button"
							>
								{l.name}
							</button>
						))}
					</div>

					<div className="hidden md:flex items-center gap-3">
						<ThemeToggle />
						<button
							className="text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors cursor-pointer"
							onClick={() => router.push("/login")}
							type="button"
						>
							Sign In
						</button>
						<motion.button
							className="relative inline-flex items-center justify-center gap-2 rounded-full px-5 py-2 text-xs font-semibold
								bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600
								shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
								transition-shadow duration-300 cursor-pointer"
							onClick={() => router.push("/register")}
							whileHover={{ scale: 1.04 }}
							whileTap={{ scale: 0.97 }}
						>
							Sign Up Free
						</motion.button>
					</div>

					<div className="flex md:hidden items-center gap-2">
						<ThemeToggle />
						<button
							className="text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white p-1 transition-colors"
							onClick={() => setMobileNavOpen(!mobileNavOpen)}
							type="button"
						>
							{mobileNavOpen ? <X size={22} /> : <Menu size={22} />}
						</button>
					</div>
				</div>

				{/* Mobile menu */}
				{mobileNavOpen && (
					<motion.div
						initial={{ opacity: 0, height: 0 }}
						animate={{ opacity: 1, height: "auto" }}
						className="md:hidden border-t border-black/[0.06] dark:border-white/[0.06] bg-[#f8fafc] dark:bg-[#09090b]"
					>
						<div className="flex flex-col gap-3 p-5">
							{navLinks.map((l) => (
								<button
									key={l.name}
									onClick={() => scrollToSection(l.href)}
									className="text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors text-left"
									type="button"
								>
									{l.name}
								</button>
							))}
							<button
								className="text-sm text-zinc-600 dark:text-gray-400 hover:text-zinc-900 dark:text-white transition-colors text-left"
								onClick={() => {
									setMobileNavOpen(false);
									router.push("/login");
								}}
								type="button"
							>
								Sign In
							</button>
							<motion.button
								className="rounded-full w-fit px-5 py-2 text-xs font-semibold mt-2
									bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 cursor-pointer"
								onClick={() => {
									setMobileNavOpen(false);
									router.push("/register");
								}}
								whileTap={{ scale: 0.97 }}
							>
								Sign Up Free
							</motion.button>
						</div>
					</motion.div>
				)}
			</motion.nav>

			{/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
			<section
				className="relative z-10 pt-32 pb-20 sm:pt-40 sm:pb-28"
				id="home"
				ref={heroRef}
			>
				<motion.div
					className="max-w-6xl mx-auto px-5"
					style={{ opacity: heroOpacity, scale: heroScale }}
				>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
						{/* Left — Copy */}
						<div>
							{/* Badge */}
							<motion.div
								animate="visible"
								className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.04] dark:bg-white/[0.04] text-xs text-zinc-600 dark:text-gray-400 mb-6"
								custom={0}
								initial="hidden"
								variants={fadeUp}
							>
								<Sparkles size={12} className="text-primary" />
								One Platform. All Tools. Zero Hassle.
							</motion.div>

							<motion.h1
								animate="visible"
								className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-5 text-zinc-900 dark:text-white"
								custom={1}
								initial="hidden"
								variants={fadeUp}
							>
								The AI Assistant
								<br />
								<span className="text-gradient">That Works Faster</span>
							</motion.h1>

							<motion.p
								animate="visible"
								className="text-zinc-600 dark:text-gray-400 text-lg leading-relaxed max-w-lg mb-8"
								custom={2}
								initial="hidden"
								variants={fadeUp}
							>
								Ultramaxo is an AI workspace for conversations, code
								development, and document creation — all in one platform.
								Instant responses, free to start.
							</motion.p>

							<motion.div
								animate="visible"
								className="flex flex-col sm:flex-row items-start gap-3 mb-8"
								custom={3}
								initial="hidden"
								variants={fadeUp}
							>
								<motion.button
									className="relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold
										bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600
										shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
										transition-shadow duration-300 cursor-pointer w-full sm:w-auto"
									onClick={() => router.push("/register")}
									whileHover={{ scale: 1.04 }}
									whileTap={{ scale: 0.97 }}
								>
									Start Free <ArrowRight className="w-4 h-4" />
								</motion.button>
								<motion.button
									className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-sm font-medium
										border border-black/10 dark:border-white/10 bg-[#f8fafc] dark:bg-[#09090b] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] hover:text-zinc-900 dark:hover:text-white backdrop-blur-sm
										transition-colors duration-200 cursor-pointer w-full sm:w-auto justify-center"
									onClick={() => scrollToSection("#features")}
									whileHover={{ scale: 1.04 }}
									whileTap={{ scale: 0.97 }}
								>
									Explore Features
								</motion.button>
							</motion.div>

							{/* Trusted bar */}
							<motion.div
								animate="visible"
								className="flex items-center gap-6 text-xs text-zinc-600 dark:text-gray-400"
								custom={4}
								initial="hidden"
								variants={fadeUp}
							>
								{[
									"UltraAgent Powered",
									"End-to-End Encrypted",
									"Free Forever Tier",
								].map((t) => (
									<span className="flex items-center gap-1.5" key={t}>
										<Check className="w-3.5 h-3.5 text-primary" />
										{t}
									</span>
								))}
							</motion.div>
						</div>

						{/* Right — Chat preview */}
						<motion.div
							animate="visible"
							className="relative hidden lg:block"
							custom={2}
							initial="hidden"
							variants={fadeUp}
						>
							<div className="rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] p-7 shadow-lg shadow-black/5 dark:shadow-black/40 transition-colors">
								{/* Header */}
								<div className="flex items-center justify-between mb-7">
									<div className="flex items-center gap-2.5">
										<div className="rounded-xl overflow-hidden">
											<UltramaxoLogo size={36} />
										</div>
										<div>
											<span className="font-semibold text-sm text-zinc-900 dark:text-white">
												Ultramaxo AI
											</span>
											<p className="text-[10px] text-zinc-600 dark:text-gray-400">
												UltraAgent
											</p>
										</div>
									</div>
									<span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 text-[10px] font-medium">
										Online
									</span>
								</div>

								{/* Messages */}
								<div className="space-y-4">
									<div className="flex justify-end">
										<div className="bg-primary/20 border border-primary/20 rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
											<p className="text-sm text-zinc-900 dark:text-white">
												Create a marketing strategy summary for Gen Z
											</p>
										</div>
									</div>
									<div className="flex justify-start">
										<div className="bg-black/[0.04] dark:bg-white/[0.04] border border-black/[0.06] dark:border-white/[0.06] rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
											<p className="text-sm text-zinc-900 dark:text-white leading-relaxed">
												Here&apos;s a strategy summary for Gen Z: Focus on short
												visual content, authenticity, social commerce, and
												community-driven campaigns...
											</p>
										</div>
									</div>
								</div>

								{/* Bottom tabs */}
								<div className="mt-7 grid grid-cols-3 gap-2">
									{["Chat", "Code", "Artifacts"].map((item) => (
										<div
											className="bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.06] dark:border-white/[0.06] rounded-lg px-3 py-2 text-center text-xs text-zinc-600 dark:text-gray-400"
											key={item}
										>
											{item}
										</div>
									))}
								</div>
							</div>

							{/* Floating badge */}
							<div className="absolute -top-3 -right-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-2.5 shadow-lg shadow-indigo-500/30 text-white">
								<Zap className="w-5 h-5" />
							</div>
						</motion.div>
					</div>

					{/* Stats */}
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ duration: 0.6, delay: 0.5 }}
						className="flex flex-wrap items-center justify-center gap-10 sm:gap-16 mt-20"
					>
						{[
							{ value: "2", label: "AI Models" },
							{ value: "1K+", label: "Users" },
							{ value: "99.9%", label: "Uptime" },
							{ value: "∞", label: "Conversations" },
						].map((stat) => (
							<div key={stat.label} className="text-center">
								<div className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-white">
									{stat.value}
								</div>
								<div className="text-sm text-zinc-600 dark:text-gray-400 mt-1">
									{stat.label}
								</div>
							</div>
						))}
					</motion.div>

					{/* Capabilities ticker */}
					<motion.div
						initial={{ opacity: 0 }}
						animate={{ opacity: 1 }}
						transition={{ delay: 0.7 }}
						className="flex flex-wrap items-center justify-center gap-2 mt-12"
					>
						{capabilities.map((cap) => (
							<span
								key={cap}
								className="px-3 py-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] text-xs font-medium text-zinc-600 dark:text-gray-400"
							>
								{cap}
							</span>
						))}
						<span className="px-3 py-1.5 rounded-lg border border-primary/20 bg-primary/5 text-xs font-medium text-primary">
							+more
						</span>
					</motion.div>
				</motion.div>
			</section>

			{/* ═══════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-20 sm:py-28" id="features">
				<div className="max-w-5xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							Features
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Why Ultramaxo?
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-md mx-auto">
							Everything you need in one AI-powered platform.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
						{features.map((feature, i) => (
							<motion.div
								key={feature.title}
								initial={{ opacity: 0, y: 16 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.07 }}
								className="group p-6 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:border-primary/30 hover:shadow-lg hover:shadow-primary/5 transition-all duration-300 flex flex-col"
							>
								<div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center mb-4 text-primary">
									<feature.icon size={20} />
								</div>
								<h3 className="text-base font-semibold mb-2 text-zinc-900 dark:text-white">
									{feature.title}
								</h3>
								<p className="text-sm text-zinc-600 dark:text-gray-400 leading-relaxed flex-1">
									{feature.desc}
								</p>
								<button
									className="inline-flex items-center gap-1 text-sm text-primary hover:underline mt-4 cursor-pointer self-start"
									type="button"
								>
									{feature.link}
									<ExternalLink size={12} />
								</button>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          HOW IT WORKS
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-20 sm:py-28 bg-black/[0.02] dark:bg-white/[0.02]">
				<div className="max-w-5xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							How It Works
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Get Started in{" "}
							<span className="text-gradient">3 Simple Steps</span>
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-md mx-auto">
							From sign up to your first AI conversation in under a minute.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-3 gap-6">
						{[
							{
								step: "01",
								title: "Create Your Account",
								desc: "Sign up for free in seconds. No credit card required — just your email and you're in.",
								icon: Zap,
							},
							{
								step: "02",
								title: "Choose Your Model",
								desc: "Pick UltraAgent for fast responses or UltraAgent Pro for advanced reasoning and coding tasks.",
								icon: Layers,
							},
							{
								step: "03",
								title: "Start Creating",
								desc: "Chat, write code, create documents, and upload files — all in one powerful workspace.",
								icon: Code2,
							},
						].map((item, i) => (
							<motion.div
								key={item.step}
								initial={{ opacity: 0, y: 20 }}
								whileInView={{ opacity: 1, y: 0 }}
								viewport={{ once: true }}
								transition={{ duration: 0.4, delay: i * 0.1 }}
								className="relative p-7 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] text-center"
							>
								<div className="text-5xl font-black text-primary/10 absolute top-4 right-5">
									{item.step}
								</div>
								<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 mx-auto text-primary">
									<item.icon size={24} />
								</div>
								<h3 className="text-lg font-semibold mb-2 text-zinc-900 dark:text-white">
									{item.title}
								</h3>
								<p className="text-sm text-zinc-600 dark:text-gray-400 leading-relaxed">
									{item.desc}
								</p>
							</motion.div>
						))}
					</div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          ABOUT / CODE EXAMPLE
          ═══════════════════════════════════════════ */}
			<section
				className="relative z-10 py-20 sm:py-28 bg-black/[0.02] dark:bg-white/[0.02]"
				id="about"
			>
				<div className="max-w-5xl mx-auto px-5">
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
						{/* Code block */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden">
								<div className="flex items-center gap-1.5 px-4 py-3 border-b border-black/[0.06] dark:border-white/[0.06]">
									<div className="w-2.5 h-2.5 rounded-full bg-red-500/60" />
									<div className="w-2.5 h-2.5 rounded-full bg-yellow-500/60" />
									<div className="w-2.5 h-2.5 rounded-full bg-green-500/60" />
									<span className="ml-2 text-xs text-zinc-600 dark:text-gray-400">
										chat-example.ts
									</span>
								</div>
								<pre className="p-4 text-sm leading-relaxed overflow-x-auto">
									<code className="text-zinc-700 dark:text-gray-300">{`// Start a conversation with UltraAgent
const response = await fetch("/api/chat", {
  method: "POST",
  body: JSON.stringify({
    messages: [
      { role: "user", content: "Hello!" }
    ],
    model: "ultra-agent",
  }),
});

const data = await response.json();
console.log(data.message); // "Hi! How can I help?"`}</code>
								</pre>
							</div>
						</motion.div>

						{/* Content */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<h2 className="text-3xl sm:text-4xl font-bold mb-5 text-zinc-900 dark:text-white">
								Get started in <span className="text-gradient">seconds</span>
							</h2>
							<p className="text-zinc-600 dark:text-gray-400 mb-6 leading-relaxed">
								Ultramaxo is designed for instant productivity. Sign up, start
								chatting, and let AI handle the rest. Access all tools — from
								code editing to document creation — in one interface.
							</p>
							<ul className="space-y-3 text-sm">
								{[
									"Integrated code editor — write and run code inline",
									"Artifacts for documents, spreadsheets & images",
									"File upload with automatic AI analysis",
									"Free forever — upgrade only when you need more",
								].map((item) => (
									<li key={item} className="flex items-start gap-2.5">
										<span className="mt-0.5 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
										<span className="text-zinc-900 dark:text-white">
											{item}
										</span>
									</li>
								))}
							</ul>
						</motion.div>
					</div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          AI MODELS
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-20 sm:py-28">
				<div className="max-w-5xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							AI Models
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Choose Your <span className="text-gradient">AI Assistant</span>
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-lg mx-auto">
							Two powerful models tailored for different needs — from quick
							conversations to deep reasoning.
						</p>
					</motion.div>

					<div className="grid grid-cols-1 md:grid-cols-2 gap-6">
						{/* UltraAgent */}
						<motion.div
							initial={{ opacity: 0, x: -20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
							className="relative p-8 rounded-2xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:border-primary/30 transition-all duration-300"
						>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center">
									<Zap className="w-6 h-6 text-emerald-500" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-zinc-900 dark:text-white">
										UltraAgent
									</h3>
									<span className="text-xs text-emerald-500 font-medium">
										Free
									</span>
								</div>
							</div>
							<p className="text-sm text-zinc-600 dark:text-gray-400 mb-6 leading-relaxed">
								Fast and capable AI assistant optimized for speed. Perfect for
								everyday conversations, quick answers, and general tasks.
							</p>
							<ul className="space-y-3">
								{[
									"⚡ Ultra-fast response time",
									"💬 General chat & Q&A",
									"📝 Basic document creation",
									"📎 File upload & analysis",
								].map((feat) => (
									<li
										key={feat}
										className="flex items-center gap-2 text-sm text-zinc-700 dark:text-gray-300"
									>
										<Check className="w-4 h-4 text-emerald-500 shrink-0" />
										{feat}
									</li>
								))}
							</ul>
						</motion.div>

						{/* UltraAgent Pro */}
						<motion.div
							initial={{ opacity: 0, x: 20 }}
							whileInView={{ opacity: 1, x: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.5 }}
							className="relative p-8 rounded-2xl border border-primary/40 bg-primary/5 shadow-sm shadow-primary/10 hover:shadow-lg hover:shadow-primary/15 transition-all duration-300"
						>
							<div className="absolute -top-3 right-6 px-3 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-[10px] font-medium text-white shadow-lg shadow-indigo-500/25">
								Pro
							</div>
							<div className="flex items-center gap-3 mb-6">
								<div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center">
									<Sparkles className="w-6 h-6 text-primary" />
								</div>
								<div>
									<h3 className="text-xl font-bold text-zinc-900 dark:text-white">
										UltraAgent Pro
									</h3>
									<span className="text-xs text-primary font-medium">
										Pro Plan
									</span>
								</div>
							</div>
							<p className="text-sm text-zinc-600 dark:text-gray-400 mb-6 leading-relaxed">
								Advanced AI with superior reasoning and deep thinking. Built for
								complex coding, detailed analysis, and expert-level tasks.
							</p>
							<ul className="space-y-3">
								{[
									"🧠 Deep reasoning & thinking",
									"💻 Expert-level coding",
									"📊 Complex analysis & research",
									"🔧 Full Artifacts system",
									"♾️ Unlimited conversations",
								].map((feat) => (
									<li
										key={feat}
										className="flex items-center gap-2 text-sm text-zinc-700 dark:text-gray-300"
									>
										<Check className="w-4 h-4 text-primary shrink-0" />
										{feat}
									</li>
								))}
							</ul>
						</motion.div>
					</div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          PRICING
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-28 lg:py-36" id="pricing">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

				<div className="max-w-5xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							Pricing
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Start Free, Upgrade When Ready
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-md mx-auto">
							No hidden fees. Use for free as long as you want, upgrade anytime
							for full features.
						</p>
					</motion.div>

					<motion.div
						className="grid md:grid-cols-3 gap-5"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true, margin: "-80px" }}
						whileInView="visible"
					>
						{pricingPlans.map((plan, i) => (
							<motion.div
								className={`relative rounded-2xl p-7 border transition-all duration-300 ${
									plan.popular
										? "border-primary/40 bg-primary/5 shadow-sm shadow-primary/10"
										: "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] hover:border-primary/30"
								}`}
								custom={i}
								key={plan.name}
								transition={{ duration: 0.25 }}
								variants={fadeUp}
								whileHover={{ y: -4 }}
							>
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-xs font-medium shadow-lg shadow-indigo-500/25 text-white">
										Most Popular
									</div>
								)}

								<div className="mb-7">
									<p className="font-semibold text-zinc-900 dark:text-white mb-1">
										{plan.name}
									</p>
									<div className="flex items-end gap-1.5 mb-2">
										<span className="text-3xl font-extrabold text-zinc-900 dark:text-white">
											{plan.price}
										</span>
										<span className="text-sm text-zinc-600 dark:text-gray-400 mb-1">
											/ {plan.period}
										</span>
									</div>
									<p className="text-sm text-zinc-600 dark:text-gray-400">
										{plan.desc}
									</p>
								</div>

								<ul className="space-y-3 mb-8">
									{plan.features.map((feat, j) => (
										<li
											className="flex items-start gap-3 text-sm text-zinc-700 dark:text-gray-300"
											key={j}
										>
											<Check className="w-4 h-4 text-primary mt-0.5 shrink-0" />
											{feat}
										</li>
									))}
								</ul>

								{plan.popular ? (
									<motion.button
										className="relative w-full inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold
											bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600
											shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
											transition-shadow duration-300 cursor-pointer"
										onClick={() => router.push("/register")}
										whileHover={{ scale: 1.04 }}
										whileTap={{ scale: 0.97 }}
									>
										Get Started
									</motion.button>
								) : (
									<motion.button
										className="w-full inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium
											border border-black/10 dark:border-white/10 bg-[#f8fafc] dark:bg-[#09090b] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] hover:text-zinc-900 dark:hover:text-white backdrop-blur-sm
											transition-colors duration-200 cursor-pointer"
										onClick={() => router.push("/register")}
										whileHover={{ scale: 1.04 }}
										whileTap={{ scale: 0.97 }}
									>
										Get Started
									</motion.button>
								)}
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          FAQ
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-28 lg:py-36" id="faq">
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-white/[0.06] to-transparent" />

				<div className="max-w-2xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							FAQ
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Frequently Asked Questions
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-md mx-auto">
							Quick answers to the most commonly asked questions.
						</p>
					</motion.div>

					<motion.div
						className="space-y-3"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true, margin: "-60px" }}
						whileInView="visible"
					>
						{faqData.map((faq, i) => (
							<FaqItem answer={faq.a} index={i} key={faq.q} question={faq.q} />
						))}
					</motion.div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          TECH STACK
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-20 sm:py-28 bg-black/[0.02] dark:bg-white/[0.02]">
				<div className="max-w-5xl mx-auto px-5">
					<motion.div
						initial={{ opacity: 0, y: 16 }}
						whileInView={{ opacity: 1, y: 0 }}
						viewport={{ once: true }}
						transition={{ duration: 0.5 }}
						className="text-center mb-14"
					>
						<span className="inline-block text-primary text-xs font-semibold tracking-widest uppercase mb-4">
							Technology
						</span>
						<h2 className="text-3xl sm:text-4xl font-bold mb-3 text-zinc-900 dark:text-white">
							Built With Modern Tech
						</h2>
						<p className="text-zinc-600 dark:text-gray-400 max-w-md mx-auto">
							Powered by the latest technologies for performance, security, and
							reliability.
						</p>
					</motion.div>

					<motion.div
						className="flex flex-wrap items-center justify-center gap-4"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true }}
						whileInView="visible"
					>
						{[
							{ name: "Next.js", desc: "React Framework" },
							{ name: "TypeScript", desc: "Type Safety" },
							{ name: "Tailwind CSS", desc: "Styling" },
							{ name: "PostgreSQL", desc: "Database" },
							{ name: "Drizzle ORM", desc: "Data Layer" },
							{ name: "NextAuth.js", desc: "Authentication" },
							{ name: "Vercel", desc: "Deployment" },
							{ name: "AI SDK", desc: "AI Integration" },
						].map((tech, i) => (
							<motion.div
								key={tech.name}
								custom={i}
								variants={fadeUp}
								className="flex flex-col items-center gap-2 px-6 py-5 rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-white/50 dark:bg-white/[0.02] hover:border-primary/30 hover:shadow-md hover:shadow-primary/5 transition-all duration-300 min-w-[120px]"
							>
								<span className="font-semibold text-sm text-zinc-900 dark:text-white">
									{tech.name}
								</span>
								<span className="text-[10px] text-zinc-500 dark:text-gray-500">
									{tech.desc}
								</span>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-20 sm:py-28 px-5">
				<motion.div
					className="max-w-2xl mx-auto text-center"
					initial={{ opacity: 0, y: 16 }}
					whileInView={{ opacity: 1, y: 0 }}
					viewport={{ once: true }}
					transition={{ duration: 0.5 }}
				>
					<h2 className="text-3xl sm:text-4xl font-bold mb-4 text-zinc-900 dark:text-white">
						Ready to Build with AI?
					</h2>
					<p className="text-zinc-600 dark:text-gray-400 mb-8">
						Sign up for free and start using Ultramaxo in under a minute. No
						credit card required.
					</p>
					<div className="flex flex-col sm:flex-row items-center justify-center gap-3">
						<motion.button
							className="relative inline-flex items-center justify-center gap-2 rounded-full px-8 py-4 text-base font-semibold
								bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600 text-white
								shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
								transition-shadow duration-300 cursor-pointer"
							onClick={() => router.push("/register")}
							whileHover={{ scale: 1.04 }}
							whileTap={{ scale: 0.97 }}
						>
							Get Started Free <ArrowRight size={16} />
						</motion.button>
						<motion.button
							className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium
								border border-black/10 dark:border-white/10 bg-[#f8fafc] dark:bg-[#09090b] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] hover:text-zinc-900 dark:hover:text-white backdrop-blur-sm
								transition-colors duration-200 cursor-pointer"
							onClick={() => scrollToSection("#features")}
							whileHover={{ scale: 1.04 }}
							whileTap={{ scale: 0.97 }}
						>
							Learn More
						</motion.button>
					</div>

					{/* Pricing hint */}
					<div className="mt-12 grid grid-cols-1 sm:grid-cols-3 gap-4">
						{[
							{
								title: "Free Tier",
								desc: "Unlimited basic usage",
								highlight: false,
							},
							{
								title: "Pro",
								desc: "Full access to all features",
								highlight: true,
							},
							{
								title: "1 Year",
								desc: "Best value — save 50%",
								highlight: false,
							},
						].map((plan) => (
							<div
								key={plan.title}
								className={`p-5 rounded-xl border transition-all ${
									plan.highlight
										? "border-primary/30 bg-primary/5 shadow-sm"
										: "border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02]"
								}`}
							>
								<div
									className={`font-semibold text-sm mb-1 ${plan.highlight ? "text-primary" : "text-zinc-900 dark:text-white"}`}
								>
									{plan.title}
								</div>
								<div className="text-xs text-zinc-600 dark:text-gray-400">
									{plan.desc}
								</div>
							</div>
						))}
					</div>
				</motion.div>
			</section>

			{/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
			<footer className="relative z-10 border-t border-black/[0.06] dark:border-white/[0.06] py-14">
				<div className="max-w-6xl mx-auto px-5">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
						{/* Brand */}
						<div>
							<div className="flex items-center gap-2.5 mb-4">
								<div className="rounded-lg overflow-hidden">
									<UltramaxoLogo size={32} />
								</div>
								<span className="font-bold text-base text-zinc-900 dark:text-white">
									Ultramaxo AI
								</span>
							</div>
							<p className="text-sm text-zinc-600 dark:text-gray-400 leading-relaxed">
								AI workspace for conversations, code development, and document
								creation.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-zinc-700 dark:text-gray-300">
								Product
							</h4>
							<ul className="space-y-2.5 text-sm text-zinc-600 dark:text-gray-400">
								<li>
									<button
										className="hover:text-zinc-900 dark:text-white transition-colors"
										onClick={() => scrollToSection("#home")}
										type="button"
									>
										Home
									</button>
								</li>
								<li>
									<button
										className="hover:text-zinc-900 dark:text-white transition-colors"
										onClick={() => scrollToSection("#features")}
										type="button"
									>
										Features
									</button>
								</li>
								<li>
									<button
										className="hover:text-zinc-900 dark:text-white transition-colors"
										onClick={() => scrollToSection("#pricing")}
										type="button"
									>
										Pricing
									</button>
								</li>
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-zinc-700 dark:text-gray-300">
								Legal
							</h4>
							<ul className="space-y-2.5 text-sm text-zinc-600 dark:text-gray-400">
								<li>
									<a
										className="hover:text-zinc-900 dark:text-white transition-colors"
										href="/privacy"
									>
										Privacy Policy
									</a>
								</li>
								<li>
									<a
										className="hover:text-zinc-900 dark:text-white transition-colors"
										href="/terms"
									>
										Terms of Service
									</a>
								</li>
								<li>
									<a
										className="hover:text-zinc-900 dark:text-white transition-colors"
										href="mailto:putraagifary12@gmail.com"
									>
										Contact Us
									</a>
								</li>
							</ul>
						</div>

						{/* Social */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-zinc-700 dark:text-gray-300">
								Connect
							</h4>
							<div className="flex gap-2.5">
								<a
									className="w-9 h-9 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] hover:bg-black/[0.07] dark:hover:bg-white/[0.07] border border-black/[0.06] dark:border-white/[0.06] flex items-center justify-center transition-colors"
									href="https://github.com/ultramaxoAI"
									target="_blank"
									rel="noopener noreferrer"
								>
									<Github className="w-4 h-4 text-zinc-600 dark:text-gray-400" />
								</a>
							</div>
						</div>
					</div>

					<div className="border-t border-black/[0.06] dark:border-white/[0.06] pt-7 flex flex-col md:flex-row items-center justify-between gap-4">
						<p className="text-xs text-zinc-600 dark:text-gray-400">
							© 2026 Ultramaxo AI. All rights reserved.
						</p>
						<div className="font-bold text-base tracking-tight">
							<span className="text-gradient">ultra</span>
							<span className="text-zinc-900 dark:text-white">maxo</span>
							<span className="text-zinc-600 dark:text-gray-400">.ai</span>
						</div>
					</div>
				</div>
			</footer>
		</div>
	);
}

/* ────────────────────────────────────────────
   FAQ accordion item
   ──────────────────────────────────────────── */
function FaqItem({
	index,
	question,
	answer,
}: {
	index: number;
	question: string;
	answer: string;
}) {
	const [open, setOpen] = useState(false);

	return (
		<motion.div
			className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] bg-black/[0.02] dark:bg-white/[0.02] overflow-hidden"
			custom={index}
			variants={fadeUp}
		>
			<button
				className="flex items-center justify-between w-full p-5 text-left cursor-pointer"
				onClick={() => setOpen(!open)}
				type="button"
			>
				<h4 className="font-medium text-sm text-zinc-900 dark:text-white pr-4">
					{question}
				</h4>
				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.25 }}
				>
					<ChevronDown className="w-4 h-4 text-zinc-600 dark:text-gray-400 shrink-0" />
				</motion.div>
			</button>
			<AnimatePresence initial={false}>
				{open && (
					<motion.div
						animate={{ height: "auto", opacity: 1 }}
						exit={{ height: 0, opacity: 0 }}
						initial={{ height: 0, opacity: 0 }}
						transition={{ duration: 0.25, ease }}
					>
						<p className="px-5 pb-5 text-sm text-zinc-600 dark:text-gray-400 leading-relaxed">
							{answer}
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
