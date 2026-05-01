"use client";

export function MainContentWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_32%),linear-gradient(180deg,#0b0d10_0%,#111316_42%,#121417_100%)] text-foreground dark:bg-[radial-gradient(circle_at_top,rgba(255,255,255,0.045),transparent_32%),linear-gradient(180deg,#0b0d10_0%,#111316_42%,#121417_100%)]">
			<div className="pointer-events-none absolute inset-0 bg-[linear-gradient(180deg,rgba(255,255,255,0.02),transparent_18%,transparent_82%,rgba(255,255,255,0.015))]" />
			{children}
		</div>
	);
}
