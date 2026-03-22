"use client";

import { motion, useInView } from "framer-motion";
import { useRef } from "react";

interface BlurTextProps {
	text: string;
	className?: string;
	delay?: number;
	as?: "h1" | "h2" | "h3" | "p" | "span";
}

export function BlurText({
	text,
	className = "",
	delay = 100,
	as: Tag = "h1",
}: BlurTextProps) {
	const ref = useRef<HTMLDivElement>(null);
	const isInView = useInView(ref, { once: true, amount: 0.3 });

	const words = text.split(" ");

	return (
		<Tag ref={ref as React.RefObject<HTMLHeadingElement>} className={className}>
			{words.map((word, i) => (
				<motion.span
					key={`${word}-${i}`}
					className="inline-block"
					initial={{ filter: "blur(10px)", opacity: 0, y: 50 }}
					animate={
						isInView
							? {
									filter: "blur(0px)",
									opacity: 1,
									y: 0,
								}
							: { filter: "blur(10px)", opacity: 0, y: 50 }
					}
					transition={{
						duration: 0.35,
						delay: i * (delay / 1000),
						ease: [0.22, 1, 0.36, 1],
					}}
				>
					{word}
					{i < words.length - 1 ? "\u00A0" : ""}
				</motion.span>
			))}
		</Tag>
	);
}
