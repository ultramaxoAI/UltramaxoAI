"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Code2,
  Database,
  FileText,
  Github,
  Globe,
  HelpCircle,
  Image as ImageIcon,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  Monitor,
  Palette,
  Shield,
  Sparkles,
  Star,
  Table,
  Twitter,
  Unlock,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useMemo, useState } from "react";

export default function LandingPage() {
  const router = useRouter();

  const navItems = useMemo(
    () => [
      { id: "features", label: "Fitur" },
      { id: "models", label: "Model" },
      { id: "pricing", label: "Harga" },
      { id: "faq", label: "FAQ" },
    ],
    []
  );

  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);
  const [scrolled, setScrolled] = useState(false);

  const scrollToSection = (id: string) => {
    setMobileNavOpen(false);
    setTimeout(() => {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 60);
  };

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const viewportOnce = { once: true, amount: 0.2 } as const;

  const faqItems = [
    {
      q: "Apakah Ultramaxo AI benar-benar gratis?",
      a: "Ya! Kami menyediakan paket gratis yang mencakup 3 model AI populer dan 20 chat per hari. Tidak perlu kartu kredit untuk memulai. Anda bisa langsung mendaftar dan mulai menggunakan layanan kami.",
    },
    {
      q: "Apa perbedaan paket Gratis dan Pro?",
      a: "Paket Gratis memberikan akses ke 3 model AI (WormGPT, Gemini 2.0 Flash, Groq Llama 3.3 70B) dengan batas 20 chat/hari. Paket Pro membuka seluruh 26 model AI, unlimited chat, riwayat chat tanpa batas, upload file hingga 100MB, dan dukungan prioritas.",
    },
    {
      q: "Bagaimana cara upgrade ke paket Pro?",
      a: "Anda bisa upgrade ke Pro melalui halaman Pengaturan di dashboard setelah login. Kami menerima pembayaran melalui kode voucher yang bisa didapatkan melalui admin resmi kami.",
    },
    {
      q: "Apakah data percakapan saya aman?",
      a: "Keamanan data Anda adalah prioritas utama kami. Seluruh percakapan dienkripsi dan disimpan secara aman. Kami tidak membagikan data Anda kepada pihak ketiga. Baca selengkapnya di halaman Kebijakan Privasi kami.",
    },
    {
      q: "Model AI apa saja yang tersedia?",
      a: "Kami menyediakan 26 model AI dari berbagai penyedia, termasuk WormGPT, Gemini 2.0 Flash, Groq Llama 3.3 70B (gratis), serta model Pro seperti DeepSeek R1T Chimera, Mistral 24B, Gemma 3 27B, GPT-OSS 120B, Nemotron 30B, Qwen3 Coder, dan banyak lagi.",
    },
    {
      q: "Apakah saya bisa menggunakan Ultramaxo AI untuk coding?",
      a: "Tentu! Ultramaxo AI mendukung lebih dari 100 bahasa pemrograman dengan syntax highlighting. Model-model kami dioptimalkan untuk membantu debugging, penulisan kode, review kode, dan penjelasan konsep pemrograman.",
    },
    {
      q: "Berapa lama riwayat chat tersimpan?",
      a: "Untuk paket Gratis, riwayat chat tersimpan selama 7 hari. Untuk paket Pro, riwayat chat Anda tersimpan tanpa batas waktu selama akun Anda aktif.",
    },
  ];

  const features = [
    {
      icon: MessageSquare,
      title: "26 Model AI Premium",
      desc: "Akses ke berbagai model AI terbaik termasuk WormGPT, Gemini, Llama, dan banyak lagi dalam satu platform",
      gradient: "from-blue-500 to-cyan-500",
    },
    {
      icon: Code2,
      title: "Code Workspace",
      desc: "Editor kode terintegrasi dengan syntax highlighting untuk 100+ bahasa pemrograman",
      gradient: "from-purple-500 to-pink-500",
    },
    {
      icon: Layers,
      title: "Artifacts System",
      desc: "Buat dan edit dokumen, gambar, spreadsheet, dan kode langsung dalam chat",
      gradient: "from-orange-500 to-red-500",
    },
    {
      icon: Upload,
      title: "Upload Multimodal",
      desc: "Upload file, gambar, dan dokumen hingga 100MB untuk analisis komprehensif",
      gradient: "from-green-500 to-emerald-500",
    },
    {
      icon: Brain,
      title: "Context Memory",
      desc: "AI memahami konteks percakapan untuk memberikan jawaban yang lebih akurat dan relevan",
      gradient: "from-indigo-500 to-blue-500",
    },
    {
      icon: Shield,
      title: "Keamanan & Privasi",
      desc: "Enkripsi end-to-end dan data tidak dibagikan ke pihak ketiga manapun",
      gradient: "from-pink-500 to-rose-500",
    },
    {
      icon: Zap,
      title: "Ultra Cepat",
      desc: "Respons dalam hitungan detik dengan teknologi inference terbaru dari Groq",
      gradient: "from-yellow-500 to-orange-500",
    },
    {
      icon: BarChart3,
      title: "Analytics Dashboard",
      desc: "Tracking detail penggunaan, statistik model, dan insights tentang produktivitas Anda",
      gradient: "from-teal-500 to-cyan-500",
    },
  ];

  const techStack = [
    { name: "Next.js 16", icon: Monitor, color: "text-slate-900" },
    { name: "AI SDK", icon: Brain, color: "text-purple-600" },
    { name: "PostgreSQL", icon: Database, color: "text-blue-600" },
    { name: "TypeScript", icon: Code2, color: "text-blue-500" },
    { name: "Tailwind CSS", icon: Palette, color: "text-cyan-500" },
    { name: "Framer Motion", icon: Sparkles, color: "text-pink-500" },
  ];

  const pricingPlans = [
    {
      name: "Gratis",
      price: "Rp 0",
      period: "/bulan",
      description: "Cocok untuk mencoba dan eksplorasi",
      icon: Unlock,
      features: [
        "3 Model AI (WormGPT, Gemini, Llama)",
        "20 Chat per hari",
        "Riwayat chat 7 hari",
        "Upload file hingga 10MB",
        "Syntax highlighting",
        "Basic support",
      ],
      cta: "Mulai Gratis",
      popular: false,
    },
    {
      name: "Pro",
      price: "Rp 49.000",
      period: "/bulan",
      description: "Untuk profesional dan tim",
      icon: Lock,
      features: [
        "26 Model AI (termasuk semua model premium)",
        "Unlimited chat",
        "Riwayat chat tanpa batas",
        "Upload file hingga 100MB",
        "Code workspace lengkap",
        "Artifacts system",
        "Priority support",
        "Analytics dashboard",
      ],
      cta: "Upgrade ke Pro",
      popular: true,
    },
  ];

  const testimonials = [
    {
      name: "Andi Wijaya",
      role: "Full Stack Developer",
      company: "Tech Startup",
      avatar: "AW",
      content:
        "Ultramaxo AI mengubah cara saya coding. Dengan 26 model AI dan code workspace yang powerful, produktivitas saya meningkat 3x lipat!",
      rating: 5,
    },
    {
      name: "Sarah Chen",
      role: "Content Creator",
      company: "Digital Agency",
      avatar: "SC",
      content:
        "Artifacts system sangat membantu untuk membuat konten. Saya bisa brainstorm, draft, dan edit semuanya dalam satu tempat.",
      rating: 5,
    },
    {
      name: "Budi Santoso",
      role: "Data Analyst",
      company: "Finance Corp",
      avatar: "BS",
      content:
        "Analytics dashboard dan multiple AI models membantu saya menganalisis data lebih cepat dan mendapatkan insights yang lebih dalam.",
      rating: 5,
    },
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-white text-slate-900">
      {/* Animated Background */}
      <div aria-hidden className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.05),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(236,72,153,0.05),transparent_50%)]" />
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]" />
      </div>

      {/* ─── Navbar ─── */}
      <nav
        className={`sticky top-0 z-50 w-full transition-all duration-300 ${
          scrolled
            ? "border-b border-slate-200 bg-white/80 backdrop-blur-xl shadow-sm"
            : "bg-transparent"
        }`}
      >
        <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
              <Bot className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
              Ultramaxo AI
            </span>
          </div>

          <div className="hidden md:flex items-center gap-2">
            {navItems.map((item) => (
              <motion.button
                key={item.id}
                onClick={() => scrollToSection(item.id)}
                className="px-4 py-2 rounded-lg text-slate-600 hover:text-slate-900 hover:bg-slate-100 font-medium transition-all"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                {item.label}
              </motion.button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <motion.button
              onClick={() => router.push("/login")}
              className="px-4 py-2 text-slate-600 hover:text-slate-900 font-semibold transition-colors"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Masuk
            </motion.button>
            <motion.button
              onClick={() => router.push("/register")}
              className="px-6 py-2.5 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-lg font-semibold shadow-lg shadow-indigo-500/30 transition-all"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Daftar Gratis
            </motion.button>
          </div>

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden p-2 rounded-lg hover:bg-slate-100"
            aria-label="Toggle menu"
          >
            {mobileNavOpen ? (
              <X className="w-6 h-6" />
            ) : (
              <Menu className="w-6 h-6" />
            )}
          </button>
        </div>

        <AnimatePresence>
          {mobileNavOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="md:hidden border-t border-slate-200 bg-white"
            >
              <div className="max-w-7xl mx-auto px-6 py-4 space-y-2">
                {navItems.map((item) => (
                  <button
                    key={item.id}
                    onClick={() => scrollToSection(item.id)}
                    className="w-full text-left px-4 py-2 rounded-lg text-slate-600 hover:bg-slate-100 font-medium"
                  >
                    {item.label}
                  </button>
                ))}
                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => router.push("/login")}
                    className="w-full px-4 py-2 text-slate-600 border border-slate-200 rounded-lg font-semibold hover:bg-slate-50"
                  >
                    Masuk
                  </button>
                  <button
                    onClick={() => router.push("/register")}
                    className="w-full px-4 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-lg font-semibold"
                  >
                    Daftar Gratis
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>

      {/* ─── Hero Section ─── */}
      <section className="relative z-10 max-w-7xl mx-auto px-6 pt-20 pb-32">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.1 }}
            className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-50 border border-indigo-200 rounded-full mb-6"
          >
            <Sparkles className="w-4 h-4 text-indigo-600" />
            <span className="text-sm font-semibold text-indigo-600">
              26 Model AI dalam Satu Platform
            </span>
          </motion.div>

          <h1 className="text-5xl md:text-7xl font-bold mb-6 bg-gradient-to-r from-slate-900 via-indigo-900 to-purple-900 bg-clip-text text-transparent leading-tight">
            Platform AI Terlengkap
            <br />
            untuk Produktivitas Anda
          </h1>

          <p className="text-xl text-slate-600 mb-10 max-w-3xl mx-auto leading-relaxed">
            Akses 26 model AI terbaik, code workspace profesional, dan artifacts
            system dalam satu dashboard yang powerful. Tingkatkan produktivitas
            hingga 10x lipat.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
            <motion.button
              onClick={() => router.push("/register")}
              className="px-8 py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-lg font-semibold rounded-xl shadow-2xl shadow-indigo-500/40 flex items-center gap-2"
              whileHover={{ scale: 1.05, y: -2 }}
              whileTap={{ scale: 0.95 }}
            >
              Mulai Gratis Sekarang <ArrowRight className="w-5 h-5" />
            </motion.button>
            <motion.button
              onClick={() => scrollToSection("features")}
              className="px-8 py-4 bg-white border-2 border-slate-200 hover:border-slate-300 text-slate-700 text-lg font-semibold rounded-xl shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Lihat Fitur
            </motion.button>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            {[
              { label: "Pengguna Aktif", value: "100K+", icon: Users },
              { label: "Model AI", value: "26", icon: Brain },
              { label: "Uptime", value: "99.9%", icon: Zap },
              { label: "Rating", value: "4.9/5", icon: Star },
            ].map((stat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 + i * 0.1 }}
                className="bg-white border border-slate-200 rounded-2xl p-6 shadow-lg"
              >
                <stat.icon className="w-8 h-8 text-indigo-600 mx-auto mb-2" />
                <div className="text-3xl font-bold text-slate-900 mb-1">
                  {stat.value}
                </div>
                <div className="text-sm text-slate-600">{stat.label}</div>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </section>

      {/* ─── Features Section ─── */}
      <section id="features" className="relative z-10 py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Fitur-Fitur{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Unggulan
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Semua yang Anda butuhkan untuk meningkatkan produktivitas dalam
              satu platform
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8, scale: 1.02 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-slate-200 hover:shadow-2xl transition-all group"
              >
                <div
                  className={`w-14 h-14 rounded-xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center mb-4 group-hover:scale-110 transition-transform`}
                >
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-bold text-slate-900 mb-2">
                  {feature.title}
                </h3>
                <p className="text-slate-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Models Section ─── */}
      <section id="models" className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                26 Model AI
              </span>{" "}
              Siap Pakai
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Dari model gratis untuk eksplorasi hingga model premium untuk
              workload profesional
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200 rounded-3xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-green-500 to-emerald-500 flex items-center justify-center shadow-lg">
                  <Unlock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    3 Model Gratis
                  </h3>
                  <p className="text-slate-600">Langsung coba tanpa kartu</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {["WormGPT", "Gemini 2.0 Flash", "Groq Llama 3.3 70B"].map(
                  (model, i) => (
                    <motion.div
                      key={i}
                      initial={{ opacity: 0, x: -10 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={viewportOnce}
                      transition={{ delay: i * 0.1 }}
                      className="flex items-center gap-3 bg-white rounded-xl p-4 shadow"
                    >
                      <Check className="w-5 h-5 text-green-600" />
                      <span className="font-medium text-slate-900">{model}</span>
                    </motion.div>
                  )
                )}
              </div>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={viewportOnce}
              className="bg-gradient-to-br from-indigo-50 to-purple-50 border-2 border-indigo-200 rounded-3xl p-8"
            >
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center shadow-lg">
                  <Lock className="w-8 h-8 text-white" />
                </div>
                <div>
                  <h3 className="text-2xl font-bold text-slate-900">
                    23 Model Pro
                  </h3>
                  <p className="text-slate-600">Untuk kebutuhan profesional</p>
                </div>
              </div>
              <div className="space-y-3 mb-6">
                {[
                  "DeepSeek R1T Chimera",
                  "Mistral 24B",
                  "Gemma 3 27B",
                  "GPT-OSS 120B",
                  "Nemotron 30B",
                  "Dan 18 model premium lainnya...",
                ].map((model, i) => (
                  <motion.div
                    key={i}
                    initial={{ opacity: 0, x: 10 }}
                    whileInView={{ opacity: 1, x: 0 }}
                    viewport={viewportOnce}
                    transition={{ delay: i * 0.1 }}
                    className="flex items-center gap-3 bg-white rounded-xl p-4 shadow"
                  >
                    <Sparkles className="w-5 h-5 text-indigo-600" />
                    <span className="font-medium text-slate-900">{model}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ─── Pricing Section ─── */}
      <section id="pricing" className="relative z-10 py-24 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Harga yang{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Terjangkau
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Mulai gratis, upgrade kapan saja sesuai kebutuhan Anda
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className={`relative bg-white rounded-3xl p-8 shadow-xl ${
                  plan.popular
                    ? "border-2 border-indigo-600 ring-4 ring-indigo-100"
                    : "border border-slate-200"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-6 py-2 bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-sm font-bold rounded-full shadow-lg">
                    Most Popular
                  </div>
                )}

                <div className="flex items-center gap-4 mb-6">
                  <div
                    className={`w-14 h-14 rounded-2xl flex items-center justify-center ${
                      plan.popular
                        ? "bg-gradient-to-br from-indigo-600 to-purple-600"
                        : "bg-slate-100"
                    }`}
                  >
                    <plan.icon
                      className={`w-7 h-7 ${
                        plan.popular ? "text-white" : "text-slate-600"
                      }`}
                    />
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-slate-900">
                      {plan.name}
                    </h3>
                    <p className="text-slate-600">{plan.description}</p>
                  </div>
                </div>

                <div className="mb-6">
                  <div className="flex items-baseline gap-2">
                    <span className="text-5xl font-bold text-slate-900">
                      {plan.price}
                    </span>
                    <span className="text-xl text-slate-600">{plan.period}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-8">
                  {plan.features.map((feature, j) => (
                    <li key={j} className="flex items-start gap-3">
                      <Check
                        className={`w-5 h-5 mt-0.5 ${
                          plan.popular ? "text-indigo-600" : "text-slate-600"
                        }`}
                      />
                      <span className="text-slate-700">{feature}</span>
                    </li>
                  ))}
                </ul>

                <motion.button
                  onClick={() => router.push("/register")}
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className={`w-full py-4 rounded-xl font-semibold text-lg transition-all ${
                    plan.popular
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/30"
                      : "bg-slate-100 hover:bg-slate-200 text-slate-900"
                  }`}
                >
                  {plan.cta}
                </motion.button>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Testimonials Section ─── */}
      <section className="relative z-10 py-24">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Dipercaya oleh{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Ribuan Profesional
              </span>
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Lihat apa yang pengguna kami katakan tentang Ultramaxo AI
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: i * 0.1 }}
                whileHover={{ y: -8 }}
                className="bg-white rounded-2xl p-8 shadow-lg border border-slate-200"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(testimonial.rating)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-5 h-5 fill-yellow-400 text-yellow-400"
                    />
                  ))}
                </div>
                <p className="text-slate-700 mb-6 leading-relaxed">
                  "{testimonial.content}"
                </p>
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white font-bold">
                    {testimonial.avatar}
                  </div>
                  <div>
                    <div className="font-semibold text-slate-900">
                      {testimonial.name}
                    </div>
                    <div className="text-sm text-slate-600">
                      {testimonial.role} • {testimonial.company}
                    </div>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Tech Stack Section ─── */}
      <section className="relative z-10 py-16 bg-slate-50">
        <div className="max-w-7xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center"
          >
            <h3 className="text-2xl font-bold text-slate-900 mb-8">
              Dibangun dengan Teknologi Modern
            </h3>
            <div className="flex flex-wrap items-center justify-center gap-8">
              {techStack.map((tech, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, scale: 0.8 }}
                  whileInView={{ opacity: 1, scale: 1 }}
                  viewport={viewportOnce}
                  transition={{ delay: i * 0.1 }}
                  whileHover={{ scale: 1.1, y: -4 }}
                  className="flex flex-col items-center gap-2"
                >
                  <div className="w-16 h-16 rounded-xl bg-white border border-slate-200 flex items-center justify-center shadow">
                    <tech.icon className={`w-8 h-8 ${tech.color}`} />
                  </div>
                  <span className="text-sm font-medium text-slate-700">
                    {tech.name}
                  </span>
                </motion.div>
              ))}
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── FAQ Section ─── */}
      <section id="faq" className="relative z-10 py-24">
        <div className="max-w-4xl mx-auto px-6">
          <motion.div
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={viewportOnce}
            className="text-center mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-4">
              Pertanyaan yang{" "}
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                Sering Ditanyakan
              </span>
            </h2>
            <p className="text-xl text-slate-600">
              Temukan jawaban atas pertanyaan umum tentang Ultramaxo AI
            </p>
          </motion.div>

          <div className="space-y-4">
            {faqItems.map((faq, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={viewportOnce}
                transition={{ delay: i * 0.05 }}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full px-6 py-5 flex items-center justify-between text-left hover:bg-slate-50 transition-colors"
                >
                  <span className="font-semibold text-slate-900 pr-4">
                    {faq.q}
                  </span>
                  <ChevronDown
                    className={`w-5 h-5 text-slate-600 flex-shrink-0 transition-transform ${
                      openFaq === i ? "rotate-180" : ""
                    }`}
                  />
                </button>
                <AnimatePresence>
                  {openFaq === i && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="px-6 pb-5 text-slate-600 leading-relaxed">
                        {faq.a}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── CTA Section ─── */}
      <section className="relative z-10 py-24 bg-gradient-to-br from-indigo-600 to-purple-600">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={viewportOnce}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
              Siap Meningkatkan Produktivitas?
            </h2>
            <p className="text-xl text-indigo-100 mb-10 max-w-2xl mx-auto">
              Bergabunglah dengan ribuan profesional yang sudah menggunakan
              Ultramaxo AI. Mulai gratis sekarang, tidak perlu kartu kredit.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <motion.button
                onClick={() => router.push("/register")}
                whileHover={{ scale: 1.05, y: -2 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-white hover:bg-slate-50 text-indigo-600 text-lg font-semibold rounded-xl shadow-2xl flex items-center gap-2"
              >
                Daftar Gratis <ArrowRight className="w-5 h-5" />
              </motion.button>
              <motion.button
                onClick={() => router.push("/login")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="px-8 py-4 bg-transparent border-2 border-white hover:bg-white/10 text-white text-lg font-semibold rounded-xl"
              >
                Sudah Punya Akun? Masuk
              </motion.button>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ─── Footer ─── */}
      <footer className="relative z-10 bg-slate-900 text-slate-300 py-16">
        <div className="max-w-7xl mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-12 mb-12">
            <div className="md:col-span-1">
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center">
                  <Bot className="w-6 h-6 text-white" />
                </div>
                <span className="text-xl font-bold text-white">
                  Ultramaxo AI
                </span>
              </div>
              <p className="text-slate-400 leading-relaxed">
                Platform AI terlengkap untuk meningkatkan produktivitas Anda
                dengan 26 model AI dan fitur-fitur canggih.
              </p>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Produk</h4>
              <ul className="space-y-2">
                <li>
                  <a href="#features" className="hover:text-white transition">
                    Fitur
                  </a>
                </li>
                <li>
                  <a href="#models" className="hover:text-white transition">
                    Model AI
                  </a>
                </li>
                <li>
                  <a href="#pricing" className="hover:text-white transition">
                    Harga
                  </a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Perusahaan</h4>
              <ul className="space-y-2">
                <li>
                  <Link href="/about" className="hover:text-white transition">
                    Tentang Kami
                  </Link>
                </li>
                <li>
                  <Link href="/privacy" className="hover:text-white transition">
                    Kebijakan Privasi
                  </Link>
                </li>
                <li>
                  <Link href="/terms" className="hover:text-white transition">
                    Syarat & Ketentuan
                  </Link>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="text-white font-semibold mb-4">Sosial Media</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-slate-800 hover:bg-slate-700 flex items-center justify-center transition"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-slate-800 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-slate-400 text-sm">
              © 2026 Ultramaxo AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-sm">
              <Link href="/privacy" className="hover:text-white transition">
                Privacy
              </Link>
              <Link href="/terms" className="hover:text-white transition">
                Terms
              </Link>
              <a href="#faq" className="hover:text-white transition">
                FAQ
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
