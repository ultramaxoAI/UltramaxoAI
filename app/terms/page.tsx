import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const sections = [
	{
		title: "1. Scope of service",
		body: [
			"Ultramaxo is an AI product suite that may include chat, workspace and artifact tools, document and code generation, file handling, API Console features, billing and credit systems, premium account features, and related admin or support functions.",
			"By accessing or using Ultramaxo, you agree to these Terms. If you do not agree, do not use the service.",
		],
	},
	{
		title: "2. Accounts and access",
		body: [
			"You are responsible for your account, login credentials, connected provider keys, and any activity that happens under your account. You must provide accurate information and keep your account secure.",
			"We may suspend, restrict, or terminate access if we believe an account is being used unlawfully, abusively, fraudulently, or in a way that threatens the platform, its users, or third-party providers.",
		],
	},
	{
		title: "3. Acceptable use",
		body: [
			"You may not use Ultramaxo to break the law, violate third-party rights, abuse infrastructure, interfere with other users, attempt unauthorized access, evade product limits, resell access without permission, or use the service in a way that creates material security, fraud, spam, or operational risk.",
			"You are also responsible for how you use generated outputs, uploaded files, shared links, API keys, and any code or content produced through the service.",
		],
	},
	{
		title: "4. AI outputs, workspaces, and generated content",
		body: [
			"AI outputs may be incomplete, inaccurate, unsafe, or unsuitable for your use case. You are responsible for reviewing, testing, and validating any output before relying on it, publishing it, deploying it, or using it in business, technical, legal, medical, financial, or security-sensitive contexts.",
			"This also applies to workspace actions, code generation, document generation, agent flows, and any suggested commands or file changes.",
		],
	},
	{
		title: "5. BYOK and third-party providers",
		body: [
			"If you connect your own API keys or use model providers through Ultramaxo, you remain responsible for those credentials, the related provider costs, and your compliance with each provider's terms.",
			"We are not responsible for outages, policy enforcement, billing changes, rate limits, or output behavior caused by third-party model or infrastructure providers.",
		],
	},
	{
		title: "6. API Console, keys, and platform limits",
		body: [
			"If you use the API Console, you are responsible for all activity performed using your issued API keys. Keep keys private and rotate or revoke them if compromised.",
			"We may enforce rate limits, usage caps, balance minimums, abuse controls, key revocation, and other operational protections at any time to keep the platform stable and secure.",
		],
	},
	{
		title: "7. Credits, premium access, and billing",
		body: [
			"Ultramaxo may offer prepaid credits, premium access, vouchers, top-ups, or other paid features. Pricing, included limits, and available features may change over time.",
			"Unless we explicitly state otherwise, purchases, top-ups, partial periods, consumed credits, and already-granted digital access are non-refundable. You are responsible for reviewing billing details before payment.",
		],
	},
	{
		title: "8. Shared content and public links",
		body: [
			"If you enable sharing for a chat, document, or artifact, anyone with the link may be able to access that content depending on how the feature is configured. Do not share sensitive information unless you accept that risk.",
			"You are responsible for the content you publish or share through the platform.",
		],
	},
	{
		title: "9. Intellectual property",
		body: [
			"The Ultramaxo product, interface, branding, and service logic remain our property unless stated otherwise. Your own input content remains yours to the extent allowed by law and third-party provider terms.",
			"We do not guarantee that generated output is unique, non-infringing, or free from third-party claims.",
		],
	},
	{
		title: "10. Availability and changes",
		body: [
			"We may change, pause, restrict, or discontinue any part of Ultramaxo at any time, including models, tools, plans, limits, integrations, pricing, and product behavior.",
			"We do not guarantee uninterrupted availability, permanent feature continuity, or compatibility with every workflow, browser, provider, or deployment environment.",
		],
	},
	{
		title: "11. Disclaimers",
		body: [
			"Ultramaxo is provided on an 'as is' and 'as available' basis. To the maximum extent allowed by law, we disclaim warranties of accuracy, merchantability, fitness for a particular purpose, non-infringement, and uninterrupted operation.",
			"We do not guarantee that the service will always be secure, error-free, or suitable for any specific technical, commercial, or legal objective.",
		],
	},
	{
		title: "12. Limitation of liability",
		body: [
			"To the maximum extent allowed by law, we are not liable for indirect, incidental, special, consequential, exemplary, or lost-profit damages, or for losses arising from AI outputs, user decisions, third-party providers, outages, billing disputes, data exposure caused by your own sharing or key handling, or misuse of generated code or content.",
			"If liability cannot be excluded entirely, our aggregate liability will be limited to the amount you paid us for the relevant service in the period directly preceding the claim.",
		],
	},
	{
		title: "13. Termination",
		body: [
			"You may stop using Ultramaxo at any time. We may suspend or terminate your access if needed for legal, operational, abuse, fraud, non-payment, or security reasons.",
			"Sections that reasonably should survive termination, including billing, intellectual property, disclaimers, liability limits, and dispute-related provisions, will continue to apply.",
		],
	},
	{
		title: "14. Changes to these terms",
		body: [
			"We may update these Terms from time to time. Continued use of Ultramaxo after changes take effect means you accept the updated Terms.",
		],
	},
];

export default function TermsPage() {
	return (
		<div className="relative flex min-h-screen flex-col overflow-hidden bg-[#050505] font-body text-white selection:bg-white/20">
			<nav className="fixed top-0 right-0 left-0 z-50 border-white/5 border-b bg-[#050505]/80 p-6 backdrop-blur-md">
				<div className="mx-auto w-full max-w-4xl">
					<Link
						className="inline-flex w-fit items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-white/60 transition-colors hover:text-white"
						href="/"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="text-sm font-medium">Back to Home</span>
					</Link>
				</div>
			</nav>

			<main className="relative z-10 mx-auto mb-20 mt-32 flex-1 w-full max-w-3xl p-6">
				<h1 className="mb-4 text-4xl font-heading italic tracking-tight md:text-5xl">
					Terms of Service
				</h1>
				<p className="mb-4 text-sm text-white/40">Last updated: May 2026</p>
				<p className="mb-12 max-w-2xl text-sm leading-7 text-white/55">
					These terms explain the rules for using Ultramaxo, including chat,
					workspace, API Console, billing, premium features, third-party model
					providers, and generated output.
				</p>

				<div className="space-y-8 leading-relaxed text-white/70">
					{sections.map((section) => (
						<section key={section.title}>
							<h2 className="mb-4 text-xl font-semibold text-white">
								{section.title}
							</h2>
							<div className="space-y-4">
								{section.body.map((paragraph) => (
									<p key={paragraph}>{paragraph}</p>
								))}
							</div>
						</section>
					))}
				</div>
			</main>
		</div>
	);
}
