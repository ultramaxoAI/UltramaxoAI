"use client";

import { motion } from "framer-motion";
import { useSession } from "next-auth/react";
import { useEffect, useState } from "react";
import useSWR from "swr";
import type { ChatHistory } from "@/components/sidebar-history";
import { fetcher } from "@/lib/utils";

function getTimeGreeting(): string {
	const hour = new Date().getHours();

	if (hour >= 5 && hour < 12) {
		return "Selamat pagi";
	}

	if (hour >= 12 && hour < 15) {
		return "Selamat siang";
	}

	if (hour >= 15 && hour < 19) {
		return "Selamat sore";
	}

	return "Selamat malam";
}

function getFirstName(fullName?: string | null): string {
	if (!fullName?.trim()) {
		return "kamu";
	}

	return fullName.trim().split(/\s+/)[0] ?? "kamu";
}

type GreetingContent = {
	heading: string;
	sub: string;
};

function buildGreeting(
	firstName: string,
	hasHistory: boolean,
): GreetingContent {
	if (hasHistory) {
		return {
			heading: `Halo, ${firstName}`,
			sub: "Apa lagi yang mau dikerjakan?",
		};
	}

	return {
		heading: `${getTimeGreeting()}, ${firstName}`,
		sub: "Ada yang bisa aku bantu?",
	};
}

export function Greeting({
	onPromptSelect: _onPromptSelect,
}: {
	onPromptSelect?: (prompt: string) => void;
}) {
	const { data: session } = useSession();
	const { data: history } = useSWR<ChatHistory>("/api/history?limit=1", fetcher);
	const [greeting, setGreeting] = useState<GreetingContent | null>(null);

	useEffect(() => {
		const computeGreeting = () => {
			const firstName = getFirstName(session?.user?.name);
			const hasHistory = (history?.chats?.length ?? 0) > 0;

			setGreeting(buildGreeting(firstName, hasHistory));
		};

		computeGreeting();
		const interval = window.setInterval(computeGreeting, 60_000);

		return () => window.clearInterval(interval);
	}, [history?.chats?.length, session?.user?.name]);

	if (!greeting) {
		return null;
	}

	return (
		<div
			className="flex h-full select-none flex-col items-center justify-center px-4 pb-[4vh]"
			key="overview"
		>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="flex flex-col items-center text-center"
				initial={{ opacity: 0, y: 10 }}
				transition={{ duration: 0.35, ease: [0.4, 0, 0.2, 1] }}
			>
				<h1 className="mb-3 text-[34px] font-semibold tracking-tight text-white/90 md:text-[42px]">
					{greeting.heading}
				</h1>
				<p className="max-w-[560px] text-[17px] leading-relaxed text-white/34 md:text-[18px]">
					{greeting.sub}
				</p>
			</motion.div>
		</div>
	);
}
