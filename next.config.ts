import withSerwistInit from "@serwist/next";
import type { NextConfig } from "next";

const withSerwist = withSerwistInit({
	swSrc: "app/sw.ts",
	swDest: "public/sw.js",
	disable: process.env.NODE_ENV === "development",
});

const nextConfig: NextConfig = {
	// Disable cacheComponents to allow dynamic route segments
	cacheComponents: false,
	// Cross-Origin headers required by WebContainers API
	async headers() {
		return [
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
				hostname: "ui-avatars.com",
			},
			{
				protocol: "https",
				//https://nextjs.org/docs/messages/next-image-unconfigured-host
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
};

export default withSerwist(nextConfig);

// Restart trigger
