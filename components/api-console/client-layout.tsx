"use client";

import { Menu, PanelLeftClose, PanelLeftOpen, X } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useState } from "react";
import { GoogleTranslate } from "@/components/google-translate";
import { ThemeToggle } from "@/components/theme-toggle";
import { ApiConsoleSidebarNav } from "./sidebar-nav";

export function ApiConsoleClientLayout({
	children,
	navItems,
}: {
	children: React.ReactNode;
	navItems: any[];
}) {
	const [sidebarOpen, setSidebarOpen] = useState(true);
	const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
	const _pathname = usePathname();

	// Close mobile sidebar when route changes
	useEffect(() => {
		setMobileSidebarOpen(false);
	}, []);

	// Prevent body scroll when mobile sidebar is open
	useEffect(() => {
		if (mobileSidebarOpen) {
			document.body.style.overflow = "hidden";
		} else {
			document.body.style.overflow = "";
		}
		return () => {
			document.body.style.overflow = "";
		};
	}, [mobileSidebarOpen]);

	return (
		<div className="apic">
			{/* Mobile Overlay */}
			{mobileSidebarOpen && (
				<div
					className="fixed inset-0 bg-black/50 z-40 md:hidden backdrop-blur-sm transition-opacity"
					onClick={() => setMobileSidebarOpen(false)}
				/>
			)}

			<aside
				className={`apic-sidebar ${!sidebarOpen ? "apic-sidebar--collapsed" : ""} ${mobileSidebarOpen ? "apic-sidebar--mobile-open" : ""}`}
			>
				<div className="apic-sidebar-head flex items-center justify-between w-full">
					<div className="flex items-center gap-2">
						<Link href="/api-console" className="apic-logo">
							<span className="apic-logo-mark">U</span>
							<span className="apic-logo-text">Ultramaxo</span>
						</Link>
						<span className="apic-badge">API</span>
					</div>
					<button
						type="button"
						className="apic-sidebar-toggle-btn hidden md:flex"
						onClick={() => setSidebarOpen(false)}
						title="Close sidebar"
					>
						<PanelLeftClose size={18} />
					</button>
					<button
						type="button"
						className="apic-sidebar-toggle-btn flex md:hidden"
						onClick={() => setMobileSidebarOpen(false)}
						title="Close sidebar"
					>
						<X size={18} />
					</button>
				</div>

				<ApiConsoleSidebarNav items={navItems} />

				<div className="apic-sidebar-foot flex flex-col gap-3">
					<div className="flex items-center gap-2 px-2">
						<GoogleTranslate />
						<ThemeToggle />
					</div>
					<Link href="/chat" className="apic-nav-link apic-nav-link--muted">
						<span className="apic-nav-icon">←</span>
						Back to Chat
					</Link>
				</div>
			</aside>

			{/* Floating open button */}
			{!sidebarOpen && (
				<button
					type="button"
					className="apic-floating-toggle hidden md:flex"
					onClick={() => setSidebarOpen(true)}
					title="Open sidebar"
				>
					<PanelLeftOpen size={18} />
				</button>
			)}

			{/* Mobile header */}
			<div
				className="apic-mobile-header flex items-center justify-between p-4 md:hidden"
				style={{
					borderBottom: "1px solid var(--apic-border)",
					background: "var(--apic-sidebar-bg)",
				}}
			>
				<div className="flex items-center gap-3">
					<button
						onClick={() => setMobileSidebarOpen(true)}
						className="p-1 rounded-md text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800"
					>
						<Menu size={20} />
					</button>
					<Link
						href="/api-console"
						className="apic-logo flex items-center gap-2"
					>
						<span className="apic-logo-mark flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm">
							U
						</span>
						<span className="apic-logo-text font-semibold">Ultramaxo</span>
					</Link>
					<span className="apic-badge hidden sm:inline-flex">API</span>
				</div>
				<div className="flex items-center gap-2">
					<GoogleTranslate />
					<ThemeToggle />
				</div>
			</div>

			<main
				className={`apic-main ${!sidebarOpen ? "apic-main--expanded" : ""}`}
			>
				{children}
			</main>
		</div>
	);
}
