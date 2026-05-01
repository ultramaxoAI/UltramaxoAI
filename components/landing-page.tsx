"use client";

import { useGSAP } from "@gsap/react";
import gsap from "gsap";
import { ScrollTrigger } from "gsap/ScrollTrigger";
import {
	Activity,
	ArrowRight,
	Braces,
	CheckCircle2,
	ChevronRight,
	Code2,
	FileStack,
	Menu,
	MessageSquareMore,
	Shield,
	Workflow,
	X,
} from "lucide-react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { HlsVideo } from "./hls-video";

gsap.registerPlugin(ScrollTrigger);

/* ─── Data ─── */

const navigationItems = [
	{ label: "Overview", href: "#overview" },
	{ label: "Workspace", href: "#product" },
	{ label: "API", href: "#api" },
	{ label: "Pricing", href: "#pricing" },
	{ label: "FAQ", href: "#faq" },
];

const capabilityChips = [
	"AI chat",
	"Code workspace",
	"Document flows",
	"API access",
	"Native mobile",
	"History & export",
];

const heroFeatureCards = [
	{
		title: "AI Chat",
		description:
			"Contextual conversations that stay useful after the first reply.",
		icon: MessageSquareMore,
	},
	{
		title: "Code",
		description:
			"Write, debug, iterate, and keep artifacts inside one focused shell.",
		icon: Code2,
	},
	{
		title: "Documents",
		description:
			"Organize, summarize, and continue work without losing structure.",
		icon: FileStack,
	},
	{
		title: "API Access",
		description: "One clean platform for models, keys, billing, and delivery.",
		icon: Braces,
	},
];

const overviewMetrics = [
	{ value: "99.99%", label: "Uptime SLA" },
	{ value: "256-bit", label: "Encrypted flow" },
	{ value: "50+", label: "Supported models" },
];

const infraBars = [
	{ id: "infra-1", value: 38 },
	{ id: "infra-2", value: 52 },
	{ id: "infra-3", value: 48 },
	{ id: "infra-4", value: 74 },
	{ id: "infra-5", value: 64 },
	{ id: "infra-6", value: 83 },
	{ id: "infra-7", value: 58 },
];

const activityBars = [
	{ id: "activity-1", value: 24 },
	{ id: "activity-2", value: 42 },
	{ id: "activity-3", value: 38 },
	{ id: "activity-4", value: 58 },
	{ id: "activity-5", value: 47 },
	{ id: "activity-6", value: 79 },
	{ id: "activity-7", value: 65 },
	{ id: "activity-8", value: 72 },
	{ id: "activity-9", value: 55 },
];

const overviewPanels = [
	{
		eyebrow: "System overview",
		title: "A product surface that feels ready for real work.",
		description:
			"Every important layer stays legible: current activity, model availability, API usage, and recent work all live inside one composed view.",
		icon: Activity,
	},
	{
		eyebrow: "Workspace intelligence",
		title: "Chat, artifacts, and execution stay connected.",
		description:
			"Ultramaxo keeps prompts, outputs, files, and follow-up actions inside one premium workspace instead of scattering them across disposable screens.",
		icon: Workflow,
	},
	{
		eyebrow: "Developer infrastructure",
		title: "Premium models with a cleaner API story.",
		description:
			"API keys, model access, usage visibility, and billing feel like one product instead of a stitched-on console.",
		icon: Shield,
	},
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

type ApiModelPayload = {
	modelId?: string;
	name?: string;
	provider?: string;
	context?: string;
	priceIn?: string;
	priceOut?: string;
	isFree?: boolean;
	capabilities?: string[];
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
			"Unlimited conversations",
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
		<span className="liquid-glass rounded-full px-3.5 py-1 text-xs font-medium text-white font-body inline-block mb-4 tracking-wider uppercase">
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
			className={`text-4xl md:text-5xl lg:text-6xl font-heading italic text-white tracking-tight leading-[0.9] ${className}`}
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
	const wordCounts = new Map<string, number>();
	const keyedWords = words.map((word) => {
		const count = (wordCounts.get(word) ?? 0) + 1;
		wordCounts.set(word, count);
		return { key: `${word}-${count}`, word };
	});

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
			{keyedWords.map((entry, index) => (
				<span
					key={entry.key}
					className="split-word inline-block will-change-transform"
				>
					{entry.word}
					{index < keyedWords.length - 1 ? "\u00A0" : ""}
				</span>
			))}
		</Tag>
	);
}

export default function LandingPage() {
	const router = useRouter();
	const [mobileNavOpen, setMobileNavOpen] = useState(false);
	const [openFaq, setOpenFaq] = useState<string | null>(
		faqItems[0]?.question ?? null,
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
	const mobileOverlayRef = useRef<HTMLButtonElement>(null);

	useEffect(() => {
		const loadModels = async () => {
			try {
				const res = await fetch("/api/v1/models?limit=5");
				if (!res.ok) return;
				const payload = await res.json();
				const items = Array.isArray(payload?.data) ? payload.data : [];
				if (!items.length) return;
				setApiModels(
					items.map((model: ApiModelPayload) => ({
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

	/* ─── GSAP - Simple Reveal + Product PIN ─── */
	useGSAP(
		() => {
			const prefersReduced = window.matchMedia(
				"(prefers-reduced-motion: reduce)",
			).matches;
			if (prefersReduced || window.innerWidth < 768) return;

			const ctx = gsap.context(() => {
				/* 1. Hero entrance */
				gsap
					.timeline({ defaults: { ease: "power3.out" } })
					.fromTo(
						navRef.current,
						{ y: -40, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.8 },
					)
					.fromTo(
						".hero-badge",
						{ y: 20, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.6 },
						"-=0.4",
					)
					.fromTo(
						".hero-headline .split-word",
						{ y: 60, opacity: 0, filter: "blur(16px)" },
						{
							y: 0,
							opacity: 1,
							filter: "blur(0px)",
							duration: 0.9,
							stagger: 0.05,
						},
						"-=0.3",
					)
					.fromTo(
						".hero-subtitle",
						{ y: 30, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.7 },
						"-=0.6",
					)
					.fromTo(
						".hero-buttons",
						{ y: 30, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.6 },
						"-=0.4",
					)
					.fromTo(
						".hero-chips",
						{ y: 20, opacity: 0 },
						{ y: 0, opacity: 1, duration: 0.5 },
						"-=0.3",
					)
					.fromTo(
						heroMockupRef.current,
						{ scale: 0.88, opacity: 0 },
						{ scale: 1, opacity: 1, duration: 1.2 },
						"-=0.8",
					);

				/* Navbar blur on scroll */
				ScrollTrigger.create({
					trigger: heroRef.current,
					start: "top top",
					end: "bottom top",
					onUpdate: (self) => {
						if (navRef.current) {
							const progress = self.progress;
							gsap.set(navRef.current?.querySelector("nav"), {
								backgroundColor: `rgba(10,10,10,${0.4 + progress * 0.4})`,
								backdropFilter: `blur(${12 + progress * 8}px)`,
							});
						}
					},
				});

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
				gsap.fromTo(
					".video-headline",
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

				gsap.fromTo(
					".showcase-left, .showcase-right",
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

				gsap.fromTo(
					".showcase-bubble",
					{ y: 15, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						duration: 0.3,
						stagger: 0.06,
						ease: "power2.out",
						scrollTrigger: {
							trigger: ".showcase-bubble-wrapper",
							start: "top 85%",
							toggleActions: "play none none reverse",
						},
					},
				);

				gsap.fromTo(
					".usecase-card",
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

				gsap.fromTo(
					".api-element",
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

				gsap.fromTo(
					".pricing-card",
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

				gsap.fromTo(
					".faq-item",
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

				gsap.fromTo(
					".cta-headline",
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
				gsap.fromTo(
					".cta-buttons",
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

				gsap.fromTo(
					".footer-content",
					{ y: 15, opacity: 0 },
					{
						y: 0,
						opacity: 1,
						duration: 0.3,
						ease: "power2.out",
						scrollTrigger: {
							trigger: ".footer-content",
							start: "top 95%",
							toggleActions: "play none none reverse",
						},
					},
				);
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
			className="bg-black overflow-hidden text-white selection:bg-white/20"
			style={{ backgroundColor: "#000", color: "#fff", minHeight: "100vh" }}
		>
			{/* ══════ 1. NAVBAR ══════ */}
			<header
				ref={navRef}
				className="fixed top-3 right-0 left-0 z-50 flex justify-center px-3 opacity-100 sm:top-4 sm:px-4 md:opacity-0"
			>
				<nav className="liquid-glass-strong flex w-full max-w-4xl items-center justify-between gap-2 rounded-full px-3 py-2 sm:gap-6 sm:px-4 sm:py-2.5">
					<button
						className="flex items-center gap-3 mix-blend-screen"
						onClick={() => scrollToSection("#home")}
						type="button"
					>
						<UltramaxoLogo size={32} />
						<div className="text-left hidden sm:block">
							<div className="text-sm font-semibold tracking-tight font-body text-white">
								Ultramaxo
							</div>
							<div className="text-[10px] text-white/50 font-body uppercase tracking-wider">
								AI workspace
							</div>
						</div>
					</button>

					<div className="hidden md:flex items-center gap-6">
						{navigationItems.map((item) => (
							<button
								key={item.label}
								onClick={() => scrollToSection(item.href)}
								className="text-sm font-medium text-white/70 hover:text-white transition-colors font-body"
								type="button"
							>
								{item.label}
							</button>
						))}
					</div>

					<div className="flex items-center gap-3">
						<button
							className="hidden md:inline-flex rounded-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors font-body"
							onClick={() => window.open("/app-release.apk", "_blank")}
							type="button"
						>
							Download App
						</button>
						<button
							className="hidden md:inline-flex rounded-full px-4 py-2 text-sm font-medium text-white/70 hover:text-white transition-colors font-body"
							onClick={() => router.push("/login")}
							type="button"
						>
							Sign in
						</button>
						<button
							onClick={() => router.push("/register")}
							className="inline-flex shrink-0 items-center gap-1.5 rounded-full bg-white px-4 py-2.5 font-body font-medium text-black text-sm transition-transform hover:scale-[1.02] sm:px-5"
							type="button"
						>
							<span className="sm:hidden">Start</span>
							<span className="hidden sm:inline">Start free</span>
							<ArrowRight className="h-4 w-4" />
						</button>
						<button
							className="md:hidden liquid-glass rounded-full p-2.5"
							onClick={() => setMobileNavOpen(true)}
							type="button"
						>
							<Menu className="w-5 h-5 text-white" />
						</button>
					</div>
				</nav>
			</header>

			{/* Mobile Sidebar */}
			{mobileNavOpen && (
				<>
					<button
						ref={mobileOverlayRef}
						onClick={closeMobileNav}
						className="fixed inset-0 z-[60] bg-black/60 opacity-0 backdrop-blur-sm"
						type="button"
						aria-label="Close navigation menu"
					/>
					<div
						ref={mobileSidebarRef}
						className="fixed top-0 right-0 bottom-0 z-[70] flex w-[min(300px,calc(100vw-2.5rem))] translate-x-full flex-col border-white/10 border-l bg-[#0a0a0a] p-5 sm:p-6"
					>
						<div className="flex justify-between items-center mb-8">
							<UltramaxoLogo size={32} />
							<button
								onClick={closeMobileNav}
								className="p-2 rounded-full hover:bg-white/10 transition-colors"
								type="button"
							>
								<X className="w-5 h-5 text-white" />
							</button>
						</div>
						<div className="flex flex-col gap-4 font-body">
							{navigationItems.map((item) => (
								<button
									key={item.label}
									onClick={() => scrollToSection(item.href)}
									className="text-left text-lg font-medium text-white/80 hover:text-white py-2 border-b border-white/5"
									type="button"
								>
									{item.label}
								</button>
							))}
						</div>
						<div className="mt-auto flex flex-col gap-3">
							<button
								className="w-full rounded-full border border-white/20 py-3 text-sm font-medium text-white font-body"
								onClick={() => window.open("/app-release.apk", "_blank")}
								type="button"
							>
								Download App
							</button>
							<button
								className="w-full rounded-full border border-white/20 py-3 text-sm font-medium text-white font-body"
								onClick={() => router.push("/login")}
								type="button"
							>
								Sign in
							</button>
							<button
								className="w-full rounded-full bg-white text-black py-3 text-sm font-semibold font-body"
								onClick={() => router.push("/register")}
								type="button"
							>
								Start free
							</button>
						</div>
					</div>
				</>
			)}

			{/* ══════ 2. HERO ══════ */}
			<section
				id="home"
				ref={heroRef}
				className="relative flex min-h-[100svh] items-start justify-start px-4 pt-28 pb-14 sm:items-center sm:justify-center sm:px-6 sm:pt-32 sm:pb-20"
			>
				<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(34,211,238,0.14),transparent_34%),radial-gradient(circle_at_78%_22%,rgba(255,255,255,0.08),transparent_24%),radial-gradient(circle_at_70%_72%,rgba(34,211,238,0.08),transparent_30%)]" />
				<video
					className="pointer-events-none absolute hidden h-[120%] w-full object-cover opacity-40 mix-blend-screen md:block"
					autoPlay
					loop
					muted
					playsInline
					poster="/images/demo-thumbnail.png"
					preload="none"
				>
					<source
						src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260307_083826_e938b29f-a43a-41ec-a153-3d4730578ab8.mp4"
						type="video/mp4"
					/>
				</video>

				<div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/50 to-black z-0" />

				<div className="relative z-10 mx-auto grid w-full max-w-7xl items-center gap-10 sm:mt-8 sm:gap-10 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:gap-14">
					<div
						ref={heroContentRef}
						className="flex max-w-2xl flex-col items-start text-left"
					>
						<div className="hero-badge">
							<span className="liquid-glass inline-flex max-w-full items-center gap-2 rounded-full py-1 pr-3 pl-1 sm:pr-4">
								<span className="rounded-full bg-white px-3 py-1 font-body text-[10px] font-bold uppercase tracking-wider text-black">
									Ultramaxo
								</span>
								<span className="truncate font-body text-xs font-medium text-white/80">
									Build smarter. Ship further.
								</span>
							</span>
						</div>

						<div className="hero-headline mt-7 sm:mt-8">
							<GSAPSplitText
								text="Ultramaxo"
								className="font-body text-[3.4rem] font-semibold tracking-[-0.06em] text-white sm:text-[4.4rem] md:text-[5.8rem] lg:text-[7rem] lg:leading-[0.88]"
								delay={0.6}
								animate
							/>
						</div>

						<p className="hero-subtitle mt-5 max-w-2xl font-body text-[1.7rem] font-light leading-[1.02] tracking-[-0.04em] text-white/86 sm:mt-7 sm:text-[2.35rem] md:text-[2.9rem] lg:text-[3.35rem]">
							The AI Workspace
							<br />
							and API Platform
						</p>
						<div className="mt-6 h-[3px] w-16 rounded-full bg-cyan-400/85 sm:mt-8" />
						<p className="hero-subtitle mt-6 max-w-xl font-body text-base leading-relaxed text-white/62 sm:mt-8 md:text-lg">
							Chat, code, documents, and powerful AI access in one seamless
							system. Designed to feel calm, capable, and ready for daily work.
						</p>
						<p className="mt-6 font-body text-2xl tracking-[-0.04em] text-white/92 sm:text-[2rem]">
							Chat. Build. <span className="text-cyan-300">Ship.</span>
						</p>

						<div className="hero-buttons mt-6 flex w-full flex-col items-stretch gap-3 sm:mt-10 sm:w-auto sm:flex-row sm:flex-wrap sm:items-center sm:gap-4">
							<button
								type="button"
								onClick={() => router.push("/register")}
								className="inline-flex justify-center gap-2 rounded-full bg-white px-7 py-3.5 font-body font-semibold text-black text-sm shadow-[0_0_40px_rgba(255,255,255,0.3)] transition-transform hover:scale-[1.03]"
							>
								Start free <ArrowRight className="w-4 h-4" />
							</button>
							<button
								type="button"
								onClick={() => window.open("/app-release.apk", "_blank")}
								className="liquid-glass-strong inline-flex justify-center gap-2 rounded-full border border-white/20 px-7 py-3.5 font-body font-medium text-sm text-white transition-colors hover:text-white"
							>
								Download App
							</button>
							<button
								type="button"
								onClick={() => scrollToSection("#product")}
								className="liquid-glass-strong inline-flex justify-center gap-2 rounded-full px-7 py-3.5 font-body font-medium text-sm text-white transition-colors hover:text-white"
							>
								See the workspace <ChevronRight className="w-4 h-4" />
							</button>
						</div>

						<div className="hero-chips mt-7 flex flex-wrap gap-2.5 sm:mt-10 sm:gap-3">
							{capabilityChips.slice(0, 4).map((chip) => (
								<div
									key={chip}
									className="liquid-glass rounded-full px-3.5 py-1.5 text-xs font-medium text-white/70 font-body inline-flex items-center gap-2"
								>
									<CheckCircle2 className="w-3.5 h-3.5 text-white/50" />
									{chip}
								</div>
							))}
						</div>
					</div>

					<div
						ref={heroMockupRef}
						className="relative perspective-[1600px] opacity-0"
					>
						<div className="relative overflow-hidden rounded-[34px] border border-white/10 bg-[#090b10]/92 p-4 shadow-[0_40px_120px_rgba(0,0,0,0.65)] transition-transform duration-300 ease-out hover:rotate-[0.35deg] hover:scale-[1.01]">
							<div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.16),transparent_24%),radial-gradient(circle_at_bottom_left,rgba(255,255,255,0.04),transparent_28%)]" />
							<div className="relative flex items-center justify-between border-white/10 border-b pb-4 mb-5">
								<div>
									<div className="text-[11px] font-semibold uppercase tracking-[0.32em] text-white/42">
										Overview
									</div>
									<div className="mt-1 font-body text-lg font-medium text-white">
										System workspace
									</div>
								</div>
								<div className="flex items-center gap-2 rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1.5">
									<div className="h-2 w-2 animate-pulse rounded-full bg-cyan-300" />
									<span className="text-[10px] font-semibold uppercase tracking-[0.24em] text-cyan-200">
										Live
									</span>
								</div>
							</div>

							<div className="relative space-y-4 font-body">
								<div className="grid gap-3 sm:grid-cols-2">
									{heroFeatureCards.map((card) => {
										const Icon = card.icon;
										return (
											<div
												key={card.title}
												className="rounded-[22px] border border-white/10 bg-white/[0.035] p-4"
											>
												<div className="flex items-start gap-3">
													<div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-black/45">
														<Icon className="h-5 w-5 text-cyan-300" />
													</div>
													<div>
														<div className="text-sm font-semibold text-white">
															{card.title}
														</div>
														<p className="mt-1 text-xs leading-relaxed text-white/55">
															{card.description}
														</p>
													</div>
												</div>
											</div>
										);
									})}
								</div>

								<div className="grid gap-3 lg:grid-cols-[0.72fr_1.28fr]">
									<div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
										<div className="text-[11px] uppercase tracking-[0.28em] text-cyan-300/70">
											Infrastructure
										</div>
										<div className="mt-4 rounded-[18px] border border-white/6 bg-[radial-gradient(circle_at_30%_30%,rgba(34,211,238,0.2),transparent_22%),linear-gradient(180deg,rgba(255,255,255,0.03),rgba(255,255,255,0.01))] p-4">
											<div className="h-28 rounded-[14px] border border-white/6 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.01)),radial-gradient(circle_at_20%_50%,rgba(34,211,238,0.15),transparent_20%)]" />
											<div className="mt-5 space-y-4">
												{overviewMetrics.map((metric) => (
													<div
														key={metric.label}
														className="flex items-end justify-between border-white/6 border-b pb-3 last:border-none last:pb-0"
													>
														<span className="text-2xl font-medium tracking-[-0.04em] text-white">
															{metric.value}
														</span>
														<span className="text-xs uppercase tracking-[0.24em] text-white/42">
															{metric.label}
														</span>
													</div>
												))}
											</div>
										</div>
									</div>

									<div className="rounded-[24px] border border-white/10 bg-white/[0.03] p-4">
										<div className="grid gap-3 md:grid-cols-[1.35fr_0.65fr]">
											<div className="rounded-[20px] border border-white/6 bg-[#0e1117] p-4">
												<div className="flex items-center justify-between">
													<div>
														<div className="text-sm font-medium text-white">
															Home
														</div>
														<div className="text-xs text-white/40">
															System Overview
														</div>
													</div>
													<div className="text-xs uppercase tracking-[0.24em] text-cyan-300/70">
														92% health
													</div>
												</div>
												<div className="mt-5 grid gap-3 sm:grid-cols-2">
													<div className="rounded-[18px] border border-white/6 bg-white/[0.02] p-3">
														<div className="text-[11px] uppercase tracking-[0.2em] text-white/35">
															API usage
														</div>
														<div className="mt-4 flex h-24 items-end gap-2">
															{infraBars.map((bar) => (
																<div
																	key={bar.id}
																	className="flex-1 rounded-t-full bg-gradient-to-t from-cyan-500/30 to-cyan-300/85"
																	style={{ height: `${bar.value}%` }}
																/>
															))}
														</div>
													</div>
													<div className="rounded-[18px] border border-white/6 bg-white/[0.02] p-3">
														<div className="text-[11px] uppercase tracking-[0.2em] text-white/35">
															Models
														</div>
														<div className="mt-4 flex flex-wrap gap-2">
															{["GPT", "Claude", "Qwen", "DeepSeek", "+9"].map(
																(model) => (
																	<div
																		key={model}
																		className="rounded-full border border-white/10 px-3 py-1.5 text-xs text-white/70"
																	>
																		{model}
																	</div>
																),
															)}
														</div>
													</div>
												</div>
												<div className="mt-3 rounded-[18px] border border-white/6 bg-white/[0.02] p-3">
													<div className="text-[11px] uppercase tracking-[0.2em] text-white/35">
														Recent activity
													</div>
													<div className="mt-3 space-y-3">
														{[
															"Document summarized",
															"Code artifact generated",
															"API request completed",
														].map((item) => (
															<div
																key={item}
																className="flex items-center justify-between text-xs text-white/62"
															>
																<span>{item}</span>
																<span className="text-white/32">2m ago</span>
															</div>
														))}
													</div>
												</div>
											</div>

											<div className="rounded-[20px] border border-white/6 bg-white/[0.02] p-4">
												<div className="text-[11px] uppercase tracking-[0.22em] text-white/35">
													Workspace intelligence
												</div>
												<div className="mt-4 space-y-3">
													<div className="rounded-[18px] border border-white/8 bg-black/30 p-3">
														<div className="text-xs text-white/38">
															Workspace signal
														</div>
														<div className="mt-2 text-3xl font-medium tracking-[-0.04em] text-white">
															92%
														</div>
													</div>
													<div className="rounded-[18px] border border-white/8 bg-black/30 p-3">
														<div className="text-xs text-white/38">
															API requests
														</div>
														<div className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">
															2,847,392
														</div>
													</div>
													<div className="rounded-[18px] border border-white/8 bg-black/30 p-3">
														<div className="text-xs text-white/38">
															Models active
														</div>
														<div className="mt-2 text-2xl font-medium tracking-[-0.04em] text-white">
															12
														</div>
													</div>
												</div>
											</div>
										</div>
									</div>
								</div>
							</div>
						</div>
					</div>
				</div>
			</section>

			{/* ══════ 3. PRODUCT NARRATIVE ══════ */}
			<section
				id="product"
				ref={productRef}
				className="relative z-10 py-24 px-6 md:px-16 lg:px-24 bg-[#030303]"
			>
				<div className="max-w-7xl mx-auto">
					<div className="max-w-2xl mb-20 text-center mx-auto">
						<Badge>Product Narrative</Badge>
						<SectionHeading>
							A cleaner path from asking to shipping.
						</SectionHeading>
						<p className="mt-6 text-white/60 font-body font-light text-base md:text-lg leading-relaxed">
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
										<div className="text-xs font-bold uppercase tracking-[0.2em] text-white/40 mb-4 font-body">
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
										<div className="liquid-glass p-2 rounded-[32px] overflow-hidden group">
											<div className="relative aspect-[4/3] rounded-[24px] overflow-hidden">
												<div className="absolute inset-0 bg-black/20 group-hover:bg-transparent transition-colors duration-500 z-10" />
												<Image
													src={block.image}
													alt={block.title}
													fill
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
				id="overview"
				ref={showcaseRef}
				className="flex min-h-screen items-center bg-[#050505] px-6 py-24 md:px-16 lg:px-24"
			>
				<div className="max-w-7xl mx-auto">
					<div className="text-center mb-16">
						<Badge>Overview</Badge>
						<SectionHeading>
							A calmer overview, a stronger product signal.
						</SectionHeading>
						<p className="mt-6 max-w-2xl mx-auto font-body text-base text-white/50">
							The website should feel like the product already knows what it is:
							refined, capable, and easy to trust at a glance.
						</p>
					</div>

					<div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="showcase-left rounded-[32px] border border-white/10 bg-[linear-gradient(180deg,rgba(255,255,255,0.04),rgba(255,255,255,0.015))] p-6 opacity-0 md:p-8">
							<div className="showcase-bubble-wrapper space-y-4">
								{overviewPanels.map((panel) => {
									const Icon = panel.icon;
									return (
										<div
											key={panel.title}
											className="showcase-bubble rounded-[28px] border border-white/10 bg-black/25 p-5"
										>
											<div className="flex items-start gap-4">
												<div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.03]">
													<Icon className="h-5 w-5 text-cyan-300" />
												</div>
												<div>
													<div className="text-[11px] uppercase tracking-[0.24em] text-white/38">
														{panel.eyebrow}
													</div>
													<h4 className="mt-2 font-body text-xl font-medium tracking-[-0.03em] text-white">
														{panel.title}
													</h4>
													<p className="mt-2 text-sm leading-relaxed text-white/56">
														{panel.description}
													</p>
												</div>
											</div>
										</div>
									);
								})}
							</div>
						</div>

						<div className="showcase-right rounded-[32px] border border-cyan-400/15 bg-[radial-gradient(circle_at_top_right,rgba(34,211,238,0.12),transparent_25%),linear-gradient(180deg,rgba(255,255,255,0.05),rgba(255,255,255,0.02))] p-6 opacity-0 shadow-[0_0_60px_rgba(34,211,238,0.08)] md:p-8">
							<div className="grid gap-4 sm:grid-cols-2">
								<div className="rounded-[26px] border border-white/10 bg-black/30 p-5 sm:col-span-2">
									<div className="flex items-start justify-between gap-4">
										<div>
											<div className="text-[11px] uppercase tracking-[0.28em] text-white/38">
												Activity
											</div>
											<div className="mt-2 text-3xl font-medium tracking-[-0.05em] text-white">
												2,847,392
											</div>
										</div>
										<div className="rounded-full border border-cyan-400/20 bg-cyan-400/10 px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-cyan-200">
											+18.6%
										</div>
									</div>
									<div className="mt-6 flex h-24 items-end gap-2">
										{activityBars.map((bar) => (
											<div
												key={bar.id}
												className="flex-1 rounded-t-full bg-gradient-to-t from-cyan-500/25 via-cyan-400/55 to-cyan-300/90"
												style={{ height: `${bar.value}%` }}
											/>
										))}
									</div>
								</div>
								<div className="rounded-[26px] border border-white/10 bg-black/30 p-5">
									<div className="text-[11px] uppercase tracking-[0.24em] text-white/38">
										Health
									</div>
									<div className="mt-4 flex h-28 items-center justify-center">
										<div className="flex h-24 w-24 items-center justify-center rounded-full border-[10px] border-cyan-300/80 border-t-white/10 text-2xl font-medium text-white">
											92%
										</div>
									</div>
								</div>
								<div className="rounded-[26px] border border-white/10 bg-black/30 p-5">
									<div className="text-[11px] uppercase tracking-[0.24em] text-white/38">
										Models
									</div>
									<div className="mt-4 grid grid-cols-2 gap-2">
										{["GPT-5.5", "Claude", "Qwen", "DeepSeek"].map((model) => (
											<div
												key={model}
												className="rounded-2xl border border-white/10 bg-white/[0.03] px-3 py-2 text-center text-xs text-white/75"
											>
												{model}
											</div>
										))}
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
							className="usecase-card liquid-glass rounded-3xl p-8 md:p-10 text-left border border-white/10 opacity-0"
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
				className="relative py-32 px-6 md:px-16 lg:px-24 bg-[#050505] border-t border-white/5"
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
							<div className="liquid-glass-strong rounded-[32px] p-6 md:p-8 border border-white/20 shadow-[0_0_40px_rgba(255,255,255,0.05)]">
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
									className="mt-8 w-full bg-white text-black rounded-full py-3.5 text-sm font-semibold font-body inline-flex items-center justify-center gap-2 hover:scale-[1.02] transition-transform"
								>
									Generate API Key <ArrowRight className="w-4 h-4" />
								</button>
							</div>
						</div>

						{/* Models Table Side */}
						<div className="lg:col-span-2 liquid-glass rounded-[32px] overflow-hidden border border-white/10 api-element">
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
										{apiModels.map((model) => (
											<tr
												key={model.modelId}
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
				className="relative py-32 px-6 md:px-16 lg:px-24 bg-[#0a0a0a]"
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
								className={`pricing-card rounded-[40px] p-8 flex flex-col relative opacity-0 ${
									plan.featured
										? "pricing-featured liquid-glass-strong border border-white/30 transform lg:-translate-y-8 shadow-[0_0_80px_rgba(255,255,255,0.1)]"
										: "liquid-glass border border-white/5"
								}`}
							>
								{plan.featured && (
									<div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white text-black font-bold uppercase tracking-widest text-[10px] px-4 py-1.5 rounded-full font-body">
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
												<CheckCircle2 className="w-4 h-4 text-white mt-0.5" />
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
									className={`mt-10 w-full py-4 rounded-full font-semibold font-body text-sm transition-all duration-300 ${
										plan.featured
											? "bg-white text-black hover:scale-[1.02]"
											: "bg-white/10 text-white hover:bg-white/20"
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
								<button
									key={item.question}
									data-faq={item.question}
									className="faq-item liquid-glass w-full rounded-3xl border border-white/5 p-6 text-left opacity-0 md:p-8"
									onClick={() => toggleFaq(item.question)}
									type="button"
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
								</button>
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
										href="https://t.me/+CQR8SWdH5nE2OTdk"
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
										href="https://t.me/+CQR8SWdH5nE2OTdk"
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
