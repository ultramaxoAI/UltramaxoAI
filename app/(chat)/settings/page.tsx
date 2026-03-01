"use client";

import {
	ArrowLeft,
	KeyIcon,
	Loader2Icon,
	LockIcon,
	ShieldCheckIcon,
	SparklesIcon,
	UserIcon,
	ZapIcon,
} from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

// ============================================================
// Types
// ============================================================
interface SettingsUser {
	email?: string | null;
	isPro?: boolean;
	messageCount?: number;
}

interface UserSettingsData {
	displayName?: string;
	customInstructions?: string;
	language?: string;
}

interface ProviderConfig {
	id: string;
	name: string;
	description: string;
	color: string;
	placeholder: string;
	modelPlaceholder: string;
	icon: React.ReactNode;
}

interface ApiKeyData {
	provider: string;
	isEnabled: boolean;
	customModels: string[];
	maskedKeys: string[];
	keyCount: number;
}

const PROVIDERS: ProviderConfig[] = [
	{
		id: "gemini",
		name: "Gemini",
		description: "Google Generative Service",
		color: "text-blue-500",
		placeholder: "AIzaSy...",
		modelPlaceholder: "e.g. gemini-2.5-flash",
		icon: (
			<svg viewBox="0 0 24 24" className="w-7 h-7">
				<title>Gemini Logo</title>
				<defs>
					<linearGradient
						id="gemini-grad-1"
						x1="12"
						y1="2"
						x2="12"
						y2="22"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#4184F3" />
						<stop offset="0.5" stopColor="#EA4335" />
						<stop offset="1" stopColor="#FBBC05" />
					</linearGradient>
					<linearGradient
						id="gemini-grad-2"
						x1="2"
						y1="12"
						x2="22"
						y2="12"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#4184F3" />
						<stop offset="1" stopColor="#34A853" />
					</linearGradient>
				</defs>
				<path
					fill="url(#gemini-grad-1)"
					d="M12.98 2.05a1.1 1.1 0 0 0-1.96 0l-1.9 4.1a5.62 5.62 0 0 1-2.97 2.97l-4.1 1.9a1.1 1.1 0 0 0 0 1.96l4.1 1.9a5.62 5.62 0 0 1 2.97 2.97l1.9 4.1a1.1 1.1 0 0 0 1.96 0l1.9-4.1a5.62 5.62 0 0 1 2.97-2.97l4.1-1.9a1.1 1.1 0 0 0 0-1.96l-4.1-1.9a5.62 5.62 0 0 1-2.97-2.97l-1.9-4.1Z"
				/>
			</svg>
		),
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		description: "Universal API Access",
		color: "text-black dark:text-black",
		placeholder: "sk-or-v1-...",
		modelPlaceholder: "e.g. meta-llama/llama-3-8b-instruct",
		icon: (
			<svg viewBox="0 0 491 512" fill="currentColor" className="w-6 h-6">
				<title>OpenRouter Logo</title>
				<path d="M352.505 167.314c-11.838-16.14-26.656-30.083-43.585-41.05-16.929-10.968-35.619-18.729-55.032-22.855-19.412-4.126-39.215-4.47-58.303-.996-19.088 3.473-37.086 10.592-52.996 20.941-15.91 10.35-29.351 23.635-39.593 39.124-10.243 15.489-16.945 32.843-19.73 51.096-2.786 18.252-1.579 37.009 3.553 55.216 5.132 18.207 13.93 35.151 25.894 49.88l-60.671 67.575c-31.543-30.82-53.111-69.577-62.435-112.193C-3.475 221.439 6.273 167 36.565 122.95 66.857 78.9 114.743 45.483 162.723 33.64c51.745-12.772 106.918-4.8 152.483 23.313 45.565 28.113 78.783 72.39 96.657 122.106L352.505 167.314zm12.981 184.992c-15.487 19.344-34.909 35.083-56.91 46.124-22.001 11.042-46.331 17.155-71.282 17.915-24.951.759-49.626-4.008-72.298-13.968-22.671-9.959-42.618-24.935-58.441-43.88l-60.599 67.653c30.293 32.064 68.32 55.074 110.086 66.608 41.765 11.533 86.837 10.742 128.268-2.251C335.74 517.433 371.492 494.39 397.777 460.844c26.284-33.546 43.141-75.144 48.974-118.808H365.486zM488 221.78l-159.458 54L488 329.782v-108z" />
			</svg>
		),
	},
	{
		id: "groq",
		name: "Groq",
		description: "Ultra Fast Inference",
		color: "text-black dark:text-black",
		placeholder: "gsk_...",
		modelPlaceholder: "e.g. llama3-8b-8192",
		icon: (
			<svg
				viewBox="0 0 100 100"
				fill="none"
				stroke="currentColor"
				strokeWidth="8"
				className="w-6 h-6"
			>
				<title>Groq Logo</title>
				<circle cx="50" cy="50" r="40" />
				<line x1="15" y1="85" x2="70" y2="30" strokeLinecap="round" />
			</svg>
		),
	},
	{
		id: "maia",
		name: "MAIA Router",
		description: "Ultramaxo Default Router",
		color: "text-indigo-500",
		placeholder: "sk-...",
		modelPlaceholder: "e.g. maia/gemini-2.5-flash",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="none"
				stroke="currentColor"
				strokeWidth="2"
				strokeLinecap="round"
				strokeLinejoin="round"
				className="w-5 h-5"
			>
				<title>MAIA Router Logo</title>
				<polygon points="12 2 2 7 12 12 22 7 12 2" />
				<polyline points="2 17 12 22 22 17" />
				<polyline points="2 12 12 17 22 12" />
			</svg>
		),
	},
	{
		id: "openai",
		name: "OpenAI",
		description: "GPT Models",
		color: "text-emerald-500",
		placeholder: "sk-proj-...",
		modelPlaceholder: "e.g. gpt-4o",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
				<title>OpenAI Logo</title>
				<path d="M22.28 10.12A8.44 8.44 0 0 0 20.3 5.4c-1.2-1.2-2.8-1.78-4.48-1.57A8.4 8.4 0 0 0 9 2.13C7.26 1.77 5.46 2.45 4.34 3.8a8.3 8.3 0 0 0-2.02 4.7 8.32 8.32 0 0 0 .54 4.54A8.34 8.34 0 0 0 4 17.65c1.24 1.25 2.92 1.83 4.65 1.58A8.4 8.4 0 0 0 15 21l.36-.04c1.7-.58 3.06-1.85 3.73-3.48a8.27 8.27 0 0 0 2.22-4.66c.2-1.54-.12-3.1-.96-4.44h.02c.48-.68.78-1.46.9-2.26zM12 18V9l-6 3.46v5.86l6-3.45m7.8-10.4-3 5.2-6-3.46v-6.9l6 3.46m-3-1l-6-3.46L6 5.6l6 3.46V15l6-3.46m-12 7l3-5.2 6 3.46v6.92l-6-3.46M6 18.06v-5.86l6 3.46V21.5l-6-3.46M6 10l-6 3.46L6 16.9v-6.9m15 1L18 5.6l-6 3.46V15l6-3.46m-9-3.46l-6 3.46 6 3.46V15Z" />
			</svg>
		),
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description: "Claude Models",
		color: "text-amber-700",
		placeholder: "sk-ant-...",
		modelPlaceholder: "e.g. claude-3-5-sonnet-20240620",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
				<title>Anthropic Logo</title>
				<path d="M12.9 22h3.5L8.5 2h-4zm3.9-9.5-1.4-2.8 5-1V12z" />
			</svg>
		),
	},
];

type TabId = "profile" | "custom-ai" | "personalization";

// ============================================================
// Main Component
// ============================================================
export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<TabId>("profile");

	const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
		{ id: "profile", label: "Profile", icon: <UserIcon size={16} /> },
		{ id: "custom-ai", label: "Custom AI", icon: <KeyIcon size={16} /> },
		{
			id: "personalization",
			label: "Personalisasi",
			icon: <SparklesIcon size={16} />,
		},
	];

	return (
		<div className="flex flex-col md:flex-row h-screen bg-white dark:bg-[#09090b]">
			{/* Mobile Header */}
			<header className="flex md:hidden items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30">
				<Link
					href="/chat"
					className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-white transition-colors"
				>
					<ArrowLeft size={18} />
				</Link>
				<h1 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-white">
					Settings
				</h1>
				<div className="w-[18px]" /> {/* Spacer for centering */}
			</header>

			{/* Desktop Sidebar — hidden on mobile */}
			<aside className="hidden md:flex w-56 border-r border-zinc-200 dark:border-zinc-800/50 bg-zinc-50 dark:bg-zinc-900/30 p-6 flex-col gap-1.5">
				<Link
					href="/chat"
					className="flex items-center gap-2 text-sm text-zinc-500 hover:text-indigo-600 dark:hover:text-indigo-400 transition-colors mb-6"
				>
					<ArrowLeft size={16} />
					Back to Chat
				</Link>

				<h2 className="text-xs font-black uppercase tracking-widest text-zinc-400 dark:text-zinc-600 mb-3">
					Settings
				</h2>

				{tabs.map((tab) => (
					<button
						key={tab.id}
						className={`flex items-center gap-3 px-4 py-2.5 rounded-xl text-sm transition-all duration-200 ${
							activeTab === tab.id
								? "bg-indigo-50 text-indigo-700 dark:bg-indigo-500/15 dark:text-indigo-300 font-semibold ring-1 ring-indigo-200 dark:ring-indigo-500/30"
								: "text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800/60"
						}`}
						onClick={() => setActiveTab(tab.id)}
						type="button"
					>
						{tab.icon}
						{tab.label}
					</button>
				))}
			</aside>

			{/* Main Content */}
			<main className="flex-1 overflow-y-auto px-4 py-6 md:p-8 lg:p-12 pb-24 md:pb-8">
				<div className="max-w-3xl mx-auto md:mx-0">
					{activeTab === "profile" && <ProfileTab />}
					{activeTab === "custom-ai" && <CustomAITab />}
					{activeTab === "personalization" && <PersonalizationTab />}
				</div>
			</main>

			{/* Mobile Bottom Tab Bar — visible only on mobile */}
			<nav className="fixed bottom-0 left-0 right-0 z-50 flex md:hidden items-center justify-around border-t border-zinc-200 dark:border-zinc-800 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-lg py-2 safe-bottom">
				{tabs.map((tab) => (
					<button
						key={tab.id}
						className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg text-[10px] font-medium transition-all duration-200 ${
							activeTab === tab.id
								? "text-indigo-600 dark:text-indigo-400"
								: "text-zinc-400 dark:text-zinc-600"
						}`}
						onClick={() => setActiveTab(tab.id)}
						type="button"
					>
						<span
							className={`flex items-center justify-center size-8 rounded-full transition-all duration-200 ${
								activeTab === tab.id
									? "bg-indigo-100 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 scale-110"
									: "hover:bg-zinc-100 dark:hover:bg-zinc-800"
							}`}
						>
							{tab.icon}
						</span>
						{tab.label}
					</button>
				))}
			</nav>
		</div>
	);
}

// ============================================================
// Profile Tab
// ============================================================
function ProfileTab() {
	const [user, setUser] = useState<SettingsUser | null>(null);
	const [loading, setLoading] = useState(true);
	const [passwordData, setPasswordData] = useState({
		currentPassword: "",
		newPassword: "",
		confirmPassword: "",
	});
	const [updateLoading, setUpdateLoading] = useState(false);

	const fetchUser = useCallback(async () => {
		setLoading(true);
		try {
			const res = await fetch("/api/user/settings");
			const data = await res.json();
			if (data.user) setUser(data.user);
		} catch {
			toast.error("Failed to load user data");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchUser();
	}, [fetchUser]);

	const handlePasswordChange = async (e: React.FormEvent) => {
		e.preventDefault();
		if (passwordData.newPassword !== passwordData.confirmPassword) {
			toast.error("Password konfirmasi tidak cocok");
			return;
		}
		setUpdateLoading(true);
		try {
			const res = await fetch("/api/user/settings", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					currentPassword: passwordData.currentPassword,
					newPassword: passwordData.newPassword,
				}),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("Password berhasil diubah");
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			} else {
				toast.error(data.error || "Gagal mengubah password");
			}
		} catch {
			toast.error("Terjadi kesalahan");
		} finally {
			setUpdateLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-zinc-500">
				<Loader2Icon className="animate-spin" size={32} />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
					Profile
				</h1>
				<p className="text-sm text-zinc-500 mt-1">
					Liat detail profil dan sisa kuota chat kamu.
				</p>
			</header>

			<div className="space-y-4">
				<div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
					<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
						Email Address
					</Label>
					<div className="text-sm text-zinc-900 dark:text-white font-medium mt-1">
						{user?.email || "N/A"}
					</div>
				</div>

				<div className="grid grid-cols-2 gap-4">
					<div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
						<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Tier Status
						</Label>
						<div className="mt-1">
							{user?.isPro ? (
								<span className="text-xs px-2 py-0.5 bg-yellow-400/10 text-yellow-600 dark:text-yellow-500 rounded-full font-bold border border-yellow-500/20">
									PRO
								</span>
							) : (
								<span className="text-xs px-2 py-0.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-400 rounded-full font-bold">
									FREE
								</span>
							)}
						</div>
					</div>
					<div className="p-5 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800/50">
						<Label className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
							Chat Quota
						</Label>
						<div className="flex items-center gap-1.5 text-sm text-zinc-900 dark:text-white font-bold mt-1">
							<ZapIcon className="text-blue-500 fill-blue-500" size={14} />
							{user?.isPro
								? "Unlimited"
								: `${Math.max(0, 10 - (user?.messageCount || 0))} / 10`}
						</div>
						<span className="text-[9px] text-zinc-600 font-medium">
							Resets every 24h
						</span>
					</div>
				</div>

				<div className="p-4 rounded-2xl bg-blue-500/10 dark:bg-blue-500/5 border border-blue-500/20 flex items-start gap-4">
					<div className="p-2 rounded-xl bg-blue-500/10 text-blue-600 dark:text-blue-500">
						<ShieldCheckIcon size={20} />
					</div>
					<div>
						<span className="text-xs font-bold text-zinc-900 dark:text-white">
							Akun kamu aman
						</span>
						<p className="text-[10px] text-zinc-600 dark:text-zinc-500 leading-relaxed">
							Gunakan fitur ini untuk memantau sisa kuota chat kamu secara
							real-time.
						</p>
					</div>
				</div>
			</div>

			{/* Change Password */}
			<div className="border-t border-zinc-200 dark:border-zinc-800/50 pt-8">
				<h2 className="text-lg font-bold text-zinc-900 dark:text-white mb-1">
					<LockIcon className="inline-block mr-2" size={18} />
					Ganti Password
				</h2>
				<p className="text-xs text-zinc-500 mb-6">
					Perbarui password akun kamu secara berkala.
				</p>
				<form className="space-y-4 max-w-sm" onSubmit={handlePasswordChange}>
					<div className="space-y-2">
						<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
							Password Saat Ini
						</Label>
						<Input
							className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm"
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									currentPassword: e.target.value,
								})
							}
							placeholder="••••••••"
							required
							type="password"
							value={passwordData.currentPassword}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
							Password Baru
						</Label>
						<Input
							className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm"
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									newPassword: e.target.value,
								})
							}
							placeholder="••••••••"
							required
							type="password"
							value={passwordData.newPassword}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
							Konfirmasi Password Baru
						</Label>
						<Input
							className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm"
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									confirmPassword: e.target.value,
								})
							}
							placeholder="••••••••"
							required
							type="password"
							value={passwordData.confirmPassword}
						/>
					</div>
					<Button
						className="w-full bg-zinc-900 text-white dark:bg-white dark:text-black font-bold h-11 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all mt-2"
						disabled={updateLoading}
						type="submit"
					>
						{updateLoading ? (
							<Loader2Icon className="animate-spin" size={18} />
						) : (
							"Perbarui Password"
						)}
					</Button>
				</form>
			</div>
		</div>
	);
}

// ============================================================
// Custom AI Tab
// ============================================================
function CustomAITab() {
	const [apiKeys, setApiKeys] = useState<Record<string, ApiKeyData>>({});
	const [rawKeys, setRawKeys] = useState<Record<string, string>>({});
	const [newModel, setNewModel] = useState<Record<string, string>>({});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState<string | null>(null);
	const [testing, setTesting] = useState<string | null>(null);

	const fetchKeys = useCallback(async () => {
		try {
			const res = await fetch("/api/user/api-keys");
			const data = await res.json();
			if (data.keys) {
				const map: Record<string, ApiKeyData> = {};
				for (const k of data.keys) {
					map[k.provider] = k;
				}
				setApiKeys(map);
			}
		} catch {
			toast.error("Failed to load API keys");
		} finally {
			setLoading(false);
		}
	}, []);

	useEffect(() => {
		fetchKeys();
	}, [fetchKeys]);

	const handleToggle = async (provider: string, enabled: boolean) => {
		try {
			await fetch("/api/user/api-keys", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, isEnabled: enabled }),
			});
			setApiKeys((prev) => ({
				...prev,
				[provider]: { ...prev[provider], isEnabled: enabled },
			}));
			toast.success(`${provider} ${enabled ? "enabled" : "disabled"}`);
		} catch {
			toast.error("Failed to toggle provider");
		}
	};

	const handleSave = async (provider: string) => {
		const keysText = rawKeys[provider];
		if (!keysText?.trim()) {
			toast.error("Please enter at least one API key");
			return;
		}

		const keys = keysText
			.split(/[\n,]+/)
			.map((k) => k.trim())
			.filter(Boolean);

		setSaving(provider);
		try {
			const res = await fetch("/api/user/api-keys", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					provider,
					keys,
					customModels: apiKeys[provider]?.customModels || [],
				}),
			});
			if (res.ok) {
				toast.success("API keys saved!");
				setRawKeys((prev) => ({ ...prev, [provider]: "" }));
				fetchKeys();
			} else {
				const errText = await res.text();
				alert(`Save Failed: Status ${res.status} - ${errText}`);
				toast.error(`Failed to save keys: ${res.status}`);
			}
		} catch {
			toast.error("Failed to save keys");
		} finally {
			setSaving(null);
		}
	};

	const handleTest = async (provider: string) => {
		const keysText = rawKeys[provider];
		const firstKey = keysText
			?.split(/[\n,]+/)
			.map((k) => k.trim())
			.filter(Boolean)[0];

		if (!firstKey) {
			toast.error("Enter an API key first to test");
			return;
		}

		setTesting(provider);
		try {
			const res = await fetch("/api/user/api-keys/test", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ provider, key: firstKey }),
			});
			const data = await res.json();
			if (data.success) {
				toast.success("✅ API key is valid!");
			} else {
				toast.error(data.message || "API key is invalid");
			}
		} catch {
			toast.error("Connection test failed");
		} finally {
			setTesting(null);
		}
	};

	const handleAddModel = (provider: string) => {
		const modelId = newModel[provider]?.trim();
		if (!modelId) return;

		const current = apiKeys[provider]?.customModels || [];
		if (current.includes(modelId)) {
			toast.error("Model already exists");
			return;
		}

		const updated = [...current, modelId];
		setApiKeys((prev) => ({
			...prev,
			[provider]: { ...prev[provider], customModels: updated },
		}));
		setNewModel((prev) => ({ ...prev, [provider]: "" }));

		// Save to backend
		fetch("/api/user/api-keys", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, customModels: updated }),
		});
	};

	const handleRemoveModel = (provider: string, model: string) => {
		const current = apiKeys[provider]?.customModels || [];
		const updated = current.filter((m) => m !== model);
		setApiKeys((prev) => ({
			...prev,
			[provider]: { ...prev[provider], customModels: updated },
		}));

		fetch("/api/user/api-keys", {
			method: "PATCH",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ provider, customModels: updated }),
		});
	};

	const handleDelete = async (provider: string) => {
		try {
			await fetch(`/api/user/api-keys?provider=${provider}`, {
				method: "DELETE",
			});
			setApiKeys((prev) => {
				const next = { ...prev };
				delete next[provider];
				return next;
			});
			toast.success("API key deleted");
		} catch {
			toast.error("Failed to delete");
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-zinc-500">
				<Loader2Icon className="animate-spin" size={32} />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header className="flex items-center justify-between">
				<h1 className="text-xl font-bold text-zinc-900 dark:text-white">
					Custom AI Configuration
				</h1>
			</header>

			<div className="flex items-center justify-between pb-2 border-b border-zinc-800/50">
				<h2 className="text-xs font-black uppercase tracking-widest text-white">
					AI PROVIDER
				</h2>
				<span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 mr-2">
					ROTATION MODEL
				</span>
			</div>

			<div className="space-y-6">
				{PROVIDERS.map((provider) => {
					const data = apiKeys[provider.id];
					const isEnabled = data?.isEnabled ?? false;

					return (
						<div
							key={provider.id}
							className={`rounded-xl border p-6 transition-all ${
								isEnabled
									? "border-primary/20 bg-primary/5 dark:bg-primary/10 shadow-sm"
									: "border-zinc-200 dark:border-zinc-800/30 bg-zinc-50 dark:bg-zinc-900/10"
							}`}
						>
							{/* Header */}
							<div className="flex items-center justify-between mb-8">
								<div className="flex items-center justify-between w-full">
									<div className="flex items-center gap-4">
										<div
											className={`w-12 h-12 rounded-full bg-white flex items-center justify-center shrink-0 shadow-sm ${provider.color}`}
										>
											{provider.icon}
										</div>
										<div>
											<h3 className="font-bold text-zinc-900 dark:text-white text-base">
												{provider.name} Api Key
											</h3>
											<p className="text-[11px] text-zinc-500 font-medium">
												{provider.description}
											</p>
										</div>
									</div>
									<button
										type="button"
										onClick={() => handleToggle(provider.id, !isEnabled)}
										className={`relative w-11 h-6 rounded-full transition-colors shrink-0 ${
											isEnabled ? "bg-white" : "bg-zinc-700"
										}`}
									>
										<div
											className={`absolute top-0.5 w-5 h-5 rounded-full shadow transition-transform ${
												isEnabled
													? "translate-x-5 bg-black"
													: "translate-x-0.5 bg-white"
											}`}
										/>
									</button>
								</div>
							</div>

							{/* Models */}
							<div className="mb-6">
								<div className="flex items-center justify-between mb-3">
									<span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">
										Model
									</span>
									<div className="flex items-center gap-2">
										<input
											className="h-8 px-3 text-xs rounded-full border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 text-zinc-900 dark:text-white w-48 focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all placeholder:text-zinc-400 dark:placeholder:text-zinc-600"
											placeholder={provider.modelPlaceholder}
											value={newModel[provider.id] || ""}
											onChange={(e) =>
												setNewModel((prev) => ({
													...prev,
													[provider.id]: e.target.value,
												}))
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") handleAddModel(provider.id);
											}}
										/>
										<button
											type="button"
											onClick={() => handleAddModel(provider.id)}
											className="text-[11px] px-3 py-1.5 rounded-full border border-indigo-500/20 bg-indigo-500/10 text-indigo-400 font-semibold hover:bg-indigo-500/20 transition-colors"
										>
											+ Tambah Model
										</button>
									</div>
								</div>
								{(data?.customModels || []).length > 0 && (
									<div className="flex flex-wrap gap-2 mt-2">
										{data?.customModels.map((model) => (
											<span
												key={model}
												className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-[11px] text-zinc-700 dark:text-zinc-300"
											>
												{model}
												<button
													type="button"
													onClick={() => handleRemoveModel(provider.id, model)}
													className="text-zinc-500 hover:text-red-400 ml-1 leading-none"
												>
													×
												</button>
											</span>
										))}
									</div>
								)}
							</div>

							{/* Keys */}
							<div className="mb-4">
								<span className="text-[10px] font-black uppercase tracking-widest text-indigo-500/80 mb-3 block">
									Key1, Key2, Key3, Key4 dan dll
								</span>
								{data?.maskedKeys && data.maskedKeys.length > 0 && (
									<div className="flex flex-wrap gap-2 mb-3">
										{data.maskedKeys.map((mk, i) => (
											<span
												key={`${provider.id}-mask-${i}`}
												className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-500 text-[10px] font-mono border border-emerald-500/20"
											>
												{mk}
											</span>
										))}
									</div>
								)}
								<textarea
									className="w-full h-24 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/40 text-sm text-zinc-900 dark:text-zinc-300 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 resize-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none transition-all shadow-sm dark:shadow-none"
									placeholder={`Enter ${provider.name} Keys...\n(one per line or comma-separated)`}
									value={rawKeys[provider.id] || ""}
									onChange={(e) =>
										setRawKeys((prev) => ({
											...prev,
											[provider.id]: e.target.value,
										}))
									}
								/>
							</div>

							{/* Actions */}
							<div className="flex items-center gap-3">
								<Button
									className="rounded-full text-xs h-9 border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 hover:text-zinc-900 dark:hover:text-white"
									variant="outline"
									disabled={testing === provider.id}
									onClick={() => handleTest(provider.id)}
									type="button"
								>
									{testing === provider.id ? (
										<Loader2Icon className="animate-spin mr-1" size={14} />
									) : null}
									Test Connection
								</Button>
								<Button
									className="rounded-full text-xs h-9 bg-zinc-900 text-white dark:bg-zinc-800 dark:text-white hover:bg-zinc-800 dark:hover:bg-zinc-700 w-24"
									disabled={saving === provider.id}
									onClick={() => handleSave(provider.id)}
									type="button"
								>
									{saving === provider.id ? (
										<Loader2Icon className="animate-spin" size={14} />
									) : (
										"Save Keys"
									)}
								</Button>
								{data && (
									<Button
										className="rounded-full text-xs h-9 ml-auto text-zinc-400 hover:text-red-400 hover:bg-red-500/10"
										variant="ghost"
										onClick={() => handleDelete(provider.id)}
										type="button"
									>
										Delete
									</Button>
								)}
							</div>
						</div>
					);
				})}
			</div>
		</div>
	);
}

// ============================================================
// Personalization Tab
// ============================================================
function PersonalizationTab() {
	const [settings, setSettings] = useState<UserSettingsData>({
		displayName: "",
		customInstructions: "",
		language: "en",
	});
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		async function load() {
			try {
				const res = await fetch("/api/user/settings/personalization");
				if (res.ok) {
					const data = await res.json();
					if (data.settings) setSettings(data.settings);
				}
			} catch {
				// Settings might not exist yet, that's fine
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	const handleSave = async () => {
		setSaving(true);
		try {
			const res = await fetch("/api/user/settings/personalization", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			if (res.ok) {
				toast.success("Settings saved!");
			} else {
				toast.error("Failed to save settings");
			}
		} catch {
			toast.error("Failed to save settings");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex items-center justify-center h-64 text-zinc-500">
				<Loader2Icon className="animate-spin" size={32} />
			</div>
		);
	}

	return (
		<div className="space-y-8">
			<header>
				<h1 className="text-2xl font-bold text-zinc-900 dark:text-white">
					Personalisasi
				</h1>
				<p className="text-sm text-zinc-500 mt-1">
					Sesuaikan pengalaman AI kamu sesuai kebutuhan.
				</p>
			</header>

			<div className="space-y-6">
				<div className="space-y-2">
					<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
						Display Name
					</Label>
					<Input
						className="bg-white dark:bg-zinc-900 border-zinc-200 dark:border-zinc-800 rounded-xl h-11 text-sm"
						placeholder="Your name..."
						value={settings.displayName || ""}
						onChange={(e) =>
							setSettings({ ...settings, displayName: e.target.value })
						}
					/>
					<p className="text-[10px] text-zinc-500">
						Nama yang akan ditampilkan di chat dan profil kamu.
					</p>
				</div>

				<div className="space-y-2">
					<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
						Custom Instructions
					</Label>
					<textarea
						className="w-full h-32 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white placeholder:text-zinc-400 resize-none focus:ring-1 focus:ring-primary/50 focus:border-primary/50 outline-none"
						placeholder="e.g. Selalu jawab dalam Bahasa Indonesia. Saya seorang developer Next.js..."
						value={settings.customInstructions || ""}
						onChange={(e) =>
							setSettings({
								...settings,
								customInstructions: e.target.value,
							})
						}
					/>
					<p className="text-[10px] text-zinc-500">
						Instruksi spesifik yang akan diberikan ke AI di setiap percakapan.
					</p>
				</div>

				<div className="space-y-2">
					<Label className="text-xs font-medium text-zinc-600 dark:text-zinc-400">
						Language
					</Label>
					<select
						className="w-full h-11 px-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-white outline-none focus:ring-1 focus:ring-primary/50"
						value={settings.language || "en"}
						onChange={(e) =>
							setSettings({ ...settings, language: e.target.value })
						}
					>
						<option value="en">English</option>
						<option value="id">Bahasa Indonesia</option>
					</select>
				</div>
			</div>

			<Button
				className="bg-zinc-900 text-white dark:bg-white dark:text-black font-bold h-11 rounded-xl hover:bg-zinc-800 dark:hover:bg-zinc-200 transition-all w-full max-w-sm"
				disabled={saving}
				onClick={handleSave}
				type="button"
			>
				{saving ? (
					<Loader2Icon className="animate-spin mr-2" size={16} />
				) : null}
				Simpan Pengaturan
			</Button>
		</div>
	);
}
