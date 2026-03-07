"use client";

import { useEffect } from "react";

const SESSION_POLL_ATTEMPTS = 20;
const SESSION_POLL_DELAY_MS = 300;
const FALLBACK_LOGIN_URL = "/login?error=OAuthCallback";

function resolveTargetUrl(rawTarget: string | null) {
	if (!rawTarget || typeof window === "undefined") {
		return window.location.hostname.endsWith("ultramaxo.tech")
			? "https://chat.ultramaxo.tech/chat"
			: `${window.location.origin}/chat`;
	}

	try {
		const targetUrl = new URL(rawTarget, window.location.origin);
		const isAllowedHost =
			targetUrl.hostname === "chat.ultramaxo.tech" ||
			targetUrl.hostname === "ultramaxo.tech" ||
			targetUrl.hostname === "www.ultramaxo.tech" ||
			targetUrl.hostname === "localhost";

		if (!isAllowedHost) {
			throw new Error("Unsupported redirect host");
		}

		return targetUrl.toString();
	} catch {
		return window.location.hostname.endsWith("ultramaxo.tech")
			? "https://chat.ultramaxo.tech/chat"
			: `${window.location.origin}/chat`;
	}
}

async function waitForSession() {
	for (let attempt = 0; attempt < SESSION_POLL_ATTEMPTS; attempt++) {
		try {
			const response = await fetch("/api/auth/session", {
				cache: "no-store",
				credentials: "include",
				headers: {
					"cache-control": "no-store",
				},
			});

			if (response.ok) {
				const session = await response.json();
				if (session?.user?.id) {
					return true;
				}
			}
		} catch {
			// Ignore transient auth propagation errors.
		}

		await new Promise((resolve) => {
			window.setTimeout(resolve, SESSION_POLL_DELAY_MS);
		});
	}

	return false;
}

export default function OAuthCompletePage() {
	useEffect(() => {
		const searchParams = new URLSearchParams(window.location.search);
		const targetUrl = resolveTargetUrl(searchParams.get("target"));

		void (async () => {
			const hasSession = await waitForSession();

			if (hasSession) {
				window.location.replace(targetUrl);
				return;
			}

			window.location.replace(FALLBACK_LOGIN_URL);
		})();
	}, []);

	return (
		<div className="flex min-h-screen items-center justify-center bg-black px-6 text-center text-white">
			<div className="space-y-3">
				<h1 className="text-xl font-semibold">Signing you in</h1>
				<p className="text-sm text-zinc-400">
					We are finalizing your session and redirecting you to the workspace.
				</p>
			</div>
		</div>
	);
}