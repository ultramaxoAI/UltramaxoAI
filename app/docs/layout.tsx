"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { DocsContext, type Lang, type Theme } from "./docs-context";

const navItems = [
	{ href: "/docs", label: { en: "Introduction", id: "Pengantar" } },
	{
		href: "/docs/authentication",
		label: { en: "Authentication", id: "Autentikasi" },
	},
	{
		href: "/docs/chat-completions",
		label: { en: "Chat Completions", id: "Chat Completions" },
	},
	{ href: "/docs/models", label: { en: "Models", id: "Model" } },
	{
		href: "/docs/sdks",
		label: { en: "SDKs & Libraries", id: "SDK & Library" },
	},
	{
		href: "/docs/billing",
		label: { en: "Billing & Limits", id: "Billing & Limit" },
	},
	{
		href: "/docs/errors",
		label: { en: "Error Reference", id: "Referensi Error" },
	},
];

export default function PublicDocsLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const pathname = usePathname();
	const [lang, setLang] = useState<Lang>("en");
	const [theme, setTheme] = useState<Theme>("dark");
	const [mobileNav, setMobileNav] = useState(false);
	const [sidebarOpen, setSidebarOpen] = useState(true);

	useEffect(() => {
		const saved = localStorage.getItem("docs-lang");
		if (saved === "id" || saved === "en") setLang(saved);
		const savedTheme = localStorage.getItem("docs-theme");
		if (savedTheme === "light" || savedTheme === "dark") setTheme(savedTheme);
	}, []);

	useEffect(() => {
		localStorage.setItem("docs-lang", lang);
	}, [lang]);
	useEffect(() => {
		localStorage.setItem("docs-theme", theme);
	}, [theme]);

	const isDark = theme === "dark";

	return (
		<DocsContext.Provider value={{ lang, setLang, theme, setTheme }}>
			<div className={`docs ${isDark ? "docs--dark" : "docs--light"}`}>
				{/* Sidebar */}
				<aside
					className={`docs-sidebar ${!sidebarOpen ? "docs-sidebar--collapsed" : ""}`}
				>
					<div className="docs-sidebar-head flex items-center justify-between w-full">
						<div className="flex items-center gap-2">
							<Link href="/" className="docs-logo">
								<span className="docs-logo-mark">U</span>
								<span className="docs-logo-text">Ultramaxo</span>
							</Link>
							<span className="docs-badge">Docs</span>
						</div>
						<button
							type="button"
							className="docs-sidebar-toggle-btn hidden md:flex"
							onClick={() => setSidebarOpen(false)}
							title="Close sidebar"
						>
							<PanelLeftClose size={18} />
						</button>
					</div>

					<nav className="docs-nav">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`docs-nav-link ${pathname === item.href ? "docs-nav-link--active" : ""}`}
							>
								{item.label[lang]}
							</Link>
						))}
					</nav>

					<div className="docs-sidebar-foot">
						<div className="docs-controls">
							<button
								type="button"
								className={`docs-ctrl-btn ${lang === "en" ? "docs-ctrl-btn--active" : ""}`}
								onClick={() => setLang("en")}
							>
								EN
							</button>
							<button
								type="button"
								className={`docs-ctrl-btn ${lang === "id" ? "docs-ctrl-btn--active" : ""}`}
								onClick={() => setLang("id")}
							>
								ID
							</button>
							<span className="docs-ctrl-sep" />
							<button
								type="button"
								className="docs-ctrl-btn"
								onClick={() => setTheme(isDark ? "light" : "dark")}
							>
								{isDark ? "☀" : "●"}
							</button>
						</div>
						<Link
							href="/api-console"
							className="docs-nav-link docs-nav-link--muted"
						>
							→ API Console
						</Link>
					</div>
				</aside>

				{/* Floating open button */}
				{!sidebarOpen && (
					<button
						type="button"
						className="docs-floating-toggle hidden md:flex"
						onClick={() => setSidebarOpen(true)}
						title="Open sidebar"
					>
						<PanelLeftOpen size={18} />
					</button>
				)}

				{/* Mobile header */}
				<div className="docs-mobile-header">
					<Link href="/docs" className="docs-logo">
						<span className="docs-logo-mark">U</span>
						<span className="docs-logo-text">Docs</span>
					</Link>
					<div className="docs-row">
						<button
							type="button"
							className="docs-ctrl-btn"
							onClick={() => setLang(lang === "en" ? "id" : "en")}
						>
							{lang.toUpperCase()}
						</button>
						<button
							type="button"
							className="docs-ctrl-btn"
							onClick={() => setTheme(isDark ? "light" : "dark")}
						>
							{isDark ? "☀" : "●"}
						</button>
						<button
							type="button"
							className="docs-ctrl-btn"
							onClick={() => setMobileNav(!mobileNav)}
						>
							☰
						</button>
					</div>
				</div>

				{mobileNav && (
					<div className="docs-mobile-nav">
						{navItems.map((item) => (
							<Link
								key={item.href}
								href={item.href}
								className={`docs-nav-link ${pathname === item.href ? "docs-nav-link--active" : ""}`}
								onClick={() => setMobileNav(false)}
							>
								{item.label[lang]}
							</Link>
						))}
					</div>
				)}

				<main
					className={`docs-main ${!sidebarOpen ? "docs-main--expanded" : ""}`}
				>
					{children}
				</main>
			</div>
		</DocsContext.Provider>
	);
}
