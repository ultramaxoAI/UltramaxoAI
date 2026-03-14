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
		sameAs: [
			"https://t.me/+CQR8SWdH5nE2OTdk",
		],
	};

	const softwareStructuredData = {
		"@context": "https://schema.org",
		"@type": "SoftwareApplication",
		name: "UltramaxoAI",
		operatingSystem: "Any",
		applicationCategory: "UtilityApplication",
		description: "UltramaxoAI is a multimodal AI workspace for chat, coding, and file analysis.",
		offers: {
			"@type": "Offer",
			price: "0",
			priceCurrency: "IDR",
		},
	};

	return (
		<>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteStructuredData) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationStructuredData) }}
			/>
			<script
				type="application/ld+json"
				dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareStructuredData) }}
			/>
		</>
	);
}
