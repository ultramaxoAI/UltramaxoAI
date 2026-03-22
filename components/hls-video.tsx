"use client";

import Hls from "hls.js";
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

		let hls: Hls | null = null;

		if (Hls.isSupported()) {
			hls = new Hls({ enableWorker: true, lowLatencyMode: true });
			hls.loadSource(src);
			hls.attachMedia(video);
			hls.on(Hls.Events.MANIFEST_PARSED, () => {
				video.play().catch(() => {});
			});
		} else if (video.canPlayType("application/vnd.apple.mpegurl")) {
			// Safari native HLS
			video.src = src;
			video.addEventListener("loadedmetadata", () => {
				video.play().catch(() => {});
			});
		}

		return () => {
			if (hls) {
				hls.destroy();
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
