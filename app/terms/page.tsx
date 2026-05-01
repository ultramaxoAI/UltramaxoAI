import { ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 font-body flex flex-col relative overflow-hidden">
			<nav className="fixed top-0 left-0 right-0 p-6 z-50 bg-[#050505]/80 backdrop-blur-md border-b border-white/5">
				<div className="max-w-4xl mx-auto w-full">
					<Link
						href="/"
						className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-white/5 px-4 py-2 rounded-full border border-white/10 w-fit"
					>
						<ArrowLeft className="w-4 h-4" />
						<span className="text-sm font-medium">Back to Home</span>
					</Link>
				</div>
			</nav>
			<main className="flex-1 w-full max-w-3xl mx-auto p-6 relative z-10 mt-32 mb-20">
				<h1 className="text-4xl md:text-5xl font-heading italic tracking-tight mb-4">
					Terms of Service
				</h1>
				<p className="text-white/40 text-sm mb-12">Last updated: April 2026</p>

				<div className="space-y-8 text-white/70 leading-relaxed">
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							1. Acceptance of Terms
						</h2>
						<p>
							By accessing or using the Ultramaxo AI platform, you agree to be
							bound by these Terms of Service. If you disagree with any part of
							the terms, you do not have permission to access the service.
						</p>
					</section>
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							2. Acceptable Use
						</h2>
						<p>
							You agree not to use the service to generate malicious code, spam,
							or abusive content. We reserve the right to terminate accounts
							that violate our usage policies.
						</p>
					</section>
					<section>
						<h2 className="text-xl text-white font-semibold mb-4">
							3. Subscription and Billing
						</h2>
						<p>
							Pro tier subscriptions are billed on a recurring basis. You may
							cancel your subscription at any time, but we do not provide
							refunds for partial billing periods.
						</p>
					</section>
				</div>
			</main>
		</div>
	);
}
