import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	// Disable cacheComponents to allow dynamic route segments
	cacheComponents: false,
	images: {
		remotePatterns: [
			{
				hostname: "avatar.vercel.sh",
			},
			{
				protocol: "https",
				//https://nextjs.org/docs/messages/next-image-unconfigured-host
				hostname: "*.public.blob.vercel-storage.com",
			},
		],
	},
};

export default nextConfig;

// Restart trigger
