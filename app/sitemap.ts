import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	return [
		// ═══ Core Pages ═══
		{
			url: "https://ultramaxo.tech",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 1,
		},
		{
			url: "https://ultramaxo.tech/plan",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.9,
		},

		// ═══ Public Pages ═══
		{
			url: "https://ultramaxo.tech/about",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.7,
		},
		{
			url: "https://ultramaxo.tech/blog",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.7,
		},
		{
			url: "https://ultramaxo.tech/careers",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.6,
		},
		{
			url: "https://ultramaxo.tech/contact",
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.6,
		},
		{
			url: "https://ultramaxo.tech/security",
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.6,
		},

		// ═══ Legal Pages ═══
		{
			url: "https://ultramaxo.tech/privacy",
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.5,
		},
		{
			url: "https://ultramaxo.tech/terms",
			lastModified: now,
			changeFrequency: "yearly",
			priority: 0.5,
		},

		// ═══ Documentation (same domain) ═══
		{
			url: "https://ultramaxo.tech/docs",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},
		{
			url: "https://ultramaxo.tech/docs/authentication",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://ultramaxo.tech/docs/chat-completions",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.85,
		},
		{
			url: "https://ultramaxo.tech/docs/models",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.8,
		},
		{
			url: "https://ultramaxo.tech/docs/sdks",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.75,
		},
		{
			url: "https://ultramaxo.tech/docs/billing",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.75,
		},
		{
			url: "https://ultramaxo.tech/docs/errors",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.7,
		},
	];
}
