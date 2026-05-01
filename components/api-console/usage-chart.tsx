"use client";

import { useMemo } from "react";

type ChartDataPoint = {
	date: string;
	amount: number;
	tokens: number;
};

function formatDate(d: string) {
	const date = new Date(d);
	return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function SVGChart({
	entries,
	valueKey,
	color,
	label,
}: {
	entries: [string, { reqs: number; spend: number; tokens: number }][];
	valueKey: "reqs" | "spend" | "tokens";
	color: string;
	label: string;
}) {
	const maxVal = Math.max(...entries.map(([, v]) => v[valueKey]), 1);

	const w = Math.max(entries.length * 56 + 40, 400);
	const h = 180;
	const padX = 40;
	const padY = 20;
	const chartW = w - padX * 2;
	const chartH = h - padY * 2;

	const barWidth = Math.min(20, chartW / entries.length - 4);

	return (
		<div style={{ overflowX: "auto" }}>
			<svg
				width={w}
				height={h + 30}
				viewBox={`0 0 ${w} ${h + 30}`}
				role="img"
				aria-label={label}
			>
				{/* Grid lines */}
				{[0, 0.25, 0.5, 0.75, 1].map((pct) => {
					const y = padY + (1 - pct) * chartH;
					const val = maxVal * pct;
					return (
						<g key={pct}>
							<line
								x1={padX}
								y1={y}
								x2={w - padX}
								y2={y}
								stroke="#1a1a1a"
								strokeWidth={1}
							/>
							<text
								x={padX - 6}
								y={y + 3}
								fontSize={9}
								fill="#444"
								textAnchor="end"
							>
								{valueKey === "spend"
									? `$${val.toFixed(2)}`
									: val >= 1000
										? `${(val / 1000).toFixed(0)}K`
										: Math.round(val)}
							</text>
						</g>
					);
				})}

				{/* Bars */}
				{entries.map(([day, v], i) => {
					const x = padX + (i / Math.max(entries.length - 1, 1)) * chartW;
					const barH = (v[valueKey] / maxVal) * chartH;
					return (
						<rect
							key={`bar-${day}`}
							x={x - barWidth / 2}
							y={padY + chartH - barH}
							width={barWidth}
							height={barH}
							rx={3}
							fill={color}
							opacity={0.6}
						/>
					);
				})}

				{/* Line */}
				{entries.length > 1 && (
					<path
						d={`M ${entries
							.map(([, v], i) => {
								const x = padX + (i / Math.max(entries.length - 1, 1)) * chartW;
								const y = padY + (1 - v[valueKey] / maxVal) * chartH;
								return `${x},${y}`;
							})
							.join(" L ")}`}
						fill="none"
						stroke={color}
						strokeWidth={2}
						strokeLinecap="round"
						strokeLinejoin="round"
						opacity={0.8}
					/>
				)}

				{/* Dots */}
				{entries.map(([day, v], i) => {
					const x = padX + (i / Math.max(entries.length - 1, 1)) * chartW;
					const y = padY + (1 - v[valueKey] / maxVal) * chartH;
					return (
						<circle key={`dot-${day}`} cx={x} cy={y} r={3.5} fill={color} />
					);
				})}

				{/* Date Labels */}
				{entries.map(([day], i) => {
					const x = padX + (i / Math.max(entries.length - 1, 1)) * chartW;
					return (
						<text
							key={`label-${day}`}
							x={x}
							y={h + 16}
							fontSize={9}
							fill="#444"
							textAnchor="middle"
						>
							{formatDate(day)}
						</text>
					);
				})}
			</svg>
		</div>
	);
}

export function UsageChart({ data }: { data: string }) {
	const points: ChartDataPoint[] = useMemo(() => {
		try {
			return JSON.parse(data);
		} catch {
			return [];
		}
	}, [data]);

	if (!points.length) {
		return (
			<div
				className="apic-card"
				style={{ textAlign: "center", padding: 40, color: "#555" }}
			>
				No usage data yet. Start making API requests to see your charts.
			</div>
		);
	}

	const daily = new Map<
		string,
		{ reqs: number; spend: number; tokens: number }
	>();
	for (const p of points) {
		const day = new Date(p.date).toISOString().slice(0, 10);
		const prev = daily.get(day) || { reqs: 0, spend: 0, tokens: 0 };
		daily.set(day, {
			reqs: prev.reqs + 1,
			spend: prev.spend + p.amount / 100,
			tokens: prev.tokens + p.tokens,
		});
	}

	const entries = Array.from(daily.entries())
		.sort((a, b) => a[0].localeCompare(b[0]))
		.slice(-14);

	if (!entries.length) {
		return (
			<div
				className="apic-card"
				style={{ textAlign: "center", padding: 40, color: "#555" }}
			>
				No usage data to chart.
			</div>
		);
	}

	return (
		<div className="apic-grid apic-grid--2">
			{/* Requests & Tokens chart */}
			<div className="apic-card">
				<div className="apic-row apic-row--between" style={{ marginBottom: 8 }}>
					<div>
						<div className="apic-h3">Requests & Tokens</div>
						<p
							style={{
								fontSize: 11,
								color: "#555",
								margin: "2px 0 0",
							}}
						>
							Daily activity over time
						</p>
					</div>
				</div>
				<div
					className="apic-row apic-row--8"
					style={{ fontSize: 11, color: "#555", marginBottom: 8 }}
				>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<span
							style={{
								width: 8,
								height: 8,
								background: "#4ade80",
								display: "inline-block",
								borderRadius: 2,
							}}
						/>
						Requests
					</span>
					<span
						style={{
							display: "inline-flex",
							alignItems: "center",
							gap: 4,
						}}
					>
						<span
							style={{
								width: 8,
								height: 8,
								background: "#38bdf8",
								display: "inline-block",
								borderRadius: 2,
							}}
						/>
						Tokens
					</span>
				</div>
				<SVGChart
					entries={entries}
					valueKey="reqs"
					color="#4ade80"
					label="Requests over time"
				/>
			</div>

			{/* Daily Spend chart */}
			<div className="apic-card">
				<div className="apic-row apic-row--between" style={{ marginBottom: 8 }}>
					<div>
						<div className="apic-h3">Daily Spend</div>
						<p
							style={{
								fontSize: 11,
								color: "#555",
								margin: "2px 0 0",
							}}
						>
							Cost breakdown by day
						</p>
					</div>
				</div>
				<SVGChart
					entries={entries}
					valueKey="spend"
					color="#a78bfa"
					label="Daily spend chart"
				/>
			</div>
		</div>
	);
}
