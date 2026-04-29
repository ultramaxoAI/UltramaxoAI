import type { MetadataRoute } from "next";

export default function sitemap(): MetadataRoute.Sitemap {
	const now = new Date();

	return [
		// ═══ Main Domain (ultramaxo.tech) ═══
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
		{
			url: "https://ultramaxo.tech/login",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://ultramaxo.tech/register",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://ultramaxo.tech/about",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.6,
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

		// ═══ App Subdomain (app.ultramaxo.tech) — API Console ═══
		{
			url: "https://app.ultramaxo.tech",
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: "https://app.ultramaxo.tech/models",
			lastModified: now,
			changeFrequency: "daily",
			priority: 0.9,
		},
		{
			url: "https://app.ultramaxo.tech/pricing",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.9,
		},

		// ═══ App Subdomain — API Documentation ═══
		{
			url: "https://app.ultramaxo.tech/docs",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.95,
		},
		{
			url: "https://app.ultramaxo.tech/docs/authentication",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.85,
		},
		{
			url: "https://app.ultramaxo.tech/docs/chat-completions",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.9,
		},
		{
			url: "https://app.ultramaxo.tech/docs/models",
			lastModified: now,
			changeFrequency: "weekly",
			priority: 0.85,
		},
		{
			url: "https://app.ultramaxo.tech/docs/sdks",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://app.ultramaxo.tech/docs/billing",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.8,
		},
		{
			url: "https://app.ultramaxo.tech/docs/errors",
			lastModified: now,
			changeFrequency: "monthly",
			priority: 0.75,
		},
	];
}
