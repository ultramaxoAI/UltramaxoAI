export function JsonLd() {
	const siteUrl = "https://ultramaxo.tech";

	const websiteStructuredData = {
		"@context": "https://schema.org",
		"@type": "WebSite",
		name: "UltramaxoAI",
		alternateName: ["Ultramaxo", "Ultramaxo Tech"],
		url: siteUrl,
		description: "The Uncensored AI Workspace for chat, coding, and documents.",
	};

	const organizationStructuredData = {
		"@context": "https://schema.org",
		"@type": "Organization",
		name: "Ultramaxo",
		url: siteUrl,
		logo: `${siteUrl}/favicon.svg`,
		sameAs: ["https://t.me/+CQR8SWdH5nE2OTdk"],
	};

	const softwareStructuredData = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "UltramaxoAI",
		operatingSystem: "Any",
		applicationCategory: "UtilityApplication",
		description:
			"UltramaxoAI is a multimodal AI workspace for chat, coding, and file analysis.",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "IDR",
		},
	};

	const faqStructuredData = {
		"@context": "https://schema.org",
		"@type": "FAQPage",
		mainEntity: [
			{
				"@type": "Question",
				name: "What makes Ultramaxo different from a normal AI chat app?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "The product is designed as a workspace. Chat, artifacts, code, uploads, and iteration all stay inside one shell instead of being split across disposable messages.",
				},
			},
			{
				"@type": "Question",
				name: "Can I start for free?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "Yes. The free plan is intended for real product evaluation with chat, basic workspace tools, and limited history. You can move up only when your workload grows.",
				},
			},
			{
				"@type": "Question",
				name: "What can I actually do inside the workspace?",
				acceptedAnswer: {
					"@type": "Answer",
					text: "You can chat, upload files, open code or document artifacts, use fullstack or mobile modes, switch models, export chats, and install the app as a PWA for a more native workflow.",
				},
			},
		],
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(websiteStructuredData),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(organizationStructuredData),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{
					__html: JSON.stringify(softwareStructuredData),
				}}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(faqStructuredData) }}
			/>
		</>
	);
}
