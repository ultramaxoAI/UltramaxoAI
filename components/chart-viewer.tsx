sa"use client";

import { useEffect, useRef } from "react";
import { Card } from "@/components/ui/card";

type ChartConfig = {
	type: "line" | "bar" | "pie" | "scatter" | "doughnut" | "radar";
	data: {
		labels: string[];
		datasets: Array<{
			label: string;
			data: number[];
			backgroundColor?: string;
			borderColor?: string;
			borderWidth?: number;
		}>;
	};
	options?: any;
};

type ChartViewerProps = {
	config: ChartConfig;
	title?: string;
};

export function ChartViewer({ config, title }: ChartViewerProps) {
	const canvasRef = useRef<HTMLCanvasElement>(null);
	const chartInstanceRef = useRef<any>(null);

	useEffect(() => {
		if (!canvasRef.current) {
			return;
		}

		// Dynamically import Chart.js to reduce bundle size
		import("chart.js/auto").then(({ default: Chart }) => {
			// Destroy previous chart instance
			if (chartInstanceRef.current) {
				chartInstanceRef.current.destroy();
			}

			// Create new chart
			const ctx = canvasRef.current?.getContext("2d");
			if (ctx) {
				chartInstanceRef.current = new Chart(ctx, {
					type: config.type,
					data: config.data,
					options: {
						responsive: true,
						maintainAspectRatio: true,
						...config.options,
					},
				});
			}
		});

		// Cleanup on unmount
		return () => {
			if (chartInstanceRef.current) {
				chartInstanceRef.current.destroy();
			}
		};
	}, [config]);

	return (
		<Card className="p-6 bg-zinc-900/50 border-zinc-800">
			{title && (
				<h3 className="text-lg font-semibold mb-4 text-white">{title}</h3>
			)}
			<div className="relative">
				<canvas ref={canvasRef} />
			</div>
		</Card>
	);
}
