"use client";

import { Mail, Check } from "lucide-react";
import { useState } from "react";

export function EmailButton() {
	const [copied, setCopied] = useState(false);
	const email = "support@ultramaxo.tech";

	const handleCopy = async (e: React.MouseEvent) => {
		e.preventDefault();
		try {
			await navigator.clipboard.writeText(email);
			setCopied(true);
			setTimeout(() => setCopied(false), 2000);
			// After copying, try to open the mailto link anyway
			window.location.href = `mailto:${email}`;
		} catch (err) {
			console.error("Failed to copy:", err);
			window.location.href = `mailto:${email}`;
		}
	};

	return (
		<button
			onClick={handleCopy}
			className="flex-1 flex w-full items-center justify-center gap-3 bg-white/5 border border-white/10 px-6 py-4 rounded-2xl hover:bg-white/10 transition-colors relative group"
		>
			{copied ? (
				<Check className="w-5 h-5 text-green-500" />
			) : (
				<Mail className="w-5 h-5 text-white/70 group-hover:text-white transition-colors" />
			)}
			<span className="font-medium">
				{copied ? "Email Copied!" : email}
			</span>
			<span className="absolute -top-10 left-1/2 -translate-x-1/2 bg-white/10 backdrop-blur-md px-3 py-1 rounded-lg text-xs font-medium opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none border border-white/10">
				Click to copy & email
			</span>
		</button>
	);
}
