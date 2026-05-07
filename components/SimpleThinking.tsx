"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SIMPLE_LABELS = ["Berpikir...", "Memproses...", "Sebentar..."];

export function SimpleThinking({
	isUpgrading = false,
	className,
}: {
	isUpgrading?: boolean;
	className?: string;
}) {
	const [labelIndex, setLabelIndex] = useState(0);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setLabelIndex((index) => (index + 1) % SIMPLE_LABELS.length);
		}, 2500);

		return () => window.clearInterval(interval);
	}, []);

	return (
		<div
			className={cn(
				"simple-thinking-bubble inline-flex items-center gap-2 rounded-[22px] border border-[#1e1e1e] bg-[#111] px-3.5 py-2.5 font-sans text-[12px] text-[#6f6f6f]",
				isUpgrading && "simple-thinking-upgrading",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Segoe UI', system-ui, sans-serif",
			}}
		>
			<span className="simple-thinking-dots flex items-center gap-[3px]">
				<span />
				<span />
				<span />
			</span>
			<span className="min-w-[72px]">{SIMPLE_LABELS[labelIndex]}</span>

			<style jsx>{`
				.simple-thinking-bubble {
					box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
					transform-origin: left center;
				}

				.simple-thinking-upgrading {
					animation: simple-upgrade-out 0.8s ease forwards;
				}

				.simple-thinking-dots span {
					width: 4.5px;
					height: 4.5px;
					border-radius: 999px;
					background: #4a90e2;
					animation: simple-dot-pulse 1.5s ease-in-out infinite;
				}

				.simple-thinking-dots span:nth-child(2) {
					animation-delay: 0.18s;
				}

				.simple-thinking-dots span:nth-child(3) {
					animation-delay: 0.36s;
				}

				@keyframes simple-dot-pulse {
					0%,
					60%,
					100% {
						opacity: 0.2;
						transform: scale(0.78);
					}
					30% {
						opacity: 1;
						transform: scale(1);
					}
				}

				@keyframes simple-upgrade-out {
					0% {
						border-color: #1e1e1e;
						box-shadow: 0 12px 36px rgba(0, 0, 0, 0.16);
						opacity: 1;
					}
					55% {
						border-color: rgba(74, 144, 226, 0.85);
						box-shadow: 0 0 28px rgba(74, 144, 226, 0.32);
						opacity: 1;
					}
					100% {
						border-color: rgba(74, 144, 226, 0.35);
						box-shadow: 0 0 18px rgba(74, 144, 226, 0.12);
						opacity: 0;
						transform: translateY(-2px) scale(0.98);
					}
				}
			`}</style>
		</div>
	);
}
