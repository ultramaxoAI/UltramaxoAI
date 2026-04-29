import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
	return {
		rules: [
			{
				userAgent: "*",
				allow: "/",
				disallow: [
					"/api/",
					"/admin/",
					"/settings/",
					"/chat/",
					"/payment/",
					"/redeem/",
					"/maintenance/",
					"/oauth/",
					"/api-console",
					"/api-console/keys",
					"/api-console/billing",
					"/api-console/playground",
					"/api-console/pay",
				],
			},
			{
				userAgent: "Googlebot",
				allow: [
					"/",
					"/docs",
					"/docs/",
					"/models",
					"/pricing",
				],
				disallow: [
					"/api/",
					"/chat/",
					"/api-console",
					"/api-console/keys",
					"/api-console/billing",
					"/api-console/playground",
					"/api-console/pay",
				],
			},
		],
		sitemap: [
			"https://ultramaxo.tech/sitemap.xml",
			"https://app.ultramaxo.tech/sitemap.xml",
		],
	};
}
