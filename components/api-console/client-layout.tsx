"use client";

import { PanelLeftClose, PanelLeftOpen } from "lucide-react";
import Link from "next/link";
import { useState } from "react";
import { ApiConsoleSidebarNav } from "./sidebar-nav";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleTranslate } from "@/components/google-translate";

export function ApiConsoleClientLayout({
	children,
	navItems,
}: {
	children: React.ReactNode;
	navItems: any[];
}) {
	const [sidebarOpen, setSidebarOpen] = useState(true);

	return (
		<div className="apic">
			<aside className={`apic-sidebar ${!sidebarOpen ? "apic-sidebar--collapsed" : ""}`}>
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
				<div className="flex items-center gap-2">
					<Link href="/api-console" className="apic-logo flex items-center gap-2">
						<span className="apic-logo-mark flex items-center justify-center w-7 h-7 rounded-md font-bold text-sm">
							U
						</span>
						<span className="apic-logo-text font-semibold">Ultramaxo</span>
					</Link>
					<span className="apic-badge">API</span>
				</div>
				<div className="flex items-center gap-2">
					<GoogleTranslate />
					<ThemeToggle />
				</div>
			</div>

			<main className={`apic-main ${!sidebarOpen ? "apic-main--expanded" : ""}`}>
				{children}
			</main>
		</div>
	);
}
