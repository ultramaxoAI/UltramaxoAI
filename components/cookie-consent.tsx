"use client";

import { useEffect, useState } from "react";
import { X, Cookie } from "lucide-react";
import { Button } from "./ui/button";

export function CookieConsent() {
	const [isVisible, setIsVisible] = useState(false);

	useEffect(() => {
		// Small delay to allow initial rendering and check localStorage
		const timer = setTimeout(() => {
			const consent = localStorage.getItem("cookie-consent");
			if (!consent) {
				setIsVisible(true);
			}
		}, 1000);
		
		return () => clearTimeout(timer);
	}, []);

	const handleAccept = () => {
		localStorage.setItem("cookie-consent", "accepted");
		setIsVisible(false);
	};

	const handleDecline = () => {
		localStorage.setItem("cookie-consent", "declined");
		setIsVisible(false);
	};

	if (!isVisible) return null;

	return (
		<div className="fixed bottom-0 left-0 right-0 z-100 p-4 sm:p-6 sm:max-w-max mx-auto animate-in slide-in-from-bottom-10 fade-in duration-500">
			<div className="bg-[#0A0A0A] border border-white/10 shadow-2xl rounded-2xl p-5 sm:p-6 flex flex-col sm:flex-row items-start sm:items-center gap-6 max-w-4xl w-full">
				<div className="flex items-start gap-4">
					<div className="bg-zinc-900/50 p-3 rounded-xl border border-white/5 shrink-0 hidden sm:block">
						<Cookie className="w-6 h-6 text-zinc-400" />
					</div>
					<div className="flex flex-col gap-1.5">
						<h3 className="text-white font-semibold text-sm sm:text-base flex items-center gap-2">
							<Cookie className="w-4 h-4 text-zinc-400 sm:hidden" />
							We respect your privacy
						</h3>
						<p className="text-zinc-400 text-xs sm:text-sm leading-relaxed max-w-2xl">
							We use essential cookies to keep your session secure (1-Day limit) and to make our AI features work. By clicking "Accept All", you also agree to our use of analytics cookies to improve your experience.
						</p>
					</div>
				</div>
				<div className="flex items-center gap-3 w-full sm:w-auto shrink-0 justify-end mt-2 sm:mt-0">
					<Button
						variant="ghost"
						onClick={handleDecline}
						className="text-zinc-400 hover:text-white hover:bg-zinc-800/50 rounded-xl text-xs sm:text-sm px-4 flex-1 sm:flex-none"
					>
						Essential Only
					</Button>
					<Button
						onClick={handleAccept}
						className="bg-zinc-100 text-zinc-900 hover:bg-white rounded-xl text-xs sm:text-sm px-6 font-semibold flex-1 sm:flex-none"
					>
						Accept All
					</Button>
					<button
						onClick={handleDecline}
						className="p-2 text-zinc-500 hover:text-white transition-colors rounded-full hover:bg-zinc-800 hidden sm:block ml-1"
						aria-label="Close"
					>
						<X className="w-4 h-4" />
					</button>
				</div>
			</div>
		</div>
	);
}
