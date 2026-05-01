"use client";

import { useRouter } from "next/navigation";
import { useEffect } from "react";

const REFRESH_INTERVAL_MS = 30_000;

export function DashboardAutoRefresh() {
	const router = useRouter();

	useEffect(() => {
		const refresh = () => router.refresh();

		const intervalId = window.setInterval(refresh, REFRESH_INTERVAL_MS);
		window.addEventListener("focus", refresh);

		const handleVisibilityChange = () => {
			if (document.visibilityState === "visible") {
				refresh();
			}
		};

		document.addEventListener("visibilitychange", handleVisibilityChange);

		return () => {
			window.clearInterval(intervalId);
			window.removeEventListener("focus", refresh);
			document.removeEventListener("visibilitychange", handleVisibilityChange);
		};
	}, [router]);

	return null;
}
