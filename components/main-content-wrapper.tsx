"use client";

export function MainContentWrapper({
	children,
}: {
	children: React.ReactNode;
}) {
	return (
		<div className="flex-1 flex flex-col min-h-screen relative">{children}</div>
	);
}
