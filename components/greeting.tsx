import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export const Greeting = () => {
	const { data: session } = useSession();
	const username =
		session?.user?.name || session?.user?.email?.split("@")[0] || "there";

	return (
		<div
			className="flex flex-col items-center justify-center text-center px-4"
			key="overview"
		>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="font-semibold text-2xl md:text-3xl mb-2"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
			>
				Halo, {username}!
			</motion.div>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="text-lg md:text-xl text-zinc-500 dark:text-zinc-400"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
			>
				Apa yang bisa saya bantu hari ini?
			</motion.div>
		</div>
	);
};
