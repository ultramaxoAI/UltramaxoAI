import { motion } from "framer-motion";
import { useSession } from "next-auth/react";

export const Greeting = () => {
	const { data: session } = useSession();
	const username =
		session?.user?.name || session?.user?.email?.split("@")[0] || "there";

	return (
		<div
			className="flex flex-col items-center justify-center px-4 text-center"
			key="overview"
		>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="mb-2 text-2xl font-semibold tracking-[-0.04em] md:text-3xl"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
			>
				Halo, {username}!
			</motion.div>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="text-lg text-[#5f6258] md:text-xl dark:text-[#a6aca6]"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
			>
				Apa yang bisa saya bantu hari ini?
			</motion.div>
		</div>
	);
};
