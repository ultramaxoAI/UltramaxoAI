import { ArrowLeft, Bot } from "lucide-react";
import type { Metadata } from "next";
import Link from "next/link";
import { ThemeToggle } from "@/components/theme-toggle";
import { GoogleTranslate } from "@/components/google-translate";

export const metadata: Metadata = {
	title: "Privacy Policy — Ultramaxo AI",
	description:
		"Ultramaxo AI Privacy Policy — learn how we protect your data and privacy.",
};

export default function PrivacyPage() {
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
						Privacy Policy
					</h1>
					<p className="text-muted-foreground text-sm">
						Last updated: February 15, 2025
					</p>
				</div>

				<div className="prose prose-slate dark:prose-invert max-w-none space-y-8">
					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							1. Introduction
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							Ultramaxo AI (&quot;we&quot;, &quot;our&quot;, or
							&quot;Service&quot;) is committed to protecting user data privacy
							and security. This Privacy Policy explains how we collect, use,
							store, and protect your personal information when using our
							platform at <strong>ultramaxo.tech</strong>.
						</p>
						<p className="text-foreground/80 leading-relaxed">
							By using the Ultramaxo AI service, you agree to the practices
							described in this Privacy Policy. If you do not agree with this
							policy, please discontinue use of our services.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							2. Information We Collect
						</h2>
						<h3 className="text-lg font-semibold text-foreground/90 mb-2">
							2.1 Account Information
						</h3>
						<p className="text-foreground/80 leading-relaxed">
							When you register, we collect:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>Email address</li>
							<li>Name (if provided via OAuth or profile)</li>
							<li>Authentication information (password hash or OAuth tokens)</li>
						</ul>

						<h3 className="text-lg font-semibold text-foreground/90 mb-2 mt-4">
							2.2 Usage Data
						</h3>
						<p className="text-foreground/80 leading-relaxed">
							We automatically collect:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>Conversation history with the AI</li>
							<li>AI models used</li>
							<li>Number of messages sent per day</li>
							<li>Device and browser information (User-Agent)</li>
							<li>IP address (for security and abuse prevention)</li>
						</ul>

						<h3 className="text-lg font-semibold text-foreground/90 mb-2 mt-4">
							2.3 Uploaded Files
						</h3>
						<p className="text-foreground/80 leading-relaxed">
							If you upload files as part of a conversation, they are
							processed to provide relevant AI responses. Files are automatically
							deleted after the conversation session ends unless explicitly
							saved by you.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							3. How We Use Your Information
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We use the collected information to:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>Provide and maintain the Ultramaxo AI service</li>
							<li>Authenticate your identity and manage your account</li>
							<li>Implement usage limits (daily chat quotas)</li>
							<li>Improve service quality and user experience</li>
							<li>
								Detect and prevent abuse or malicious activity
							</li>
							<li>
								Send service-related notifications (including email verification
								codes)
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							4. Data Storage and Security
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							Your data is stored on secure servers with industry-standard
							encryption. We employ the following security measures:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>Data encryption in transit (TLS/SSL)</li>
							<li>Password hashing using the bcrypt algorithm</li>
							<li>
								Role-based access control
							</li>
							<li>Regular security monitoring</li>
							<li>Rate limiting to prevent brute-force attacks</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							5. Sharing Data with Third Parties
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We <strong>do not sell</strong> your personal data to third
							parties. Your data is only shared in the following situations:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>
								<strong>AI Model Providers:</strong> Your messages are sent to
								third-party AI model providers (such as Google, Groq, etc.)
								to generate responses. Messages are processed in accordance with
								the privacy policies of the respective providers.
							</li>
							<li>
								<strong>Infrastructure Providers:</strong> We use
								third-party hosting and database services that comply with
								industry security standards.
							</li>
							<li>
								<strong>Legal Obligations:</strong> We may disclose data
								if required by law or a court order.
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							6. Your Rights
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							You have the right to:
						</p>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1 mt-2">
							<li>Access and download your personal data</li>
							<li>Update your account information</li>
							<li>Delete your account and all associated data</li>
							<li>Opt-out of promotional emails</li>
							<li>Restrict certain data processing</li>
						</ul>
						<p className="text-foreground/80 leading-relaxed mt-2">
							To exercise these rights, please contact us via
							email at <strong>admin@ultramaxo.tech</strong>.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							7. Cookies and Tracking Technologies
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We use necessary cookies for authentication security
							and user sessions. We do not use third-party tracking cookies or
							advertising tracking technologies.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							8. Data Retention
						</h2>
						<ul className="list-disc pl-6 text-foreground/80 space-y-1">
							<li>
								<strong>Free Plan:</strong> Chat history is stored for 7 days
							</li>
							<li>
								<strong>Pro Plan:</strong> Chat history is stored indefinitely
								while the account is active
							</li>
							<li>
								<strong>Account data:</strong> Stored as long as your account is active
							</li>
							<li>
								<strong>Upon account deletion:</strong> All data is deleted
								within 30 business days
							</li>
						</ul>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							9. Services for Minors
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							Ultramaxo AI is not intended for children under 13
							years of age. We do not knowingly collect data from children.
							If we find that data has been collected from a minor
							we will delete it immediately.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							10. Policy Changes
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							We may update this Privacy Policy from time to time.
							Significant changes will be notified via email or a
							notice on our platform. Continued use following
							the changes constitutes acceptance of the updated policy.
						</p>
					</section>

					<section>
						<h2 className="text-xl font-bold text-foreground mb-3">
							11. Contact Us
						</h2>
						<p className="text-foreground/80 leading-relaxed">
							If you have any questions regarding this Privacy Policy,
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
							href="/terms"
						>
							Terms of Service
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
