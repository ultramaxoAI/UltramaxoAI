"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { type RegisterActionState, register } from "@/app/(auth)/actions";
import { AuthForm } from "./auth-form";
import { SubmitButton } from "./submit-button";
import { toast } from "./toast";
import Stepper, { Step } from "./ui/stepper";

export function OnboardingStepper() {
	const [formData, setFormData] = useState({
		email: "",
		password: "",
		purpose: "",
		interests: [] as string[],
	});

	const [_state, formAction] = useActionState<RegisterActionState, FormData>(
		register,
		{
			status: "idle",
		},
	);

	const [isSuccessful, _setIsSuccessful] = useState(false);

	const handleFinalComplete = () => {
		// Registration completed
		console.log("Registration completed with data:", formData);
	};

	const validateStep = (step: number): boolean => {
		switch (step) {
			case 2:
				if (!formData.purpose) {
					toast({
						type: "error",
						description: "Silakan pilih minimal 1 tujuan untuk melanjutkan",
					});
					return false;
				}
				return true;
			case 3:
				if (formData.interests.length < 2) {
					toast({
						type: "error",
						description:
							"Silakan pilih minimal 2 topik minat untuk melanjutkan",
					});
					return false;
				}
				return true;
			default:
				return true;
		}
	};

	return (
		<Stepper
			backButtonText="Kembali"
			initialStep={1}
			nextButtonText="Lanjut"
			onFinalStepCompleted={handleFinalComplete}
			validateStep={validateStep}
		>
			<Step>
				<div className="space-y-4 pb-6">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold tracking-tight text-white">
							Selamat Datang di Ultramaxo! 👋
						</h2>
						<p className="text-sm text-zinc-400 leading-relaxed">
							Platform AI terlengkap untuk meningkatkan produktivitas Anda tanpa
							batas. Mari persiapkan ruang kerja khusus untuk Anda.
						</p>
					</div>

					<div className="space-y-3">
						<div className="rounded-2xl border border-blue-500/20 bg-gradient-to-b from-blue-500/10 to-transparent p-6 shadow-lg">
							<h3 className="font-bold mb-4 text-white flex items-center gap-2">
								<span className="text-xl">✨</span> Fitur Unggulan
							</h3>
							<ul className="space-y-3 shrink-0">
								<li className="flex items-center gap-3 text-zinc-300 text-sm">
									<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400">
										<span className="text-xs font-bold">✓</span>
									</div>
									<span>Akses model AI tercerdas & tercepat saat ini</span>
								</li>
								<li className="flex items-center gap-3 text-zinc-300 text-sm">
									<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400">
										<span className="text-xs font-bold">✓</span>
									</div>
									<span>Generate code, artikel, & dokumen dalam detik</span>
								</li>
								<li className="flex items-center gap-3 text-zinc-300 text-sm">
									<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400">
										<span className="text-xs font-bold">✓</span>
									</div>
									<span>Real-time web search & weather tracking</span>
								</li>
								<li className="flex items-center gap-3 text-zinc-300 text-sm">
									<div className="flex items-center justify-center w-5 h-5 rounded-full bg-blue-500/20 text-blue-400">
										<span className="text-xs font-bold">✓</span>
									</div>
									<span>Multi-user collaboration secara langsung</span>
								</li>
							</ul>
						</div>
					</div>
				</div>
			</Step>

			<Step>
				<div className="space-y-4 pb-6">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold tracking-tight text-white">
							Apa Tujuan Utama Anda?
						</h2>
						<p className="text-sm text-zinc-400 leading-relaxed">
							Beri tahu kami bagaimana Ultramaxo dapat membantu Anda
							sehari-hari. <span className="text-red-500 font-semibold">*</span>
						</p>
					</div>

					<div className="space-y-3">
						{[
							{
								value: "coding",
								label: "💻 Coding & Development",
								desc: "Bantuan menulis, membedah, dan mendebug code",
							},
							{
								value: "writing",
								label: "✍️ Content & Copywriting",
								desc: "Drafting artikel, blog, email, dan ide postingan",
							},
							{
								value: "learning",
								label: "📚 Learning & Research",
								desc: "Memahami topik kompleks dan riset akademis",
							},
							{
								value: "business",
								label: "💼 Business & Productivity",
								desc: "Otomatisasi, analisis data, dan strategi bisnis",
							},
							{
								value: "creative",
								label: "🎨 Creative Brainstorming",
								desc: "Mencari inspirasi, cerita, dan ide kreatif gila",
							},
						].map((purpose) => {
							const isSelected = formData.purpose === purpose.value;
							return (
								<button
									className={`group relative w-full text-left rounded-2xl border p-4 transition-all duration-300 ${
										isSelected
											? "border-blue-500 bg-blue-500/10 shadow-[0_0_20px_rgba(59,130,246,0.15)] scale-[1.02]"
											: "border-zinc-800 bg-[#121214] hover:border-zinc-600 hover:bg-zinc-800/40"
									}`}
									key={purpose.value}
									onClick={() =>
										setFormData({ ...formData, purpose: purpose.value })
									}
									type="button"
								>
									{isSelected && (
										<div className="absolute top-4 right-4 w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shadow-lg">
											<span className="text-xs font-bold text-white">✓</span>
										</div>
									)}
									<div
										className={`font-bold ${isSelected ? "text-white" : "text-zinc-200"}`}
									>
										{purpose.label}
									</div>
									<div
										className={`text-sm mt-1 leading-relaxed ${isSelected ? "text-blue-200" : "text-zinc-500"}`}
									>
										{purpose.desc}
									</div>
								</button>
							);
						})}
					</div>
					<p className="text-xs text-gray-500 dark:text-gray-500 flex items-center gap-1">
						<span className="text-gray-600 dark:text-gray-400">*</span> Wajib
						memilih minimal 1 tujuan
					</p>
				</div>
			</Step>

			<Step>
				<div className="space-y-4 pb-6">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold tracking-tight text-white">
							Topik Apa Saja yang Menarik?
						</h2>
						<p className="text-sm text-zinc-400 leading-relaxed">
							Pilih 2 atau lebih topik agar AI kami bisa memberikan respons &
							rekomendasi yang lebih tajam.{" "}
							<span className="text-red-500 font-semibold">*</span>
						</p>
					</div>

					<div className="grid grid-cols-2 gap-3">
						{[
							"🐍 Python",
							"⚛️ React",
							"🟢 Node.js",
							"🤖 AI/ML",
							"📊 Data Science",
							"🎮 Game Dev",
							"📱 Apps/Mobile",
							"🌐 Web Dev",
							"☁️ Cloud Ops",
							"🔐 Security",
							"🎯 Marketing",
							"📈 Analytics",
						].map((interest) => {
							const isSelected = formData.interests.includes(interest);
							return (
								<button
									className={`relative rounded-xl border p-4 text-sm font-semibold transition-all duration-300 flex items-center justify-center ${
										isSelected
											? "border-purple-500 bg-purple-500/10 text-white shadow-[0_0_15px_rgba(168,85,247,0.15)] scale-[1.03]"
											: "border-zinc-800 bg-[#121214] text-zinc-400 hover:border-zinc-600 hover:bg-zinc-800/40 hover:text-zinc-200"
									}`}
									key={interest}
									onClick={() => {
										setFormData({
											...formData,
											interests: isSelected
												? formData.interests.filter((i) => i !== interest)
												: [...formData.interests, interest],
										});
									}}
									type="button"
								>
									{isSelected && (
										<div className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-purple-500 flex items-center justify-center shadow-lg">
											<span className="text-[10px] font-black text-white">
												✓
											</span>
										</div>
									)}
									{interest}
								</button>
							);
						})}
					</div>

					<div className="flex items-center justify-between text-xs pt-2">
						<p className="text-zinc-500 flex items-center gap-1.5 font-medium">
							<span className="text-red-500">*</span> Wajib pilih minimal 2
							topik
						</p>
						<p
							className={`font-bold px-3 py-1 rounded-full ${
								formData.interests.length >= 2
									? "bg-green-500/10 text-green-400 border border-green-500/20"
									: "bg-zinc-800/50 text-zinc-400 border border-zinc-700"
							}`}
						>
							{formData.interests.length} dipilih
						</p>
					</div>
				</div>
			</Step>

			<Step>
				<div className="space-y-4 pb-6">
					<div className="space-y-2">
						<h2 className="text-2xl font-bold tracking-tight text-white mb-1">
							Buat Akun Anda
						</h2>
						<p className="text-sm text-zinc-400 leading-relaxed mb-6">
							Lengkapi kredensial untuk segera mengakses dashboard dan fitur
							premium.
						</p>
					</div>

					<AuthForm action={formAction} type="register">
						<SubmitButton isSuccessful={isSuccessful}>Buat Akun</SubmitButton>
						<p className="mt-4 text-center text-sm text-gray-600 dark:text-gray-400">
							Sudah punya akun?{" "}
							<Link
								className="text-gray-100 dark:text-gray-200 hover:text-white dark:hover:text-white font-medium hover:underline"
								href="/login"
							>
								Masuk di sini
							</Link>
						</p>
					</AuthForm>
				</div>
			</Step>
		</Stepper>
	);
}
