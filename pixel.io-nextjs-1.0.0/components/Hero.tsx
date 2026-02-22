import { motion } from "framer-motion";
import { ArrowRightIcon, CheckIcon, PlayIcon, ZapIcon } from "lucide-react";
import { GhostButton, PrimaryButton } from "./Buttons";

export default function Hero() {
	const trustedUserImages = [
		"https://images.unsplash.com/photo-1633332755192-727a05c4013d?w=50",
		"https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=50",
		"https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=50&h=50&fit=crop",
	];

	const mainImageUrl =
		"https://images.unsplash.com/photo-1576267423445-b2e0074d68a4?q=80&w=1600&auto=format&fit=crop";

	const galleryStripImages = [
		"https://images.unsplash.com/photo-1542744173-8e7e53415bb0?q=80&w=100",
		"https://images.unsplash.com/photo-1517048676732-d65bc937f952?q=80&w=100",
		"https://images.unsplash.com/photo-1553877522-43269d4ea984?q=80&w=100",
	];

	const trustedLogosText = [
		"Startups",
		"Scale-ups",
		"Founders",
		"Global teams",
		"Creative brands",
	];

	return (
		<>
			<section className="relative z-10" id="home">
				<div className="max-w-6xl mx-auto px-4 min-h-screen max-md:w-screen max-md:overflow-hidden pt-32 md:pt-26 flex items-center justify-center">
					<div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-center">
						<div className="text-left">
							<motion.a
								className="inline-flex items-center gap-3 pl-3 pr-4 py-1.5 rounded-full bg-white/10 mb-6 justify-start"
								href="#!"
								initial={{ y: 60, opacity: 0 }}
								transition={{
									type: "spring",
									stiffness: 250,
									damping: 70,
									mass: 1,
								}}
								viewport={{ once: true }}
								whileInView={{ y: 0, opacity: 1 }}
							>
								<div className="flex -space-x-2">
									{trustedUserImages.map((src, i) => (
										<img
											alt={`Client ${i + 1}`}
											className="size-6 rounded-full border border-black/50"
											height={40}
											key={i}
											src={src}
											width={40}
										/>
									))}
								</div>
								<span className="text-xs text-gray-200/90">
									Trusted by brands & founders worldwide
								</span>
							</motion.a>

							<motion.h1
								className="text-4xl md:text-5xl font-bold leading-tight mb-6 max-w-xl"
								initial={{ y: 60, opacity: 0 }}
								transition={{
									type: "spring",
									stiffness: 250,
									damping: 70,
									mass: 1,
									delay: 0.1,
								}}
								viewport={{ once: true }}
								whileInView={{ y: 0, opacity: 1 }}
							>
								We design & build <br />
								<span className="bg-clip-text text-transparent bg-linear-to-r from-indigo-300 to-indigo-400">
									high-impact digital experiences
								</span>
							</motion.h1>

							<motion.p
								className="text-gray-300 max-w-lg mb-8"
								initial={{ y: 60, opacity: 0 }}
								transition={{
									type: "spring",
									stiffness: 250,
									damping: 70,
									mass: 1,
									delay: 0.2,
								}}
								viewport={{ once: true }}
								whileInView={{ y: 0, opacity: 1 }}
							>
								A creative digital agency helping startups and businesses grow
								through thoughtful design, scalable development and
								performance-driven strategy.
							</motion.p>

							<motion.div
								className="flex flex-col sm:flex-row items-center gap-4 mb-8"
								initial={{ y: 60, opacity: 0 }}
								transition={{
									type: "spring",
									stiffness: 250,
									damping: 70,
									mass: 1,
									delay: 0.3,
								}}
								viewport={{ once: true }}
								whileInView={{ y: 0, opacity: 1 }}
							>
								<a className="w-full sm:w-auto" href="#!">
									<PrimaryButton className="max-sm:w-full py-3 px-7">
										Start your project
										<ArrowRightIcon className="size-4" />
									</PrimaryButton>
								</a>

								<GhostButton className="max-sm:w-full max-sm:justify-center py-3 px-5">
									<PlayIcon className="size-4" />
									View our work
								</GhostButton>
							</motion.div>

							<motion.div
								className="flex sm:inline-flex overflow-hidden items-center max-sm:justify-center text-sm text-gray-200 bg-white/10 rounded"
								initial={{ y: 60, opacity: 0 }}
								transition={{
									type: "spring",
									stiffness: 250,
									damping: 70,
									mass: 1,
									delay: 0.1,
								}}
								viewport={{ once: true }}
								whileInView={{ y: 0, opacity: 1 }}
							>
								<div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
									<ZapIcon className="size-4 text-sky-500" />
									<div>
										<div>Strategy-led execution</div>
										<div className="text-xs text-gray-400">
											Focused on growth & results
										</div>
									</div>
								</div>

								<div className="hidden sm:block h-6 w-px bg-white/6" />

								<div className="flex items-center gap-2 p-2 px-3 sm:px-6.5 hover:bg-white/3 transition-colors">
									<CheckIcon className="size-4 text-cyan-500" />
									<div>
										<div>Full-service delivery</div>
										<div className="text-xs text-gray-400">
											Design, dev & marketing
										</div>
									</div>
								</div>
							</motion.div>
						</div>

						{/* Right: modern mockup card */}
						<motion.div
							className="mx-auto w-full max-w-lg"
							initial={{ opacity: 0 }}
							transition={{
								type: "spring",
								stiffness: 250,
								damping: 70,
								mass: 1,
								delay: 0.5,
							}}
							viewport={{ once: true }}
							whileInView={{ opacity: 1 }}
						>
							<motion.div className="rounded-3xl overflow-hidden border border-white/6 shadow-2xl bg-linear-to-b from-black/50 to-transparent">
								<div className="relative aspect-16/10 bg-gray-900">
									<img
										alt="agency-work-preview"
										className="w-full h-full object-cover object-center"
										src={mainImageUrl}
									/>

									<div className="absolute left-4 top-4 px-3 py-1 rounded-full bg-black/15 backdrop-blur-sm text-xs">
										Branding • Web • Growth
									</div>

									<div className="absolute right-4 bottom-4">
										<button className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-white/6 backdrop-blur-sm hover:bg-white/10 transition focus:outline-none">
											<PlayIcon className="size-4" />
											<span className="text-xs">See case study</span>
										</button>
									</div>
								</div>
							</motion.div>

							<div className="mt-4 flex gap-3 items-center justify-start">
								{galleryStripImages.map((src, i) => (
									<motion.div
										className="w-14 h-10 rounded-lg overflow-hidden border border-white/6"
										initial={{ y: 20, opacity: 0 }}
										key={i}
										transition={{
											type: "spring",
											stiffness: 250,
											damping: 70,
											mass: 1,
											delay: 0.1 + i * 0.1,
										}}
										viewport={{ once: true }}
										whileInView={{ y: 0, opacity: 1 }}
									>
										<img
											alt="project-thumbnail"
											className="w-full h-full object-cover"
											src={src}
										/>
									</motion.div>
								))}
								<motion.div
									className="text-sm text-gray-400 ml-2 flex items-center gap-2"
									initial={{ y: 60, opacity: 0 }}
									transition={{
										type: "spring",
										stiffness: 250,
										damping: 70,
										mass: 1,
										delay: 0.2,
									}}
									viewport={{ once: true }}
									whileInView={{ y: 0, opacity: 1 }}
								>
									<div className="relative flex h-3.5 w-3.5 items-center justify-center">
										<span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75 animate-ping duration-300" />

										<span className="relative inline-flex size-2 rounded-full bg-green-600" />
									</div>
									20+ completed projects
								</motion.div>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* LOGO MARQUEE */}
			<motion.section
				className="border-y border-white/6 bg-white/1 max-md:mt-10"
				initial={{ y: 60, opacity: 0 }}
				transition={{ type: "spring", stiffness: 250, damping: 70, mass: 1 }}
				viewport={{ once: true }}
				whileInView={{ y: 0, opacity: 1 }}
			>
				<div className="max-w-6xl mx-auto px-6">
					<div className="w-full overflow-hidden py-6">
						<div className="flex gap-14 items-center justify-center animate-marquee whitespace-nowrap">
							{trustedLogosText.concat(trustedLogosText).map((logo, i) => (
								<span
									className="mx-6 text-sm md:text-base font-semibold text-gray-400 hover:text-gray-300 tracking-wide transition-colors"
									key={i}
								>
									{logo}
								</span>
							))}
						</div>
					</div>
				</div>
			</motion.section>
		</>
	);
}
