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
				className="mb-2 text-3xl font-semibold tracking-[-0.05em] text-[#16181b] dark:text-[#f4f1ec] md:text-4xl"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.3, duration: 0.4, ease: "easeOut" }}
			>
				Hello, {username}
			</motion.div>
			<motion.div
				animate={{ opacity: 1, y: 0 }}
				className="text-base text-[#686d69] dark:text-[#989d98] md:text-lg"
				exit={{ opacity: 0, y: -10 }}
				initial={{ opacity: 0, y: 10 }}
				transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
			>
				What would you like to explore today?
			</motion.div>
		</div>
	);
};
