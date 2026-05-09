"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

const SIMPLE_LABELS = ["Berpikir", "Menyusun jawaban", "Menyiapkan respons"];

export function SimpleThinking({
	isUpgrading = false,
	className,
}: {
	isUpgrading?: boolean;
	className?: string;
}) {
	const [labelIndex, setLabelIndex] = useState(0);
	const [isVisible, setIsVisible] = useState(true);

	useEffect(() => {
		const interval = window.setInterval(() => {
			setIsVisible(false);
			window.setTimeout(() => {
				setLabelIndex((index) => (index + 1) % SIMPLE_LABELS.length);
				setIsVisible(true);
			}, 180);
		}, 2500);

		return () => window.clearInterval(interval);
	}, []);

	return (
		<div
			className={cn(
				"inline-flex items-center px-0 py-0 font-sans",
				isUpgrading && "simple-thinking-upgrading",
				className,
			)}
			style={{
				fontFamily:
					"-apple-system, BlinkMacSystemFont, 'Inter', sans-serif",
			}}
		>
			<span
				className={cn(
					"thinking-shimmer min-w-[118px] text-[13px] transition-opacity duration-200",
					isVisible ? "opacity-100" : "opacity-0",
				)}
			>
				{SIMPLE_LABELS[labelIndex]}
			</span>

			<style jsx>{`
				.thinking-shimmer {
					background: linear-gradient(
						90deg,
						rgba(255,255,255,.2) 0%,
						rgba(255,255,255,.65) 35%,
						rgba(255,255,255,.9) 50%,
						rgba(255,255,255,.65) 65%,
						rgba(255,255,255,.2) 100%
					);
					background-size: 200% 100%;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					animation: shimmer-text 2.8s ease-in-out infinite;
				}

				.simple-thinking-upgrading {
					animation: simple-upgrade-out 400ms ease forwards;
				}

				@keyframes shimmer-text {
					0% { background-position: 200% center; }
					100% { background-position: -200% center; }
				}

				@keyframes simple-upgrade-out {
					to {
						opacity: 0;
						transform: scale(0.97);
					}
				}
			`}</style>
		</div>
	);
}
