"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Settings2, Users, Receipt, Mail, BarChart3, ChevronLeft } from "lucide-react";

export function AdminSidebar() {
	const pathname = usePathname();

	const matches = (path: string) => pathname === path || pathname.startsWith(path + "/");

	const navItems = [
		{ name: "Overview", href: "/admin", icon: BarChart3 },
		{ name: "Users", href: "/admin/users", icon: Users },
		{ name: "Vouchers", href: "/admin/vouchers", icon: Receipt },
		{ name: "Email Studio", href: "/admin/emails", icon: Mail },
		{ name: "Settings", href: "/admin/settings", icon: Settings2 },
	];

	return (
		<>
			{/* Desktop Sidebar */}
			<aside className="hidden md:flex w-[260px] border-r border-gray-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] flex-col shrink-0">
				<div className="h-14 flex items-center px-4 border-b border-gray-200 dark:border-white/10">
					<div className="flex items-center gap-2">
						<div className="flex items-center justify-center size-6 rounded-md bg-black dark:bg-white text-white dark:text-black">
							<Settings2 size={14} />
						</div>
						<span className="font-semibold text-sm tracking-tight text-gray-900 dark:text-white">
							Ultramaxo Admin
						</span>
					</div>
				</div>

				<nav className="flex-1 overflow-y-auto py-4 px-3 space-y-1">
					{navItems.map((item) => {
						const isActive = item.href === "/admin" ? pathname === "/admin" : matches(item.href);
						return (
							<Link
								key={item.name}
								href={item.href}
								className={`flex items-center gap-3 px-3 py-2 text-sm font-medium rounded-md transition-colors ${
									isActive
										? "bg-gray-100 text-gray-900 dark:bg-white/10 dark:text-white"
										: "text-gray-600 hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white"
								}`}
							>
								<item.icon size={16} className={isActive ? "text-gray-900 dark:text-white" : "text-gray-500 dark:text-gray-400"} />
								{item.name}
							</Link>
						);
					})}
				</nav>

				<div className="p-3 border-t border-gray-200 dark:border-white/10">
					<Link
						href="/"
						className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-gray-600 rounded-md hover:bg-gray-50 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-white transition-colors"
					>
						<ChevronLeft size={16} />
						Exit Administration
					</Link>
				</div>
			</aside>

			{/* Mobile Bottom Nav */}
			<nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white dark:bg-[#0a0a0a] border-t border-gray-200 dark:border-white/10 flex items-center justify-around px-1 py-1.5 safe-bottom">
				{navItems.map((item) => {
					const isActive = item.href === "/admin" ? pathname === "/admin" : matches(item.href);
					return (
						<Link
							key={item.name}
							href={item.href}
							className={`flex flex-col items-center gap-0.5 px-2 py-1.5 rounded-lg text-[10px] font-medium transition-colors min-w-0 ${
								isActive
									? "text-indigo-600 dark:text-indigo-400"
									: "text-gray-500 dark:text-gray-400"
							}`}
						>
							<item.icon size={18} />
							<span className="truncate">{item.name === "Email Studio" ? "Email" : item.name}</span>
						</Link>
					);
				})}
			</nav>
		</>
	);
}
