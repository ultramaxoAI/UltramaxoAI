"use client";

import { cn } from "@/lib/utils";

export function SimpleThinking({
	isUpgrading = false,
	className,
}: {
	isUpgrading?: boolean;
	className?: string;
}) {
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
					"thinking-shimmer min-w-[58px] text-[13px]",
				)}
			>
				Thinking
			</span>

			<style jsx>{`
				.thinking-shimmer {
					background: linear-gradient(
						90deg,
						rgba(255,255,255,.22) 0%,
						rgba(255,255,255,.58) 42%,
						rgba(255,255,255,.86) 50%,
						rgba(255,255,255,.58) 58%,
						rgba(255,255,255,.22) 100%
					);
					background-size: 220% 100%;
					-webkit-background-clip: text;
					-webkit-text-fill-color: transparent;
					background-clip: text;
					animation: shimmer-text 2.2s ease-in-out infinite;
				}

				.simple-thinking-upgrading {
					opacity: 0.75;
				}

				@keyframes shimmer-text {
					0% { background-position: 200% center; }
					100% { background-position: -200% center; }
				}
			`}</style>
		</div>
	);
}
