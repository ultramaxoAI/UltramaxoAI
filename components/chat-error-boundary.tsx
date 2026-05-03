"use client";

import type { ErrorInfo, ReactNode } from "react";
import { Component } from "react";

type ChatErrorBoundaryProps = {
	children: ReactNode;
};

type ChatErrorBoundaryState = {
	hasError: boolean;
	error: Error | null;
};

export class ChatErrorBoundary extends Component<
	ChatErrorBoundaryProps,
	ChatErrorBoundaryState
> {
	state: ChatErrorBoundaryState = { hasError: false, error: null };

	static getDerivedStateFromError(error: Error): ChatErrorBoundaryState {
		return { hasError: true, error };
	}

	componentDidCatch(error: Error, info: ErrorInfo) {
		console.error("Chat crashed:", error, info);
	}

	render() {
		if (this.state.hasError) {
			return (
				<div className="flex h-full flex-col items-center justify-center gap-3 px-8 text-center">
					<div className="text-[14px] text-white/35">
						Terjadi kesalahan saat menampilkan respons.
					</div>
					<button
						className="rounded-xl border border-white/[0.08] px-4 py-2 text-[13px] text-white/45 transition-colors hover:border-white/[0.15] hover:text-white/70"
						onClick={() => this.setState({ hasError: false, error: null })}
						type="button"
					>
						Coba lagi
					</button>
					{process.env.NODE_ENV === "development" ? (
						<pre className="mt-2 max-w-md overflow-auto text-left text-[10px] text-red-400/50">
							{this.state.error?.message}
						</pre>
					) : null}
				</div>
			);
		}

		return this.props.children;
	}
}
