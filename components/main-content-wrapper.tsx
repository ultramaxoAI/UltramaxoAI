"use client";

export function MainContentWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="relative flex min-h-dvh min-w-0 flex-1 flex-col overflow-hidden">
			{children}
		</div>
	);
}
