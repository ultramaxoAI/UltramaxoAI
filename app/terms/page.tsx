import { ArrowLeft, Bot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleTranslate } from "@/components/google-translate";

export const metadata: Metadata = {
	title: "Terms & Conditions — Ultramaxo AI",
	description:
		"Terms and conditions for using Ultramaxo AI — rules and guidelines for service usage.",
};

export default function TermsPage() {
	return (
		<div className="min-h-screen bg-background text-foreground transition-colors duration-500 ease-in-out">
			{/* Header */}
			<header className="sticky top-0 z-50 w-full border-b border-border bg-background/90 backdrop-blur-md shadow-sm">
				<div className="max-w-4xl mx-auto flex items-center justify-between px-6 py-3">
					<Link className="flex items-center gap-2" href="/">
						<div className="w-8 h-8 rounded-lg bg-zinc-900 dark:bg-white flex items-center justify-center">
							<Bot className="w-4 h-4 text-white dark:text-zinc-900" />
						</div>
						<span className="text-base font-bold text-foreground">
							Ultramaxo AI
						</span>
					</Link>
                    <div className="flex items-center gap-4">
                        <GoogleTranslate />
                        <ThemeToggle />
                        <Link
                            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors"
                            href="/"
                        >
                            <ArrowLeft className="w-4 h-4" />
                            Back
                        </Link>
                    </div>
				</div>
			</header>

			{/* Content */}
			<main className="max-w-4xl mx-auto px-6 py-12 sm:py-20">
				<div className="mb-12">
					<h1 className="text-3xl sm:text-4xl font-bold text-foreground mb-3">
						Terms & Conditions
					</h1>
					<p className="text-muted-foreground text-sm">
						Last updated: February 15, 2025
					</p>
				</div>

				<div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							1. Acceptance of Terms
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							By accessing or using Ultramaxo AI
							(&quot;Service&quot;) available at{" "}
							<strong>ultramaxo.tech</strong>, you agree to be bound
							by these Terms and Conditions. If you do not agree to
							these terms, please do not use our service.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							2. Description of Service
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							Ultramaxo AI is an artificial intelligence platform providing
							access to various AI models for writing, programming,
							analysis, and general conversation. Our services are available in
							Free and Pro plans with different features and limitations.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							3. User Accounts
						</h2>
						
						<p className="text-foreground/80 leading-relaxed">
							To use this service, you must create an account by providing
							accurate and complete information. You are responsible
							for maintaining the confidentiality of your account credentials.
						</p>

						<p className="text-foreground/80 leading-relaxed mt-4">
							To use full features safely, we recommend verifying your email address. 
							You are fully responsible for all activities that occur under
							your account. Immediately report to us if there is unauthorized
							access to your account.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							4. Service Plans
						</h2>
						<h3 className="text-lg font-semibold text-foreground/90 mb-2">
							4.1 Free Plan
						</h3>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1">
							<li>
								Access to smart AI models (UltraAgent)
							</li>
							<li>Limit of 10 chats per day (resets every 24 hours)</li>
							<li>Chat history saved for 7 days</li>
							<li>File upload up to 5MB</li>
						</ul>

						<h3 className="text-lg font-semibold text-foreground/90 mb-2 mt-4">
							4.2 Pro Plan
						</h3>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1">
							<li>Priority access to both AI models</li>
							<li>Unlimited chat</li>
							<li>Unlimited chat history</li>
							<li>File upload up to 100MB</li>
							<li>Priority support</li>
							<li>API Access</li>
						</ul>

						<h3 className="text-lg font-semibold text-foreground/90 mb-2 mt-4">
							4.3 Payment
						</h3>
						<p className="text-foreground/80 leading-relaxed">
							The Pro plan is activated via a voucher code system (redeem code).
							The price of the Pro plan is Rp 20.000/month. Payments are
							non-refundable unless specified otherwise.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							5. Acceptable Use
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							You agree to use our service only for lawful purposes.
							You are <strong>prohibited</strong> from:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>
								Using the service for illegal or unlawful activities
							</li>
							<li>
								Attempting to exploit, hack, or damage our infrastructure
							</li>
							<li>
								Using bots or automated scripts to excessively access the service
							</li>
							<li>
								Creating content that contains hate speech, violence, or
								adult content
							</li>
							<li>Sharing accounts or credentials with third parties</li>
							<li>
								Reverse-engineering or copying our service
							</li>
							<li>Using the service for spam or phishing</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							6. AI-Generated Content
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							Responses generated by AI models are provided &quot;as-is&quot;.
							We do not guarantee the accuracy, completeness, or reliability
							of the generated content. You are responsible for
							verifying the information received before using it.
						</p>
						<p className="text-foreground/80 leading-relaxed mt-2">
							Ultramaxo AI is not liable for decisions made based
							on AI output, including but not limited to business,
							medical, legal, or financial decisions.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							7. Intellectual Property Rights
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							The Ultramaxo AI platform, including design, code, logos, and
							original content, is our property and protected by copyright
							laws. The content you generate through interaction with the AI
							becomes yours, provided that we retain the right to anonymously
							use it to improve our services.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							8. Limitation of Liability
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							To the extent permitted by law, Ultramaxo AI is not liable for:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>
								Direct or indirect damages arising from the use of the service
							</li>
							<li>Service interruptions, downtime, or data loss</li>
							<li>Actions of third parties including AI model providers</li>
							<li>Content generated by AI models</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							9. Termination of Service
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We reserve the right to suspend or terminate your account without
							prior notice if you violate these Terms and Conditions.
							You can also delete your account at any time through
							account settings or by contacting us.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							10. Service Availability
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We strive to maintain 99.9% service availability, but we do not
							guarantee the service will be available without interruption. Scheduled
							maintenance will be communicated in advance if possible.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							11. Changes to Terms
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We may update these Terms and Conditions at any time.
							Significant changes will be communicated via email or
							platform notifications. Continued use after changes
							implies your consent.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							12. Governing Law
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							These Terms and Conditions are governed by and construed in
							accordance with the applicable laws of the Republic of Indonesia.
							Any disputes arising will be resolved through deliberation first.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							13. Contact Us
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							If you have any questions regarding these Terms and Conditions,
							please contact us at:
						</p>
						<div className="mt-3 p-4 bg-muted border border-border rounded-xl">
							<p className="text-foreground font-semibold">Ultramaxo AI</p>
							<p className="text-muted-foreground text-sm mt-1">
								Email: admin@ultramaxo.tech
							</p>
							<p className="text-muted-foreground text-sm">Website: ultramaxo.tech</p>
						</div>
					</section>
				</div>
			</main>

			{/* Footer */}
			<footer className="border-t border-border bg-background py-6">
				<div className="max-w-4xl mx-auto px-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
					<p className="text-muted-foreground text-sm">
						© 2025 Ultramaxo AI. All rights reserved.
					</p>
					<div className="flex gap-4 text-sm">
						<Link
							className="text-muted-foreground hover:text-foreground transition-colors"
							href="/privacy"
						>
							Privacy Policy
						</Link>
						<Link
							className="text-muted-foreground hover:text-foreground transition-colors"
							href="/"
						>
							Home
						</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
