import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
	swSrc: "app/sw.ts",
	swDest: "public/sw.js",
	disable: true,
});

const nextConfig: NextConfig = {
	// ── Production: strip ALL console.* from client & server bundles ──
	compiler: {
		removeConsole: process.env.NODE_ENV === "production",
	},
	// Disable cacheComponents to allow dynamic route segments
	cacheComponents: false,
	// Cross-Origin headers required by WebContainers API
	async headers() {
		return [
			{
				source: "/api/chat",
				headers: [
					{
						key: "X-Accel-Buffering",
						value: "no",
					},
					{
						key: "Cache-Control",
						value: "no-cache",
					},
				],
			},
			{
				source: "/(.*)",
				headers: [
					{
						key: "X-Content-Type-Options",
						value: "nosniff",
					},
					{
						key: "X-Frame-Options",
						value: "SAMEORIGIN",
					},
					{
						key: "Referrer-Policy",
						value: "strict-origin-when-cross-origin",
					},
					{
						key: "Strict-Transport-Security",
						value: "max-age=63072000; includeSubDomains; preload",
					},
					{
						key: "Permissions-Policy",
						value: "camera=(), microphone=(), geolocation=()",
					},
					{
						key: "Content-Security-Policy",
						value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://cdn.jsdelivr.net; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; img-src 'self' data: blob: https:; font-src 'self' https://fonts.gstatic.com https://fonts.googleapis.com https://cdn.jsdelivr.net; connect-src 'self' https://ai.sumopod.com https://api.maiarouter.ai https://api.swiftrouter.com https://*.ultramaxo.tech https://*.vercel-storage.com https://cdn.jsdelivr.net; frame-ancestors 'self'; base-uri 'self'; form-action 'self';",
					},
				],
			},
			{
				// Apply COOP/COEP only to chat routes where WebContainers are used
				source: "/chat/:path*",
				headers: [
					{
						key: "Cross-Origin-Embedder-Policy",
						value: "require-corp",
					},
					{
						key: "Cross-Origin-Opener-Policy",
						value: "same-origin",
					},
				],
			},
		];
	},
	images: {
		remotePatterns: [
			{
				hostname: "avatar.vercel.sh",
			},
			{
				protocol: "https",
				hostname: "models.dev",
			},
			{
				hostname: "ui-avatars.com",
			},
			{
				protocol: "https",
				//https://nextjs.org/docs/messages/next-image-unconfigured-host
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
	turbopack: {},
};

export default withSerwist(nextConfig);

// Restart trigger
