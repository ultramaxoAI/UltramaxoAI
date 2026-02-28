"use client";

import { useTheme } from "next-themes";
import { Moon, Sun } from "lucide-react";
import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

export function ThemeToggle() {
	const { theme, setTheme } = useTheme();
	const [mounted, setMounted] = useState(false);

	useEffect(() => setMounted(true), []);

	const handleToggle = () => {
		const html = document.documentElement;
		html.classList.add("theme-transition");
		setTheme(theme === "dark" ? "light" : "dark");
		setTimeout(() => {
			html.classList.remove("theme-transition");
		}, 600);
	};

	return (
		<button
			aria-label="Toggle theme"
			className="relative w-9 h-9 flex items-center justify-center rounded-lg text-gray-500 hover:text-zinc-900 dark:hover:text-white hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors"
			onClick={handleToggle}
		>
			<AnimatePresence mode="wait" initial={false}>
				<motion.div
					key={theme === "dark" ? "dark" : "light"}
					initial={{ y: -20, opacity: 0, rotate: -90 }}
					animate={{ y: 0, opacity: 1, rotate: 0 }}
					exit={{ y: 20, opacity: 0, rotate: 90 }}
					transition={{ duration: 0.2 }}
					className="absolute"
				>
					{theme === "dark" ? <Sun size={18} /> : <Moon size={18} />}
				</motion.div>
			</AnimatePresence>
		</button>
	);
}
