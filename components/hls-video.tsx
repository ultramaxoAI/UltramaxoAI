"use client";

import { useEffect, useRef } from "react";

interface HlsVideoProps {
	src: string;
	className?: string;
	style?: React.CSSProperties;
}

export function HlsVideo({ src, className = "", style }: HlsVideoProps) {
	const videoRef = useRef<HTMLVideoElement>(null);

	useEffect(() => {
		const video = videoRef.current;
		if (!video) return;

		let hls: any = null;

		const initHls = async () => {
			try {
				const HlsModule = (await import("hls.js")).default;

				if (HlsModule.isSupported()) {
					hls = new HlsModule({ enableWorker: true, lowLatencyMode: true });
					hls.loadSource(src);
					hls.attachMedia(video);
					hls.on(HlsModule.Events.MANIFEST_PARSED, () => {
						video.play().catch(() => {});
					});
				} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
					// Safari native HLS
					video.src = src;
					video.addEventListener("loadedmetadata", () => {
						video.play().catch(() => {});
					});
				}
			} catch {
				// Silently fail -- video is decorative, not critical
			}
		};

		initHls();

		return () => {
			if (hls) {
				try {
					hls.destroy();
				} catch {}
			}
		};
	}, [src]);

	return (
		<video
			ref={videoRef}
			className={className}
			style={style}
			autoPlay
			loop
			muted
			playsInline
		/>
	);
}
