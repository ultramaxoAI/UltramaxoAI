"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

type NavItem = {
	href: string;
	label: string;
	icon: string;
	children?: { href: string; label: string }[];
};

export function ApiConsoleSidebarNav({ items }: { items: NavItem[] }) {
	const pathname = usePathname();

	const isActive = (href: string) => {
		if (href === "/api-console") return pathname === "/api-console";
		return pathname.startsWith(href);
	};

	const isSubActive = (href: string) => pathname === href;

	return (
		<nav className="apic-nav">
			{items.map((item) => (
				<div key={item.href}>
					<Link
						href={item.href}
						className={`apic-nav-link ${isActive(item.href) ? "apic-nav-link--active" : ""}`}
					>
						<span className="apic-nav-icon">{item.icon}</span>
						{item.label}
					</Link>
					{item.children && (
						<div className="apic-nav-sub">
							{item.children.map((child) => (
								<Link
									key={child.href}
									href={child.href}
									className={`apic-nav-sublink ${isSubActive(child.href) ? "apic-nav-sublink--active" : ""}`}
								>
									{child.label}
								</Link>
							))}
						</div>
					)}
				</div>
			))}
		</nav>
	);
}
