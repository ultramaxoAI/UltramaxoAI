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
								stroke="rgba(255,255,255,0.06)"
								strokeWidth={1}
							/>
							<text
								x={padX - 6}
								y={y + 3}
								fontSize={9}
								fill="rgba(255,255,255,0.28)"
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
							fill="rgba(255,255,255,0.28)"
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
			<div className="rounded-[24px] border border-white/8 bg-[#0f1318] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
				<div className="border-white/8 border-b pb-4">
					<h2 className="text-lg font-semibold tracking-[-0.03em] text-white">
						Usage insight
					</h2>
					<p className="mt-1 text-sm text-white/46">
						Request trend dan cost breakdown akan muncul setelah ada traffic.
					</p>
				</div>
				<div className="mt-5 rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-white/42">
					No usage data yet. Start making API requests to populate this view.
				</div>
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
			<div className="rounded-[24px] border border-white/8 bg-[#0f1318] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
				<div className="rounded-[18px] border border-dashed border-white/10 bg-white/[0.02] px-6 py-16 text-center text-sm text-white/42">
					No usage data to chart.
				</div>
			</div>
		);
	}

	return (
		<div className="rounded-[24px] border border-white/8 bg-[#0f1318] p-6 shadow-[0_18px_60px_rgba(0,0,0,0.2)]">
			<div className="border-white/8 border-b pb-4">
				<h2 className="text-lg font-semibold tracking-[-0.03em] text-white">
					Usage insight
				</h2>
				<p className="mt-1 text-sm text-white/46">
					Activity trend and spend behavior over the last 14 entries.
				</p>
			</div>
			<div className="mt-6 grid gap-6 xl:grid-cols-2">
				<div>
					<div className="mb-4 flex items-start justify-between gap-4">
						<div>
							<div className="text-sm font-medium text-white">
								Requests & Tokens
							</div>
							<p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/32">
								Daily activity
							</p>
						</div>
						<div className="rounded-full border border-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/46">
							Requests
						</div>
					</div>
					<div className="mb-3 flex flex-wrap items-center gap-3 text-xs text-white/42">
						<span className="inline-flex items-center gap-2">
							<span className="inline-block h-2 w-2 rounded-[3px] bg-emerald-400" />
							Requests
						</span>
						<span className="inline-flex items-center gap-2">
							<span className="inline-block h-2 w-2 rounded-[3px] bg-sky-400" />
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

				<div>
					<div className="mb-4 flex items-start justify-between gap-4">
						<div>
							<div className="text-sm font-medium text-white">Daily Spend</div>
							<p className="mt-1 text-xs uppercase tracking-[0.2em] text-white/32">
								Cost breakdown
							</p>
						</div>
						<div className="rounded-full border border-white/8 px-3 py-1 text-[10px] uppercase tracking-[0.2em] text-white/46">
							Spend
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
		</div>
	);
}
