"use client";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowRight,
  Bot,
  Brain,
  Check,
  ChevronDown,
  Code2,
  Github,
  Globe,
  Layers,
  Lock,
  Menu,
  MessageSquare,
  Play,
  Shield,
  Sparkles,
  Twitter,
  Unlock,
  Upload,
  Users,
  X,
  Zap,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

// Button Components
const PrimaryButton = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center justify-center gap-2 rounded-full px-6 py-3 text-sm font-medium bg-linear-to-br from-indigo-500 to-indigo-600 hover:opacity-90 active:scale-95 transition-all ${className}`}
    {...props}
  >
    {children}
  </button>
);

const GhostButton = ({ children, className = "", ...props }: any) => (
  <button
    className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-medium border border-white/10 bg-white/3 hover:bg-white/6 backdrop-blur-sm active:scale-95 transition ${className}`}
    {...props}
  >
    {children}
  </button>
);

// Title Component
const Title = ({ title, heading, description }: any) => (
  <motion.div
    className="text-center mb-16"
    initial={{ y: 60, opacity: 0 }}
    whileInView={{ y: 0, opacity: 1 }}
    viewport={{ once: true }}
    transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
  >
    <p className="text-indigo-400 text-sm font-semibold mb-3">{title}</p>
    <h2 className="text-3xl md:text-4xl font-bold mb-4">{heading}</h2>
    <p className="text-gray-300 max-w-2xl mx-auto">{description}</p>
  </motion.div>
);

export default function LandingPage() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const navLinks = [
    { name: "Home", href: "#home" },
    { name: "Features", href: "#features" },
    { name: "Pricing", href: "#pricing" },
    { name: "FAQ", href: "#faq" },
  ];

  const scrollToSection = (href: string) => {
    setMobileNavOpen(false);
    const el = document.querySelector(href);
    if (el) el.scrollIntoView({ behavior: "smooth" });
  };

  const trustedUserImages = [
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Felix",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Aneka",
    "https://api.dicebear.com/7.x/avataaars/svg?seed=Mia",
  ];

  const features = [
    {
      icon: <Zap className="w-6 h-6" />,
      title: "Ultra Fast AI",
      desc: "Powered by Groq Llama 3.3 70B dengan inference tercepat di dunia. Response dalam hitungan detik dengan streaming real-time.",
    },
    {
      icon: <Code2 className="w-6 h-6" />,
      title: "Code Workspace",
      desc: "Editor kode terintegrasi dengan syntax highlighting untuk berbagai bahasa pemrograman. Langsung coding dalam chat.",
    },
    {
      icon: <Layers className="w-6 h-6" />,
      title: "Artifacts System",
      desc: "Buat dan edit dokumen, spreadsheet, gambar, dan kode langsung dalam chat. Export hasil dengan mudah.",
    },
    {
      icon: <Upload className="w-6 h-6" />,
      title: "File Upload",
      desc: "Upload dan analisis file dengan AI. Mendukung berbagai format dokumen dan gambar.",
    },
    {
      icon: <MessageSquare className="w-6 h-6" />,
      title: "Advanced Chat",
      desc: "Chat history, edit message, regenerate response, dan export conversation. UI intuitif dengan dark mode.",
    },
    {
      icon: <Shield className="w-6 h-6" />,
      title: "Secure & Private",
      desc: "Authentication dengan NextAuth.js, data terenkripsi, dan tidak dibagikan ke pihak ketiga.",
    },
  ];

  const pricingPlans = [
    {
      name: "Free",
      price: "Rp 0",
      credits: "Selamanya",
      desc: "Cocok untuk mencoba dan eksplorasi",
      features: [
        "UltraAgent AI (Groq Llama 3.3 70B)",
        "Basic chat features",
        "Riwayat chat terbatas",
        "Syntax highlighting",
        "File upload standar",
      ],
      popular: false,
    },
    {
      name: "Pro",
      price: "Custom",
      credits: "Redeem Code",
      desc: "Untuk profesional dan power users",
      features: [
        "Semua fitur Free",
        "Unlimited chat",
        "Riwayat chat tanpa batas",
        "Code workspace lengkap",
        "Full artifacts system",
        "Priority support",
        "Advanced features",
      ],
      popular: true,
    },
    {
      name: "Enterprise",
      price: "Custom",
      credits: "Hubungi kami",
      desc: "Untuk organisasi & tim besar",
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
      question: "Apakah Ultramaxo AI benar-benar gratis?",
      answer:
        "Ya! Versi Free menggunakan UltraAgent AI (Groq Llama 3.3 70B) dengan fitur basic chat. Tidak perlu kartu kredit untuk memulai.",
    },
    {
      question: "Model AI apa yang digunakan?",
      answer:
        "Kami menggunakan Groq Llama 3.3 70B (UltraAgent) dengan inference tercepat di dunia. Groq menyediakan response ultra cepat dengan streaming real-time.",
    },
    {
      question: "Apa itu Artifacts System?",
      answer:
        "Artifacts memungkinkan Anda membuat dan edit dokumen, spreadsheet, gambar, dan kode langsung dalam chat. Hasil dapat di-export dan dibagikan.",
    },
    {
      question: "Bagaimana cara upgrade ke Pro?",
      answer:
        "Upgrade ke Pro menggunakan redeem code yang bisa didapatkan melalui admin. Masuk ke Settings > Redeem Code setelah login.",
    },
    {
      question: "Apakah data saya aman?",
      answer:
        "Ya! Kami menggunakan NextAuth.js untuk authentication, data terenkripsi, dan tidak membagikan data Anda ke pihak ketiga manapun.",
    },
  ];

  const trustedLogos = [
    "Startups",
    "Developers",
    "Designers",
    "Students",
    "Professionals",
  ];

  return (
    <div className="relative min-h-screen overflow-x-hidden bg-gray-950 text-white antialiased">
      {/* Navbar */}
      <motion.nav
        className="fixed top-5 left-0 right-0 z-50 px-4"
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
      >
        <div className="max-w-6xl mx-auto flex items-center justify-between bg-black/50 backdrop-blur-md border border-white/10 rounded-2xl p-3">
          <a href="#home" className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
              <Bot className="w-5 h-5 text-white" />
            </div>
            <span className="font-bold text-lg">Ultramaxo AI</span>
          </a>

          <div className="hidden md:flex items-center gap-8 text-sm font-medium text-gray-300">
            {navLinks.map((link) => (
              <button
                key={link.name}
                onClick={() => scrollToSection(link.href)}
                className="hover:text-white transition"
              >
                {link.name}
              </button>
            ))}
          </div>

          <div className="hidden md:flex items-center gap-3">
            <button
              onClick={() => router.push("/login")}
              className="text-sm font-medium text-gray-300 hover:text-white transition"
            >
              Masuk
            </button>
            <PrimaryButton onClick={() => router.push("/register")}>
              Daftar Gratis
            </PrimaryButton>
          </div>

          <button
            onClick={() => setMobileNavOpen(!mobileNavOpen)}
            className="md:hidden"
          >
            <Menu className="w-6 h-6" />
          </button>
        </div>

        {/* Mobile Menu */}
        <div
          className={`flex flex-col items-center justify-center gap-6 text-lg font-medium fixed inset-0 bg-black/40 backdrop-blur-md z-50 transition-all duration-300 ${
            mobileNavOpen ? "translate-x-0" : "translate-x-full"
          }`}
        >
          {navLinks.map((link) => (
            <button
              key={link.name}
              onClick={() => scrollToSection(link.href)}
            >
              {link.name}
            </button>
          ))}
          <button
            onClick={() => {
              setMobileNavOpen(false);
              router.push("/login");
            }}
            className="font-medium text-gray-300 hover:text-white transition"
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
            onClick={() => setMobileNavOpen(false)}
            className="rounded-md bg-white p-2 text-gray-800"
          >
            <X className="w-6 h-6" />
          </button>
        </div>
      </motion.nav>

      {/* Hero Section */}
      <section id="home" className="relative z-10">
        <div className="max-w-6xl mx-auto px-4 min-h-screen pt-32 md:pt-26 flex items-center justify-center">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
            <div className="text-left">
              <motion.a
                href="#!"
                className="inline-flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/10 mb-6"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                }}
              >
                <div className="flex -space-x-2">
                  {trustedUserImages.map((src, i) => (
                    <img
                      key={i}
                      src={src}
                      alt={`User ${i + 1}`}
                      className="w-6 h-6 rounded-full border border-black/50"
                    />
                  ))}
                </div>
                <span className="text-xs text-gray-200/90">
                  Powered by Groq AI
                </span>
              </motion.a>

              <motion.h1
                className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1,
                }}
              >
                AI Chatbot dengan{" "}
                <span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 to-indigo-400">
                  Code Workspace & Artifacts
                </span>
              </motion.h1>

              <motion.p
                className="text-gray-300 max-w-lg mb-8"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.2,
                }}
              >
                Platform AI chatbot dengan Groq Llama 3.3 70B, code editor terintegrasi,
                dan artifacts system untuk membuat dokumen, spreadsheet, dan gambar.
                Streaming real-time dengan response ultra cepat.
              </motion.p>

              <motion.div
                className="flex flex-col sm:flex-row items-center gap-4 mb-8"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.3,
                }}
              >
                <PrimaryButton
                  onClick={() => router.push("/register")}
                  className="w-full sm:w-auto py-3 px-7"
                >
                  Mulai Gratis Sekarang
                  <ArrowRight className="w-4 h-4" />
                </PrimaryButton>

                <GhostButton className="w-full sm:w-auto justify-center py-3 px-5">
                  <Play className="w-4 h-4" />
                  Lihat Demo
                </GhostButton>
              </motion.div>

              <motion.div
                className="flex overflow-hidden items-center text-sm text-gray-200 bg-white/10 rounded"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.4,
                }}
              >
                <div className="animate-marquee whitespace-nowrap py-2.5">
                  {[...trustedLogos, ...trustedLogos].map((text, i) => (
                    <span key={i} className="mx-8 inline-flex items-center">
                      <Sparkles className="w-4 h-4 mr-2 text-indigo-400" />
                      {text}
                    </span>
                  ))}
                </div>
              </motion.div>
            </div>

            <motion.div
              className="relative"
              initial={{ y: 60, opacity: 0 }}
              whileInView={{ y: 0, opacity: 1 }}
              viewport={{ once: true }}
              transition={{
                type: "spring",
                stiffness: 250,
                damping: 70,
                mass: 1,
                delay: 0.2,
              }}
            >
              <div className="rounded-2xl bg-white/5 border border-white/10 p-6 backdrop-blur-lg">
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center">
                      <Bot className="w-5 h-5 text-indigo-400" />
                    </div>
                    <span className="font-semibold">Ultramaxo AI</span>
                  </div>
                  <span className="px-3 py-1 rounded-full bg-green-500/20 text-green-400 text-xs">
                    Online
                  </span>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-end">
                    <div className="bg-indigo-600/20 border border-indigo-500/30 rounded-2xl rounded-tr-sm px-4 py-3 max-w-[80%]">
                      <p className="text-sm">
                        Buatkan ringkasan strategi pemasaran Gen Z
                      </p>
                    </div>
                  </div>

                  <div className="flex justify-start">
                    <div className="bg-white/10 border border-white/10 rounded-2xl rounded-tl-sm px-4 py-3 max-w-[80%]">
                      <p className="text-sm text-gray-300">
                        Berikut ringkasan strategi pemasaran untuk Gen Z: Fokus
                        pada konten visual pendek, authenticity, social
                        commerce, dan community-driven campaigns...
                      </p>
                    </div>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-3 gap-2">
                  {["Chat", "Code", "Artifacts"].map((item, i) => (
                    <div
                      key={i}
                      className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-center text-xs"
                    >
                      {item}
                    </div>
                  ))}
                </div>
              </div>

              <div className="absolute -top-4 -right-4 bg-indigo-600 rounded-full p-3 shadow-lg">
                <Zap className="w-6 h-6" />
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 2xl:py-32">
        <div className="max-w-6xl mx-auto px-4">
          <Title
            title="Fitur Unggulan"
            heading="Chat, Code, dan Create dalam satu platform"
            description="AI chatbot dengan Groq Llama 3.3 70B, code workspace, dan artifacts system untuk produktivitas maksimal."
          />

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {features.map((feature, i) => (
              <motion.div
                key={i}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1 + i * 0.1,
                }}
                className="rounded-2xl p-6 bg-white/3 border border-white/6 hover:border-white/15 hover:-translate-y-1 transition duration-300"
              >
                <div className="w-12 h-12 rounded-lg bg-violet-900/20 flex items-center justify-center mb-4">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                <p className="text-gray-300 text-sm leading-relaxed">
                  {feature.desc}
                </p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-white/3 border-t border-white/6">
        <div className="max-w-6xl mx-auto px-4">
          <Title
            title="Harga"
            heading="Paket yang sesuai dengan kebutuhan Anda"
            description="Mulai gratis, upgrade kapan saja untuk membuka seluruh fitur premium."
          />

          <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <motion.div
                key={i}
                initial={{ y: 150, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1 + i * 0.1,
                }}
                className={`relative p-6 rounded-xl border backdrop-blur transition duration-500 hover:scale-102 ${
                  plan.popular
                    ? "border-indigo-500/50 bg-indigo-900/30"
                    : "border-white/8 bg-indigo-950/30"
                }`}
              >
                {plan.popular && (
                  <p className="absolute -top-3 left-1/2 -translate-x-1/2 px-3 py-1 bg-indigo-600 rounded-md text-xs">
                    Paling Populer
                  </p>
                )}

                <div className="mb-6">
                  <p className="font-semibold">{plan.name}</p>
                  <div className="flex items-end gap-3 my-2">
                    <span className="text-3xl font-extrabold">
                      {plan.price}
                    </span>
                    <span className="text-sm text-gray-400">
                      / {plan.credits}
                    </span>
                  </div>
                  <p className="text-sm text-gray-300">{plan.desc}</p>
                </div>

                <ul className="space-y-3 mb-6">
                  {plan.features.map((feat, j) => (
                    <li
                      key={j}
                      className="flex items-center gap-3 text-sm text-gray-300"
                    >
                      <Check className="w-4 h-4 text-indigo-400" />
                      {feat}
                    </li>
                  ))}
                </ul>

                <div>
                  {plan.popular ? (
                    <PrimaryButton
                      onClick={() => router.push("/register")}
                      className="w-full justify-center"
                    >
                      Mulai Sekarang
                    </PrimaryButton>
                  ) : (
                    <GhostButton
                      onClick={() => router.push("/register")}
                      className="w-full justify-center"
                    >
                      Mulai Sekarang
                    </GhostButton>
                  )}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section id="faq" className="py-20 2xl:py-32">
        <div className="max-w-3xl mx-auto px-4">
          <Title
            title="FAQ"
            heading="Pertanyaan yang sering ditanyakan"
            description="Temukan jawaban atas pertanyaan umum tentang Ultramaxo AI. Ada pertanyaan lain? Hubungi kami."
          />

          <div className="space-y-3">
            {faqData.map((faq, i) => (
              <motion.details
                key={i}
                initial={{ y: 100, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.1 + i * 0.1,
                }}
                className="group bg-white/6 rounded-xl transition duration-300"
              >
                <summary className="flex items-center justify-between p-4 cursor-pointer">
                  <h4 className="font-medium">{faq.question}</h4>
                  <ChevronDown className="w-5 h-5 text-gray-300 group-open:rotate-180 transition-transform" />
                </summary>
                <p className="p-4 pt-0 text-sm text-gray-300 leading-relaxed">
                  {faq.answer}
                </p>
              </motion.details>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 2xl:pb-32 px-4">
        <div className="container mx-auto max-w-3xl">
          <div className="rounded-3xl bg-linear-to-b from-violet-900/20 to-violet-900/5 border border-violet-500/20 p-12 md:p-16 text-center relative overflow-hidden">
            <div className="relative z-10">
              <motion.h2
                className="text-2xl sm:text-4xl font-semibold mb-6"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                }}
              >
                Siap meningkatkan produktivitas?
              </motion.h2>
              <motion.p
                className="text-slate-400 mb-10 max-w-xl mx-auto"
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.2,
                }}
              >
                Bergabunglah dengan ribuan profesional yang sudah menggunakan
                Ultramaxo AI. Mulai gratis sekarang, tidak perlu kartu kredit.
              </motion.p>
              <motion.div
                initial={{ y: 60, opacity: 0 }}
                whileInView={{ y: 0, opacity: 1 }}
                viewport={{ once: true }}
                transition={{
                  type: "spring",
                  stiffness: 250,
                  damping: 70,
                  mass: 1,
                  delay: 0.3,
                }}
              >
                <PrimaryButton
                  onClick={() => router.push("/register")}
                  className="px-8 py-3"
                >
                  Daftar Gratis{" "}
                  <ArrowRight className="w-5 h-5" />
                </PrimaryButton>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-white/3 border-t border-white/6 py-12">
        <div className="max-w-6xl mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-8 h-8 rounded-lg bg-linear-to-br from-indigo-500 to-indigo-600 flex items-center justify-center">
                  <Bot className="w-5 h-5 text-white" />
                </div>
                <span className="font-bold text-lg">Ultramaxo AI</span>
              </div>
              <p className="text-sm text-gray-400">
                AI Chatbot dengan Code Workspace & Artifacts
              </p>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Produk</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <button onClick={() => scrollToSection("#home")}>Home</button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("#features")}>
                    Features
                  </button>
                </li>
                <li>
                  <button onClick={() => scrollToSection("#pricing")}>
                    Pricing
                  </button>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-gray-400">
                <li>
                  <a href="/privacy">Privacy Policy</a>
                </li>
                <li>
                  <a href="/terms">Terms of Service</a>
                </li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold mb-4">Connect</h4>
              <div className="flex gap-3">
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                >
                  <Twitter className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                >
                  <Github className="w-5 h-5" />
                </a>
                <a
                  href="#"
                  className="w-10 h-10 rounded-lg bg-white/5 hover:bg-white/10 flex items-center justify-center transition"
                >
                  <Globe className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>

          <div className="border-t border-white/6 pt-6 text-center text-sm text-gray-400">
            © 2026 Ultramaxo AI. All rights reserved.
          </div>
        </div>
      </footer>
    </div>
  );
}
