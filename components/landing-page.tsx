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
    { name: "Home", href: "#home" },
    { name: "Fitur", href: "#features" },
    { name: "Harga", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    setMobileNavOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  /* ───── data ───── */
  const features = [
    {
      icon: <Zap className="w-5 h-5" />,
      title: "Response Instan",
      desc: "Jawaban muncul dalam hitungan detik berkat Groq — inferensi AI tercepat saat ini.",
    },
    {
      icon: <Code2 className="w-5 h-5" />,
      title: "Code Editor Langsung",
      desc: "Tulis, edit, dan jalankan kode langsung di dalam chat tanpa pindah aplikasi.",
    },
    {
      icon: <Layers className="w-5 h-5" />,
      title: "Artifacts System",
      desc: "Buat dokumen, spreadsheet, atau gambar langsung dari percakapan — export kapan saja.",
    },
    {
      icon: <Upload className="w-5 h-5" />,
      title: "Upload & Analisis File",
      desc: "Upload file apapun dan biarkan AI membantu menganalisis isinya secara otomatis.",
    },
    {
      icon: <MessageSquare className="w-5 h-5" />,
      title: "Chat yang Bisa Diedit",
      desc: "Edit pesan, regenerate jawaban, dan simpan seluruh riwayat percakapanmu.",
    },
    {
      icon: <Shield className="w-5 h-5" />,
      title: "Aman & Privat",
      desc: "Data terenkripsi, autentikasi aman, dan tidak pernah dibagikan ke pihak ketiga.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Rp 0",
      period: "selamanya",
      desc: "Coba semua fitur dasar tanpa biaya",
      features: [
        "AI Chat (Groq Llama 3.3 70B)",
        "Basic code editor",
        "Riwayat chat terbatas",
        "Syntax highlighting",
        "Upload file standar",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "Custom",
      period: "per bulan",
      desc: "Untuk yang butuh lebih — tanpa batas",
      features: [
        "Semua fitur Free",
        "Chat tanpa limit",
        "Riwayat chat permanen",
        "Code workspace lengkap",
        "Full artifacts system",
        "Priority support",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      period: "hubungi kami",
      desc: "Solusi khusus untuk tim dan organisasi",
      features: [
        "Semua fitur Pro",
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
      q: "Apakah Ultramaxo benar-benar gratis?",
      a: "Ya. Paket Free bisa langsung dipakai tanpa kartu kredit, tanpa batas waktu. Upgrade kapan saja kalau butuh fitur lebih.",
    },
    {
      q: "Model AI apa yang dipakai?",
      a: "Kami menggunakan Llama 3.3 70B lewat Groq — salah satu provider inferensi tercepat di dunia. Hasilnya: response hampir instan.",
    },
    {
      q: "Apa itu Artifacts?",
      a: "Artifacts memungkinkan kamu membuat dokumen, spreadsheet, dan gambar langsung dari percakapan AI. Hasilnya bisa di-export dan dibagikan.",
    },
    {
      q: "Bagaimana cara upgrade ke Pro?",
      a: "Redeem kode Pro lewat menu Settings > Redeem Code setelah login. Kode bisa didapatkan dari admin.",
    },
    {
      q: "Apakah data saya aman?",
      a: "Aman. Kami menggunakan NextAuth.js, database terenkripsi, dan tidak pernah membagikan data ke pihak manapun.",
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
            className="flex items-center group"
            onClick={() => scrollToSection("#home")}
          >
            <img
              alt="Ultramaxo"
              className="h-8 w-auto rounded-md bg-white/90 px-1.5 py-0.5"
              src="/images/logo.jpg"
            />
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
                  Dipercaya developer Indonesia
                </span>
              </motion.div>

              <motion.h1
                animate="visible"
                className="text-4xl sm:text-5xl lg:text-6xl font-extrabold leading-[1.1] tracking-tight mb-6"
                custom={1}
                initial="hidden"
                variants={fadeUp}
              >
                AI yang Bantu Kamu{" "}
                <span className="bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 via-violet-400 to-indigo-300">
                  Kerja Lebih Cepat
                </span>
              </motion.h1>

              <motion.p
                animate="visible"
                className="text-gray-400 text-lg leading-relaxed max-w-lg mb-10"
                custom={2}
                initial="hidden"
                variants={fadeUp}
              >
                Ultramaxo adalah AI workspace untuk chat, coding, dan bikin
                dokumen — semua di satu tempat. Response instan, gratis untuk
                mulai.
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
                  <Play className="w-4 h-4" /> Lihat Fitur
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
                  "Groq Powered",
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
                    <div className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center p-1">
                      <img
                        alt="Ultramaxo"
                        className="w-full h-full object-contain"
                        src="/images/logo.jpg"
                      />
                    </div>
                    <div>
                      <span className="font-semibold text-sm">
                        Ultramaxo AI
                      </span>
                      <p className="text-[10px] text-gray-500">
                        Groq Llama 3.3 70B
                      </p>
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
            description="Chat, code, dan buat konten — tanpa pindah-pindah aplikasi. AI-nya cepat, editor-nya lengkap."
            heading="Semua yang kamu butuhkan, satu tempat"
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
            description="Tidak ada biaya tersembunyi. Pakai gratis selama yang kamu mau, upgrade kapan saja untuk fitur penuh."
            heading="Mulai gratis, upgrade kalau butuh"
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
            description="Jawaban singkat untuk hal-hal yang paling sering ditanyakan."
            heading="Pertanyaan yang sering muncul"
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
              Siap kerja lebih cepat dengan AI?
            </h2>
            <p className="text-gray-400 mb-10 max-w-md mx-auto leading-relaxed">
              Bergabung sekarang — gratis, tanpa kartu kredit, langsung bisa
              pakai.
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
              <div className="flex items-center mb-4">
                <img
                  alt="Ultramaxo"
                  className="h-8 w-auto rounded-md bg-white/90 px-1.5 py-0.5"
                  src="/images/logo.jpg"
                />
              </div>
              <p className="text-sm text-gray-500 leading-relaxed">
                AI workspace untuk chat, code, dan buat dokumen.
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
                    Home
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
            © 2025 Ultramaxo AI. All rights reserved.
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
