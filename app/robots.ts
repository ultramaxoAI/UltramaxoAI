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
					"/login",
					"/register",
					"/forgot-password",
					"/reset-password",
					"/verify",
					"/share/",
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
					"/about",
					"/blog",
					"/careers",
					"/contact",
					"/security",
					"/privacy",
					"/terms",
					"/plan",
					"/docs",
					"/docs/",
				],
				disallow: [
					"/api/",
					"/admin/",
					"/chat/",
					"/login",
					"/register",
					"/settings/",
					"/payment/",
					"/oauth/",
					"/share/",
					"/api-console/keys",
					"/api-console/billing",
					"/api-console/playground",
					"/api-console/pay",
				],
			},
		],
		sitemap: "https://ultramaxo.tech/sitemap.xml",
	};
}
