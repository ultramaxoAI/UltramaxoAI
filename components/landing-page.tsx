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
	Github,
	Globe,
	Layers,
	Menu,
	MessageSquare,
	Play,
	Shield,
	Twitter,
	Upload,
	X,
	Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useRef, useState } from "react";

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
		className="flex-shrink-0"
		fill="none"
		height={size}
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
   Button components
   ──────────────────────────────────────────── */
const PrimaryButton = ({ children, className = "", ...props }: any) => (
	<motion.button
		className={`relative inline-flex items-center justify-center gap-2 rounded-full px-7 py-3.5 text-sm font-semibold
      bg-gradient-to-r from-indigo-500 via-indigo-600 to-violet-600
      shadow-[0_0_24px_rgba(99,102,241,0.35)] hover:shadow-[0_0_36px_rgba(99,102,241,0.5)]
      transition-shadow duration-300 cursor-pointer ${className}`}
		whileHover={{ scale: 1.04 }}
		whileTap={{ scale: 0.97 }}
		{...props}
	>
		{children}
	</motion.button>
);

const GhostButton = ({ children, className = "", ...props }: any) => (
	<motion.button
		className={`inline-flex items-center gap-2 rounded-full px-6 py-3 text-sm font-medium
      border border-white/10 bg-white/[0.03] hover:bg-white/[0.07] backdrop-blur-sm
      transition-colors duration-200 cursor-pointer ${className}`}
		whileHover={{ scale: 1.04 }}
		whileTap={{ scale: 0.97 }}
		{...props}
	>
		{children}
	</motion.button>
);

/* ────────────────────────────────────────────
   Section title
   ──────────────────────────────────────────── */
const SectionTitle = ({
	tag,
	heading,
	description,
}: {
	tag: string;
	heading: string;
	description: string;
}) => (
	<motion.div
		className="text-center mb-20 max-w-2xl mx-auto"
		initial="hidden"
		variants={fadeUp}
		viewport={{ once: true, margin: "-60px" }}
		whileInView="visible"
	>
		<span className="inline-block text-indigo-400 text-xs font-semibold tracking-widest uppercase mb-4">
			{tag}
		</span>
		<h2 className="text-3xl md:text-4xl lg:text-[2.75rem] font-bold leading-tight mb-5 text-white">
			{heading}
		</h2>
		<p className="text-gray-400 leading-relaxed text-base md:text-lg">
			{description}
		</p>
	</motion.div>
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
		{ name: "Beranda", href: "#home" },
		{ name: "Fitur", href: "#features" },
		{ name: "Harga", href: "#pricing" },
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
			icon: <Zap className="w-5 h-5" />,
			title: "Respons Instan",
			desc: "Jawaban tersedia dalam hitungan detik — UltraAgent dioptimalkan untuk kecepatan inferensi tertinggi.",
		},
		{
			icon: <Code2 className="w-5 h-5" />,
			title: "Editor Kode Terintegrasi",
			desc: "Tulis, edit, dan jalankan kode secara langsung di dalam percakapan tanpa berpindah aplikasi.",
		},
		{
			icon: <Layers className="w-5 h-5" />,
			title: "Sistem Artifacts",
			desc: "Buat dokumen, spreadsheet, atau gambar langsung dari percakapan — ekspor kapan saja.",
		},
		{
			icon: <Upload className="w-5 h-5" />,
			title: "Unggah & Analisis Berkas",
			desc: "Unggah berkas dalam format apa pun dan biarkan AI menganalisis isinya secara otomatis.",
		},
		{
			icon: <MessageSquare className="w-5 h-5" />,
			title: "Percakapan yang Dapat Diedit",
			desc: "Edit pesan, buat ulang jawaban, dan simpan seluruh riwayat percakapan Anda.",
		},
		{
			icon: <Shield className="w-5 h-5" />,
			title: "Aman & Privat",
			desc: "Data terenkripsi, autentikasi aman, dan tidak pernah dibagikan kepada pihak ketiga.",
		},
	];

	const pricingPlans = [
		{
			name: "Gratis",
			price: "Rp 0",
			period: "selamanya",
			desc: "Coba seluruh fitur dasar tanpa biaya",
			features: [
				"AI Chat (UltraAgent)",
				"Editor kode dasar",
				"Riwayat percakapan terbatas",
				"Syntax highlighting",
				"Unggah berkas standar",
			],
			popular: false,
		},
		{
			name: "Pro",
			price: "Rp 20.000",
			period: "per bulan",
			desc: "Untuk kebutuhan lebih — tanpa batasan",
			features: [
				"AI Chat (UltraAgent Pro)",
				"Semua fitur paket Gratis",
				"Percakapan tanpa batas",
				"Riwayat percakapan permanen",
				"Ruang kerja kode lengkap",
				"Sistem Artifacts penuh",
				"Dukungan prioritas",
			],
			popular: true,
		},
		{
			name: "1 Tahun",
			price: "Rp 120.000",
			period: "per tahun",
			desc: "Hemat lebih besar dengan paket tahunan",
			features: [
				"Semua fitur Pro",
				"Dukungan khusus",
				"Penerapan kustom",
				"Jaminan SLA",
				"Analitik lanjutan",
			],
			popular: false,
		},
	];

	const faqData = [
		{
			q: "Apakah Ultramaxo benar-benar gratis?",
			a: "Ya. Paket Gratis dapat langsung digunakan tanpa kartu kredit dan tanpa batas waktu. Anda dapat melakukan upgrade kapan saja jika membutuhkan fitur tambahan.",
		},
		{
			q: "Model AI apa yang digunakan?",
			a: "Kami menggunakan UltraAgent — model AI yang dioptimalkan untuk kecepatan dan akurasi tinggi, sehingga menghasilkan respons hampir secara instan.",
		},
		{
			q: "Apa yang dimaksud dengan Artifacts?",
			a: "Artifacts memungkinkan Anda membuat dokumen, spreadsheet, dan gambar langsung dari percakapan AI. Hasilnya dapat diekspor dan dibagikan dengan mudah.",
		},
		{
			q: "Bagaimana cara melakukan upgrade ke Pro?",
			a: "Tukarkan kode Pro melalui menu Pengaturan > Tukar Kode setelah masuk. Kode dapat diperoleh dari administrator.",
		},
		{
			q: "Apakah data saya aman?",
			a: "Data Anda aman. Kami menggunakan NextAuth.js, basis data terenkripsi, dan tidak pernah membagikan data kepada pihak mana pun.",
		},
	];

	return (
		<div className="relative min-h-screen overflow-x-hidden bg-[#09090b] text-white antialiased">
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
				className="fixed top-0 left-0 right-0 z-50 px-4 pt-4"
				initial={{ y: -80, opacity: 0 }}
				transition={{ ...springLight, delay: 0.1 }}
			>
				<div className="max-w-5xl mx-auto flex items-center justify-between bg-white/[0.04] backdrop-blur-xl border border-white/[0.06] rounded-2xl px-5 py-3 shadow-lg shadow-black/20">
					<button
						className="flex items-center gap-2.5 group"
						onClick={() => scrollToSection("#home")}
					>
						<div className="rounded-lg overflow-hidden">
							<UltramaxoLogo size={32} />
						</div>
						<span className="font-bold text-base tracking-tight">
							Ultramaxo AI
						</span>
					</button>

					<div className="hidden md:flex items-center gap-7 text-sm text-gray-400">
						{navLinks.map((l) => (
							<button
								className="hover:text-white transition-colors duration-200"
								key={l.name}
								onClick={() => scrollToSection(l.href)}
							>
								{l.name}
							</button>
						))}
					</div>

					<div className="hidden md:flex items-center gap-3">
						<button
							className="text-sm text-gray-400 hover:text-white transition-colors cursor-pointer"
							onClick={() => router.push("/login")}
						>
							Masuk
						</button>
						<PrimaryButton
							className="text-xs px-5 py-2.5"
							onClick={() => router.push("/register")}
						>
							Daftar Gratis
						</PrimaryButton>
					</div>

					<button
						className="md:hidden text-gray-300"
						onClick={() => setMobileNavOpen(!mobileNavOpen)}
					>
						<Menu className="w-5 h-5" />
					</button>
				</div>

				{/* Mobile overlay */}
				<AnimatePresence>
					{mobileNavOpen && (
						<motion.div
							animate={{ opacity: 1 }}
							className="fixed inset-0 bg-black/80 backdrop-blur-xl z-50 flex flex-col items-center justify-center gap-7"
							exit={{ opacity: 0 }}
							initial={{ opacity: 0 }}
							transition={{ duration: 0.25 }}
						>
							{navLinks.map((l) => (
								<button
									className="text-xl font-medium text-gray-200 hover:text-white"
									key={l.name}
									onClick={() => scrollToSection(l.href)}
								>
									{l.name}
								</button>
							))}
							<button
								className="text-lg text-gray-400 hover:text-white"
								onClick={() => {
									setMobileNavOpen(false);
									router.push("/login");
								}}
							>
								Masuk
							</button>
							<PrimaryButton
								onClick={() => {
									setMobileNavOpen(false);
									router.push("/register");
								}}
							>
								Daftar Gratis
							</PrimaryButton>
							<button
								className="absolute top-6 right-6 p-2 rounded-full bg-white/10"
								onClick={() => setMobileNavOpen(false)}
							>
								<X className="w-5 h-5" />
							</button>
						</motion.div>
					)}
				</AnimatePresence>
			</motion.nav>

			{/* ═══════════════════════════════════════════
          HERO
          ═══════════════════════════════════════════ */}
			<section className="relative z-10" id="home" ref={heroRef}>
				<motion.div
					className="max-w-6xl mx-auto px-5 min-h-screen pt-36 md:pt-44 pb-20 flex items-center"
					style={{ opacity: heroOpacity, scale: heroScale }}
				>
					<div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center w-full">
						{/* Left — Copy */}
						<div>
							<motion.div
								animate="visible"
								className="inline-flex items-center gap-3 px-4 py-2 rounded-full bg-white/[0.06] border border-white/[0.08] mb-8"
								custom={0}
								initial="hidden"
								variants={fadeUp}
							>
								<div className="flex -space-x-2">
									{["Felix", "Aneka", "Mia"].map((seed, i) => (
										<img
											alt=""
											className="w-6 h-6 rounded-full border-2 border-[#09090b]"
											key={i}
											src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${seed}`}
										/>
									))}
								</div>
								<span className="text-xs text-gray-300">
									Dipercaya oleh pengembang di Indonesia
								</span>
							</motion.div>

							<motion.h1
								animate="visible"
								className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
								custom={1}
								initial="hidden"
								variants={fadeUp}
							>
								Asisten AI yang Membantu Anda{" "}
								<span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
									Bekerja Lebih Cepat
								</span>
							</motion.h1>

							<motion.p
								animate="visible"
								className="text-gray-400 text-lg leading-relaxed max-w-lg mb-10"
								custom={2}
								initial="hidden"
								variants={fadeUp}
							>
								Ultramaxo adalah ruang kerja AI untuk percakapan, pengembangan
								kode, dan pembuatan dokumen — semuanya dalam satu platform.
								Respons instan, gratis untuk memulai.
							</motion.p>

							<motion.div
								animate="visible"
								className="flex flex-col sm:flex-row items-start gap-4 mb-10"
								custom={3}
								initial="hidden"
								variants={fadeUp}
							>
								<PrimaryButton
									className="w-full sm:w-auto py-4 px-8 text-base"
									onClick={() => router.push("/register")}
								>
									Mulai Gratis <ArrowRight className="w-4 h-4" />
								</PrimaryButton>
								<GhostButton
									className="w-full sm:w-auto justify-center py-3.5"
									onClick={() => scrollToSection("#features")}
								>
									<Play className="w-4 h-4" /> Pelajari Fitur
								</GhostButton>
							</motion.div>

							{/* Trusted bar */}
							<motion.div
								animate="visible"
								className="flex items-center gap-6 text-xs text-gray-500"
								custom={4}
								initial="hidden"
								variants={fadeUp}
							>
								{[
									"UltraAgent Powered",
									"Open Source Stack",
									"End-to-End Encrypted",
								].map((t, i) => (
									<span className="flex items-center gap-1.5" key={i}>
										<Check className="w-3.5 h-3.5 text-indigo-500" />
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
							<div className="rounded-2xl bg-white/[0.03] border border-white/[0.08] p-7 backdrop-blur-lg shadow-2xl shadow-black/40">
								{/* Header */}
								<div className="flex items-center justify-between mb-7">
									<div className="flex items-center gap-2.5">
										<div className="rounded-xl overflow-hidden">
											<UltramaxoLogo size={36} />
										</div>
										<div>
											<span className="font-semibold text-sm">
												Ultramaxo AI
											</span>
											<p className="text-[10px] text-gray-500">UltraAgent</p>
										</div>
									</div>
									<span className="px-2.5 py-1 rounded-full bg-emerald-500/15 text-emerald-400 text-[10px] font-medium">
										Online
									</span>
								</div>

								{/* Messages */}
								<div className="space-y-4">
									<div className="flex justify-end">
										<div className="bg-indigo-600/20 border border-indigo-500/20 rounded-2xl rounded-tr-md px-4 py-3 max-w-[80%]">
											<p className="text-sm text-gray-200">
												Buatkan ringkasan strategi pemasaran Gen Z
											</p>
										</div>
									</div>
									<div className="flex justify-start">
										<div className="bg-white/[0.06] border border-white/[0.08] rounded-2xl rounded-tl-md px-4 py-3 max-w-[80%]">
											<p className="text-sm text-gray-300 leading-relaxed">
												Berikut ringkasan strategi untuk Gen Z: Fokus pada
												konten visual pendek, authenticity, social commerce, dan
												community-driven campaigns...
											</p>
										</div>
									</div>
								</div>

								{/* Bottom tabs */}
								<div className="mt-7 grid grid-cols-3 gap-2">
									{["Chat", "Code", "Artifacts"].map((item) => (
										<div
											className="bg-white/[0.04] border border-white/[0.06] rounded-lg px-3 py-2 text-center text-xs text-gray-400"
											key={item}
										>
											{item}
										</div>
									))}
								</div>
							</div>

							{/* Floating badge */}
							<div className="absolute -top-3 -right-3 bg-gradient-to-br from-indigo-500 to-violet-600 rounded-xl p-2.5 shadow-lg shadow-indigo-500/30">
								<Zap className="w-5 h-5" />
							</div>
						</motion.div>
					</div>
				</motion.div>
			</section>

			{/* ═══════════════════════════════════════════
          FEATURES
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-28 lg:py-36" id="features">
				<div className="max-w-6xl mx-auto px-5">
					<SectionTitle
						description="Percakapan, pengembangan kode, dan pembuatan konten — tanpa berpindah aplikasi. AI-nya cepat, editornya lengkap."
						heading="Semua yang Anda Butuhkan dalam Satu Platform"
						tag="Fitur Unggulan"
					/>

					<motion.div
						className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true, margin: "-80px" }}
						whileInView="visible"
					>
						{features.map((f, i) => (
							<motion.div
								className="group relative rounded-2xl p-6 bg-white/[0.02] border border-white/[0.06]
                  hover:border-indigo-500/30 hover:bg-white/[0.04]
                  transition-all duration-300"
								custom={i}
								key={i}
								variants={fadeUp}
							>
								{/* Hover glow */}
								<div className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 bg-[radial-gradient(300px_at_50%_0%,rgba(99,102,241,0.08),transparent)]" />

								<div className="relative z-10">
									<div className="w-11 h-11 rounded-xl bg-gradient-to-br from-indigo-500/15 to-violet-500/15 border border-indigo-500/10 flex items-center justify-center mb-5 text-indigo-400 group-hover:scale-110 transition-transform duration-300">
										{f.icon}
									</div>
									<h3 className="text-base font-semibold mb-2 text-white">
										{f.title}
									</h3>
									<p className="text-sm text-gray-400 leading-relaxed">
										{f.desc}
									</p>
								</div>
							</motion.div>
						))}
					</motion.div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          PRICING
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-28 lg:py-36" id="pricing">
				{/* Section divider glow */}
				<div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-indigo-500/20 to-transparent" />

				<div className="max-w-5xl mx-auto px-5">
					<SectionTitle
						description="Tanpa biaya tersembunyi. Gunakan secara gratis selama yang Anda inginkan, tingkatkan paket kapan saja untuk fitur penuh."
						heading="Mulai Gratis, Tingkatkan Sesuai Kebutuhan"
						tag="Harga"
					/>

					<motion.div
						className="grid md:grid-cols-3 gap-5"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true, margin: "-80px" }}
						whileInView="visible"
					>
						{pricingPlans.map((plan, i) => (
							<motion.div
								className={`relative rounded-2xl p-7 border backdrop-blur-sm transition-all duration-300 ${
									plan.popular
										? "border-indigo-500/40 bg-indigo-950/30 shadow-[0_0_40px_rgba(99,102,241,0.1)]"
										: "border-white/[0.06] bg-white/[0.02] hover:border-white/[0.12]"
								}`}
								custom={i}
								key={i}
								transition={{ duration: 0.25 }}
								variants={fadeUp}
								whileHover={{ y: -4 }}
							>
								{plan.popular && (
									<div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-gradient-to-r from-indigo-500 to-violet-600 rounded-full text-xs font-medium shadow-lg shadow-indigo-500/25">
										Paling Populer
									</div>
								)}

								<div className="mb-7">
									<p className="font-semibold text-white mb-1">{plan.name}</p>
									<div className="flex items-end gap-1.5 mb-2">
										<span className="text-3xl font-extrabold text-white">
											{plan.price}
										</span>
										<span className="text-sm text-gray-500 mb-1">
											/ {plan.period}
										</span>
									</div>
									<p className="text-sm text-gray-400">{plan.desc}</p>
								</div>

								<ul className="space-y-3 mb-8">
									{plan.features.map((feat, j) => (
										<li
											className="flex items-start gap-3 text-sm text-gray-300"
											key={j}
										>
											<Check className="w-4 h-4 text-indigo-400 mt-0.5 shrink-0" />
											{feat}
										</li>
									))}
								</ul>

								{plan.popular ? (
									<PrimaryButton
										className="w-full justify-center"
										onClick={() => router.push("/register")}
									>
										Mulai Sekarang
									</PrimaryButton>
								) : (
									<GhostButton
										className="w-full justify-center"
										onClick={() => router.push("/register")}
									>
										Mulai Sekarang
									</GhostButton>
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
					<SectionTitle
						description="Jawaban singkat untuk pertanyaan yang paling sering diajukan."
						heading="Pertanyaan yang Sering Diajukan"
						tag="FAQ"
					/>

					<motion.div
						className="space-y-3"
						initial="hidden"
						variants={staggerContainer}
						viewport={{ once: true, margin: "-60px" }}
						whileInView="visible"
					>
						{faqData.map((faq, i) => (
							<FaqItem answer={faq.a} index={i} key={i} question={faq.q} />
						))}
					</motion.div>
				</div>
			</section>

			{/* ═══════════════════════════════════════════
          CTA
          ═══════════════════════════════════════════ */}
			<section className="relative z-10 py-28 lg:py-36 px-5">
				<motion.div
					className="max-w-3xl mx-auto rounded-3xl bg-gradient-to-b from-indigo-950/40 to-violet-950/20 border border-indigo-500/15 p-14 md:p-20 text-center relative overflow-hidden"
					initial="hidden"
					variants={fadeUp}
					viewport={{ once: true, margin: "-60px" }}
					whileInView="visible"
				>
					{/* Background glow */}
					<div className="pointer-events-none absolute -top-20 left-1/2 -translate-x-1/2 w-[400px] h-[200px] rounded-full bg-indigo-500/10 blur-[80px]" />

					<div className="relative z-10">
						<h2 className="text-2xl sm:text-4xl font-bold mb-5 text-white">
							Siap Bekerja Lebih Cepat dengan AI?
						</h2>
						<p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
							Bergabung sekarang — gratis, tanpa kartu kredit, langsung dapat
							digunakan.
						</p>
						<PrimaryButton
							className="px-10 py-4 text-base"
							onClick={() => router.push("/register")}
						>
							Daftar Gratis <ArrowRight className="w-5 h-5" />
						</PrimaryButton>
					</div>
				</motion.div>
			</section>

			{/* ═══════════════════════════════════════════
          FOOTER
          ═══════════════════════════════════════════ */}
			<footer className="relative z-10 border-t border-white/[0.06] py-14">
				<div className="max-w-6xl mx-auto px-5">
					<div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-10">
						{/* Brand */}
						<div>
							<div className="flex items-center gap-2.5 mb-4">
								<div className="rounded-lg overflow-hidden">
									<UltramaxoLogo size={32} />
								</div>
								<span className="font-bold text-base">Ultramaxo AI</span>
							</div>
							<p className="text-sm text-gray-500 leading-relaxed">
								Ruang kerja AI untuk percakapan, pengembangan kode, dan
								pembuatan dokumen.
							</p>
						</div>

						{/* Product */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-gray-300">
								Produk
							</h4>
							<ul className="space-y-2.5 text-sm text-gray-500">
								<li>
									<button
										className="hover:text-gray-300 transition-colors"
										onClick={() => scrollToSection("#home")}
									>
										Beranda
									</button>
								</li>
								<li>
									<button
										className="hover:text-gray-300 transition-colors"
										onClick={() => scrollToSection("#features")}
									>
										Fitur
									</button>
								</li>
								<li>
									<button
										className="hover:text-gray-300 transition-colors"
										onClick={() => scrollToSection("#pricing")}
									>
										Harga
									</button>
								</li>
							</ul>
						</div>

						{/* Legal */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-gray-300">
								Legal
							</h4>
							<ul className="space-y-2.5 text-sm text-gray-500">
								<li>
									<a
										className="hover:text-gray-300 transition-colors"
										href="/privacy"
									>
										Privacy Policy
									</a>
								</li>
								<li>
									<a
										className="hover:text-gray-300 transition-colors"
										href="/terms"
									>
										Terms of Service
									</a>
								</li>
							</ul>
						</div>

						{/* Social */}
						<div>
							<h4 className="font-semibold text-sm mb-4 text-gray-300">
								Connect
							</h4>
							<div className="flex gap-2.5">
								{[Twitter, Github, Globe].map((Icon, i) => (
									<a
										className="w-9 h-9 rounded-lg bg-white/[0.04] hover:bg-white/[0.08] border border-white/[0.06] flex items-center justify-center transition-colors"
										href="#"
										key={i}
									>
										<Icon className="w-4 h-4 text-gray-400" />
									</a>
								))}
							</div>
						</div>
					</div>

					<div className="border-t border-white/[0.06] pt-7 text-center text-sm text-gray-600">
						© 2025 Ultramaxo AI. Hak cipta dilindungi undang-undang.
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
			className="rounded-xl bg-white/[0.03] border border-white/[0.06] overflow-hidden"
			custom={index}
			variants={fadeUp}
		>
			<button
				className="flex items-center justify-between w-full p-5 text-left cursor-pointer"
				onClick={() => setOpen(!open)}
			>
				<h4 className="font-medium text-sm text-gray-200 pr-4">{question}</h4>
				<motion.div
					animate={{ rotate: open ? 180 : 0 }}
					transition={{ duration: 0.25 }}
				>
					<ChevronDown className="w-4 h-4 text-gray-500 shrink-0" />
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
						<p className="px-5 pb-5 text-sm text-gray-400 leading-relaxed">
							{answer}
						</p>
					</motion.div>
				)}
			</AnimatePresence>
		</motion.div>
	);
}
