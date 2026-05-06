import { ArrowLeft } from "lucide-react";
import Link from "next/link";

const sections = [
	{
		title: "1. What we collect",
		body: [
			"Ultramaxo collects the information needed to operate the product, including account details, chat and workspace content, uploaded files, generated artifacts, API Console activity, billing records, and basic technical data such as IP address, browser, device, and request logs.",
			"We may also collect product analytics, usage events, and support-related information when you contact us or interact with onboarding, payments, or account settings.",
		],
	},
	{
		title: "2. Account, login, and profile data",
		body: [
			"When you create an account or sign in, we process information such as your email address, username, authentication identifiers, profile details, and account state. If you upload a profile image, that file may be stored through our storage providers.",
			"We use authentication and session data to keep your account secure, keep you signed in, and manage account-level features such as chat access, API Console access, admin permissions, and subscription or credit status.",
		],
	},
	{
		title: "3. Chats, files, and workspaces",
		body: [
			"Content you send through Ultramaxo, including prompts, chat history, uploaded files, generated documents, code workspace changes, and shared artifacts, may be stored so the product can function, resume conversations, render artifacts, and support collaboration features.",
			"If you create or edit code, documents, or previews inside the workspace tools, related content and action metadata may be stored to keep the workspace usable and recoverable.",
		],
	},
	{
		title: "4. BYOK and model provider requests",
		body: [
			"If you use Bring Your Own Key (BYOK), your requests may be routed to the third-party model provider you connect, such as OpenAI, Anthropic, Google, Groq, OpenRouter, or other configured providers. Your use of those providers is also subject to their own terms and privacy practices.",
			"We do not intentionally display your private API keys in plain text inside the product. Where we store user-supplied keys for configured features, we store them using protected server-side handling and encryption mechanisms used by the application.",
		],
	},
	{
		title: "5. API Console and usage records",
		body: [
			"If you use the API Console, we store API key records, model usage data, rate-limit events, request metadata, balance and credit movements, and payment-related activity required to operate the platform, prevent abuse, and provide usage history.",
			"We may keep logs needed for reliability, fraud prevention, billing integrity, and security review. We do not promise that every request payload is retained forever, but operational metadata may be logged or stored as part of the service.",
		],
	},
	{
		title: "6. Payments and billing",
		body: [
			"If you purchase credits, top up balance, or buy premium access, payment-related information may be processed by third-party payment providers. We may store invoices, transaction IDs, payment status, and related billing metadata, but we do not store full card data ourselves.",
			"Billing records may be retained as needed for fraud prevention, dispute handling, bookkeeping, tax, and service operations.",
		],
	},
	{
		title: "7. How we use your data",
		body: [
			"We use collected information to operate Ultramaxo, deliver AI and workspace features, provide account access, process payments, secure the platform, investigate abuse, improve reliability, and communicate important updates.",
			"We may also use limited usage information to understand product performance, feature adoption, and operational issues. We do not state that your private chat or workspace content is used to train our own foundation models unless we clearly say so separately.",
		],
	},
	{
		title: "8. Sharing and third parties",
		body: [
			"We may share necessary data with infrastructure, authentication, analytics, storage, model, email, and payment providers that help us run the service. This can include hosting platforms, databases, blob storage, AI model gateways, payment processors, and email delivery services.",
			"We may also disclose information if required by law, to enforce our terms, to protect users or the service, or as part of a business transfer, restructuring, or asset sale.",
		],
	},
	{
		title: "9. Retention and deletion",
		body: [
			"We keep data for as long as reasonably necessary to operate the service, maintain account continuity, meet legal or accounting requirements, resolve disputes, and protect the platform from abuse.",
			"Some data may remain in backups, logs, billing records, or security records for a limited period even after you delete visible content from the product.",
		],
	},
	{
		title: "10. Security",
		body: [
			"We use reasonable technical and organizational measures to protect the service and the data we store. However, no online service can guarantee absolute security, and you use Ultramaxo at your own risk.",
			"You are responsible for protecting your own account, devices, API keys, and any third-party credentials you connect to the platform.",
		],
	},
	{
		title: "11. Your choices",
		body: [
			"You can manage certain account settings, delete chats or shared content, revoke API keys, and stop using the service at any time. Depending on how the platform evolves, some deletion or export options may be limited by operational, legal, or security constraints.",
			"If you need help with account, privacy, or deletion requests, contact us through the channels listed on the site.",
		],
	},
	{
		title: "12. Changes to this policy",
		body: [
			"We may update this Privacy Policy from time to time. Continued use of Ultramaxo after an update means you accept the revised policy.",
		],
	},
];

export default function PrivacyPage() {
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
					Privacy Policy
				</h1>
				<p className="mb-4 text-sm text-white/40">Last updated: May 2026</p>
				<p className="mb-12 max-w-2xl text-sm leading-7 text-white/55">
					This policy explains how Ultramaxo handles account data, chat and
					workspace content, API Console activity, billing records, connected
					model providers, and other information needed to run the platform.
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
