"use client";

import {
	ArrowLeft,
	ChevronRightIcon,
	KeyIcon,
	Loader2Icon,
	LockIcon,
	SparklesIcon,
	TicketIcon,
	UserIcon,
	ZapIcon,
} from "lucide-react";
import { useRouter } from "next/navigation";
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
		description: "Google's advanced multimodal models",
		placeholder: "AIzaSy...",
		modelPlaceholder: "e.g. gemini-2.5-flash",
		icon: (
			<svg
				viewBox="0 0 24 24"
				fill="url(#gemini-grad-settings)"
				className="w-5 h-5 shrink-0"
			>
				<defs>
					<linearGradient
						id="gemini-grad-settings"
						x1="0"
						y1="0"
						x2="24"
						y2="24"
						gradientUnits="userSpaceOnUse"
					>
						<stop stopColor="#4184F3" />
						<stop offset="0.3" stopColor="#EA4335" />
						<stop offset="0.7" stopColor="#FBBC05" />
						<stop offset="1" stopColor="#34A853" />
					</linearGradient>
				</defs>
				<path d="M12.0001 0.5C12.0001 0.5 12.0001 7.42398 17.5756 12C12.0001 16.576 12.0001 23.5 12.0001 23.5C12.0001 23.5 12.0001 16.576 6.4246 12C12.0001 7.42398 12.0001 0.5 12.0001 0.5Z" />
			</svg>
		),
	},
	{
		id: "openrouter",
		name: "OpenRouter",
		description: "Unified access to dozens of leading LLMs",
		placeholder: "sk-or-v1-...",
		modelPlaceholder: "e.g. meta-llama/llama-3-8b",
		icon: (
			<svg
				viewBox="0 0 491 512"
				fill="currentColor"
				className="w-5 h-5 shrink-0"
			>
				<path d="M352.505 167.314c-11.838-16.14-26.656-30.083-43.585-41.05-16.929-10.968-35.619-18.729-55.032-22.855-19.412-4.126-39.215-4.47-58.303-.996-19.088 3.473-37.086 10.592-52.996 20.941-15.91 10.35-29.351 23.635-39.593 39.124-10.243 15.489-16.945 32.843-19.73 51.096-2.786 18.252-1.579 37.009 3.553 55.216 5.132 18.207 13.93 35.151 25.894 49.88l-60.671 67.575c-31.543-30.82-53.111-69.577-62.435-112.193C-3.475 221.439 6.273 167 36.565 122.95 66.857 78.9 114.743 45.483 162.723 33.64c51.745-12.772 106.918-4.8 152.483 23.313 45.565 28.113 78.783 72.39 96.657 122.106L352.505 167.314zm12.981 184.992c-15.487 19.344-34.909 35.083-56.91 46.124-22.001 11.042-46.331 17.155-71.282 17.915-24.951.759-49.626-4.008-72.298-13.968-22.671-9.959-42.618-24.935-58.441-43.88l-60.599 67.653c30.293 32.064 68.32 55.074 110.086 66.608 41.765 11.533 86.837 10.742 128.268-2.251C335.74 517.433 371.492 494.39 397.777 460.844c26.284-33.546 43.141-75.144 48.974-118.808H365.486zM488 221.78l-159.458 54L488 329.782v-108z" />
			</svg>
		),
	},
	{
		id: "groq",
		name: "Groq",
		description: "LPUs tailored for ultra-fast inference",
		placeholder: "gsk_...",
		modelPlaceholder: "e.g. llama3-8b-8192",
		icon: (
			<svg
				viewBox="0 0 100 100"
				fill="none"
				stroke="currentColor"
				strokeWidth="10"
				className="w-5 h-5 shrink-0"
			>
				<circle cx="50" cy="50" r="40" />
				<line x1="20" y1="80" x2="80" y2="20" strokeLinecap="round" />
			</svg>
		),
	},
	{
		id: "maia",
		name: "MAIA",
		description: "Ultramaxo's native routing infrastructure",
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
				className="w-5 h-5 shrink-0 text-indigo-500 dark:text-indigo-400"
			>
				<polygon points="12 2 2 7 12 12 22 7 12 2" />
				<polyline points="2 17 12 22 22 17" />
				<polyline points="2 12 12 17 22 12" />
			</svg>
		),
	},
	{
		id: "openai",
		name: "OpenAI",
		description: "State-of-the-art native GPT intelligence",
		placeholder: "sk-proj-...",
		modelPlaceholder: "e.g. gpt-4o",
		icon: (
			<svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5 shrink-0">
				<path d="M22.28 10.12A8.44 8.44 0 0 0 20.3 5.4c-1.2-1.2-2.8-1.78-4.48-1.57A8.4 8.4 0 0 0 9 2.13C7.26 1.77 5.46 2.45 4.34 3.8a8.3 8.3 0 0 0-2.02 4.7 8.32 8.32 0 0 0 .54 4.54A8.34 8.34 0 0 0 4 17.65c1.24 1.25 2.92 1.83 4.65 1.58A8.4 8.4 0 0 0 15 21l.36-.04c1.7-.58 3.06-1.85 3.73-3.48a8.27 8.27 0 0 0 2.22-4.66c.2-1.54-.12-3.1-.96-4.44h.02c.48-.68.78-1.46.9-2.26zM12 18V9l-6 3.46v5.86l6-3.45m7.8-10.4-3 5.2-6-3.46v-6.9l6 3.46m-3-1l-6-3.46L6 5.6l6 3.46V15l6-3.46m-12 7l3-5.2 6 3.46v6.92l-6-3.46M6 18.06v-5.86l6 3.46V21.5l-6-3.46M6 10l-6 3.46L6 16.9v-6.9m15 1L18 5.6l-6 3.46V15l6-3.46m-9-3.46l-6 3.46 6 3.46V15Z" />
			</svg>
		),
	},
	{
		id: "anthropic",
		name: "Anthropic",
		description: "Advanced safety research & Claude intelligence",
		placeholder: "sk-ant-...",
		modelPlaceholder: "e.g. claude-3-5-sonnet",
		icon: (
			<div className="w-5 h-5 shrink-0 rounded bg-[#D5C2AD] flex items-center justify-center p-0.5">
				<svg viewBox="0 0 24 24" fill="#000000" className="w-4 h-4 shrink-0">
					<path d="M17.485 5.518h2.003L8.628 17.61h-2L17.485 5.518zM14.015 11l-3.324 5.2H7L14.015 11z" />
				</svg>
			</div>
		),
	},
];

type TabId = "account" | "keys" | "preferences" | "redeem";

// ============================================================
// Main Component
// ============================================================
export default function SettingsPage() {
	const [activeTab, setActiveTab] = useState<TabId>("account");
	const router = useRouter();

	const tabs: {
		id: TabId;
		label: string;
		mobileLabel: string;
		icon: React.ReactNode;
	}[] = [
		{
			id: "account",
			label: "My Account",
			mobileLabel: "Account",
			icon: <UserIcon size={16} />,
		},
		{
			id: "keys",
			label: "API Provider Keys",
			mobileLabel: "Keys",
			icon: <KeyIcon size={16} />,
		},
		{
			id: "preferences",
			label: "Preferences",
			mobileLabel: "Prefs",
			icon: <SparklesIcon size={16} />,
		},
		{
			id: "redeem",
			label: "Redeem Voucher",
			mobileLabel: "Redeem",
			icon: <TicketIcon size={16} />,
		},
	];

	// Ensure desktop looks like a standard app container
	return (
		<div className="flex flex-col md:flex-row h-[100dvh] bg-white dark:bg-[#0a0a0a]">
			{/* Mobile Header */}
			<header className="flex md:hidden items-center justify-between px-4 h-14 border-b border-zinc-200 dark:border-white/10 bg-white dark:bg-[#0a0a0a] shrink-0 sticky top-0 z-20">
				<Button
					variant="ghost"
					size="icon"
					className="w-8 h-8 rounded-full text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100"
					onClick={() => router.push("/chat")}
				>
					<ArrowLeft size={18} />
				</Button>
				<h1 className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
					Settings
				</h1>
				<div className="w-8" />
			</header>

			{/* Desktop Sidebar Nav */}
			<aside className="hidden md:flex flex-col w-64 lg:w-72 border-r border-zinc-200 dark:border-white/10 bg-zinc-50/50 dark:bg-[#111111] shrink-0 overflow-y-auto">
				<div className="p-4 py-5 h-14 flex items-center mb-6">
					<Button
						variant="ghost"
						className="flex items-center gap-2 text-sm text-zinc-500 hover:text-zinc-900 dark:hover:text-zinc-100 font-medium px-2 hover:bg-transparent"
						onClick={() => router.push("/chat")}
					>
						<ArrowLeft size={16} />
						Back to Chat
					</Button>
				</div>

				<div className="flex flex-col px-3 gap-1">
					<div className="px-3 mb-2">
						<h2 className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 tracking-wider uppercase">
							General Settings
						</h2>
					</div>
					{tabs.map((tab) => (
						<button
							key={tab.id}
							type="button"
							onClick={() => setActiveTab(tab.id)}
							className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
								activeTab === tab.id
									? "bg-white dark:bg-[#222222] text-zinc-900 dark:text-white shadow-sm border border-zinc-200 dark:border-white/10"
									: "text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-[#1a1a1a] hover:text-zinc-900 dark:hover:text-zinc-200 border border-transparent"
							}`}
						>
							<div className="flex items-center gap-3">
								<span
									className={`${activeTab === tab.id ? "text-zinc-900 dark:text-white" : "text-zinc-400 dark:text-zinc-500"}`}
								>
									{tab.icon}
								</span>
								{tab.label}
							</div>
							<ChevronRightIcon
								size={14}
								className={`transition-opacity ${activeTab === tab.id ? "opacity-100 text-zinc-300 dark:text-zinc-600" : "opacity-0"}`}
							/>
						</button>
					))}
				</div>
			</aside>

			{/* Main Content Pane */}
			<main className="flex-1 overflow-y-auto">
				{/* Max width container, standard professional app spacing */}
				<div className="max-w-4xl mx-auto px-5 py-8 md:px-12 md:py-16 pb-32">
					<div className="animate-in fade-in slide-in-from-bottom-4 duration-500 ease-out fill-mode-both">
						{activeTab === "account" && <AccountTab />}
						{activeTab === "keys" && <CustomAITab />}
						{activeTab === "preferences" && <PersonalizationTab />}
						{activeTab === "redeem" && <RedeemTab />}
					</div>
				</div>
			</main>

			{/* Mobile Bottom Navigation */}
			<nav className="fixed right-0 bottom-0 left-0 z-50 flex flex-row border-zinc-200 border-t bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-[#0a0a0a]/90 md:hidden">
				<div className="grid w-full grid-cols-4 gap-1 px-2 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))]">
					{tabs.map((tab) => (
						<button
							aria-label={tab.label}
							key={tab.id}
							className={`relative flex h-13 min-w-0 flex-col items-center justify-center gap-1 rounded-xl transition-all duration-200 ${
								activeTab === tab.id
									? "text-zinc-900 dark:text-white"
									: "text-zinc-500 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-zinc-200"
							}`}
							onClick={() => setActiveTab(tab.id)}
							type="button"
						>
							{activeTab === tab.id && (
								<div className="absolute inset-0 bg-zinc-100 dark:bg-[#1a1a1a] rounded-xl -z-10" />
							)}
							{tab.icon}
							<span className="max-w-full truncate px-1 text-[10px] font-medium tracking-tight">
								{tab.mobileLabel}
							</span>
						</button>
					))}
				</div>
			</nav>
		</div>
	);
}

// ============================================================
// Shared UI Components
// ============================================================

const SectionHeader = ({
	title,
	description,
}: {
	title: string;
	description: string;
}) => (
	<div className="mb-8">
		<h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-50 mb-1.5 tracking-tight">
			{title}
		</h2>
		<p className="text-sm text-zinc-500 dark:text-zinc-400">{description}</p>
	</div>
);

const Card = ({
	children,
	className = "",
}: {
	children: React.ReactNode;
	className?: string;
}) => (
	<div
		className={`p-6 bg-white dark:bg-[#0a0a0a] border border-zinc-200 dark:border-white/10 rounded-xl overflow-hidden shadow-sm ${className}`}
	>
		{children}
	</div>
);

// ============================================================
// Account Tab
// ============================================================
function AccountTab() {
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
			toast.error("Failed to fetch user data.");
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
			toast.error("New passwords do not match.");
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
				toast.success("Password updated successfully.");
				setPasswordData({
					currentPassword: "",
					newPassword: "",
					confirmPassword: "",
				});
			} else {
				toast.error(data.error || "Failed to update password.");
			}
		} catch {
			toast.error("A network error occurred.");
		} finally {
			setUpdateLoading(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-48">
				<Loader2Icon className="animate-spin text-zinc-400" size={24} />
			</div>
		);
	}

	return (
		<div className="space-y-10 max-w-2xl">
			<SectionHeader
				title="Account Information"
				description="Manage your account profile, plan status, and daily limits."
			/>

			<div className="grid grid-cols-1 md:grid-cols-2 gap-4">
				<Card>
					<h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-500 mb-4">
						Profile
					</h3>
					<div className="flex items-center gap-4">
						<div className="w-12 h-12 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center shrink-0 border border-zinc-200 dark:border-white/10">
							<UserIcon
								size={20}
								className="text-zinc-600 dark:text-zinc-400"
							/>
						</div>
						<div className="overflow-hidden">
							<p className="text-sm font-medium text-zinc-900 dark:text-zinc-100 truncate">
								{user?.email || "Unknown User"}
							</p>
							<p className="text-xs text-zinc-500 mt-0.5">Primary email</p>
						</div>
					</div>
				</Card>

				<Card className="flex flex-col">
					<div className="flex justify-between items-start mb-4">
						<h3 className="text-xs font-semibold tracking-wider uppercase text-zinc-500">
							Plan & Usage
						</h3>
						{user?.isPro ? (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-400 border border-amber-200 dark:border-amber-800/50">
								PRO
							</span>
						) : (
							<span className="inline-flex items-center px-2 py-0.5 rounded text-[10px] font-medium bg-zinc-100 text-zinc-800 dark:bg-zinc-800 dark:text-zinc-300 border border-zinc-200 dark:border-zinc-700">
								FREE
							</span>
						)}
					</div>

					<div className="flex-1 flex flex-col justify-end">
						<div className="flex items-baseline gap-2">
							<span className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-white">
								{user?.isPro
									? "∞"
									: Math.max(0, 10 - (user?.messageCount || 0))}
							</span>
							{!user?.isPro && (
								<span className="text-sm font-medium text-zinc-500">/ 10</span>
							)}
						</div>
						<p className="text-xs text-zinc-500 mt-1">
							{user?.isPro
								? "Unlimited daily messages"
								: "Free daily messages remaining"}
						</p>
					</div>
				</Card>
			</div>

			<div className="h-px bg-zinc-200 dark:bg-white/10 w-full" />

			<div>
				<SectionHeader
					title="Change Password"
					description="Ensure your account is using a long, random password to stay secure."
				/>

				<form onSubmit={handlePasswordChange} className="space-y-4 max-w-sm">
					<div className="space-y-2">
						<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							Current Password
						</Label>
						<Input
							type="password"
							required
							className="h-10 px-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300"
							value={passwordData.currentPassword}
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									currentPassword: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2">
						<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							New Password
						</Label>
						<Input
							type="password"
							required
							className="h-10 px-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300"
							value={passwordData.newPassword}
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									newPassword: e.target.value,
								})
							}
						/>
					</div>
					<div className="space-y-2 mb-6">
						<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							Confirm New Password
						</Label>
						<Input
							type="password"
							required
							className="h-10 px-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300"
							value={passwordData.confirmPassword}
							onChange={(e) =>
								setPasswordData({
									...passwordData,
									confirmPassword: e.target.value,
								})
							}
						/>
					</div>

					<Button
						type="submit"
						disabled={updateLoading}
						className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-10 w-full sm:w-auto mt-2"
					>
						{updateLoading ? (
							<Loader2Icon className="animate-spin mr-2" size={16} />
						) : null}
						Update Password
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
			toast.error("Failed to load API keys.");
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
			toast.error("Failed to toggle status.");
		}
	};

	const handleSave = async (provider: string) => {
		const keysText = rawKeys[provider];
		if (!keysText?.trim()) {
			toast.error("Please enter at least one key.");
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
				toast.success("API keys saved successfully.");
				setRawKeys((prev) => ({ ...prev, [provider]: "" }));
				fetchKeys();
			} else {
				toast.error("Failed to save API keys.");
			}
		} catch {
			toast.error("Network error while saving.");
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
			toast.error("Provide a key before testing.");
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
				toast.success("Key connected successfully!");
			} else {
				toast.error(data.message || "Invalid API key.");
			}
		} catch {
			toast.error("Connection test failed.");
		} finally {
			setTesting(null);
		}
	};

	const handleAddModel = (provider: string) => {
		const modelId = newModel[provider]?.trim();
		if (!modelId) return;

		const current = apiKeys[provider]?.customModels || [];
		if (current.includes(modelId)) return;

		const updated = [...current, modelId];
		setApiKeys((prev) => ({
			...prev,
			[provider]: { ...prev[provider], customModels: updated },
		}));
		setNewModel((prev) => ({ ...prev, [provider]: "" }));

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
			toast.success("Configuration cleared.");
		} catch {
			toast.error("Failed to clear data.");
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-48">
				<Loader2Icon className="animate-spin text-zinc-400" size={24} />
			</div>
		);
	}

	return (
		<div className="space-y-10 max-w-3xl">
			<SectionHeader
				title="API Providers"
				description="Connect your own keys for leading AI providers. All keys are encrypted at rest."
			/>

			<div className="space-y-6">
				{PROVIDERS.map((provider) => {
					const data = apiKeys[provider.id];
					const isEnabled = data?.isEnabled ?? false;

					return (
						<div
							key={provider.id}
							className={`border rounded-xl transition-all duration-200 overflow-hidden ${
								isEnabled
									? "border-zinc-300 dark:border-zinc-700 bg-white dark:bg-[#0a0a0a] shadow-sm"
									: "border-zinc-200 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0f0f0f]"
							}`}
						>
							{/* Card Header */}
							<div className="p-6 border-b border-zinc-100 dark:border-white/5 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
								<div className="flex items-center gap-4">
									<div className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 border border-zinc-200/50 dark:border-white/5 bg-white dark:bg-zinc-900 shadow-sm">
										{provider.icon}
									</div>
									<div>
										<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
											{provider.name}
										</h3>
										<p className="text-xs text-zinc-500 mt-0.5">
											{provider.description}
										</p>
									</div>
								</div>

								<button
									type="button"
									role="switch"
									aria-checked={isEnabled}
									onClick={() => handleToggle(provider.id, !isEnabled)}
									className={`relative shrink-0 w-11 h-6 rounded-full transition-colors outline-none focus-visible:ring-2 focus-visible:ring-offset-2 ring-offset-white dark:ring-offset-black focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300 ${
										isEnabled
											? "bg-zinc-900 dark:bg-zinc-200"
											: "bg-zinc-200 dark:bg-zinc-800"
									}`}
								>
									<span className="sr-only">
										Toggle {provider.name} provider
									</span>
									<span
										className={`pointer-events-none absolute left-[2px] top-[2px] h-5 w-5 rounded-full bg-white transition-transform ${
											isEnabled
												? "translate-x-5 shadow-sm dark:bg-zinc-900"
												: "translate-x-0"
										}`}
									/>
								</button>
							</div>

							{/* Card Body */}
							<div className="p-6 space-y-6">
								{/* Extracted Keys list */}
								{data?.maskedKeys && data.maskedKeys.length > 0 && (
									<div>
										<Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
											ACTIVE KEYS
										</Label>
										<div className="flex flex-wrap gap-2">
											{data.maskedKeys.map((mk, i) => (
												<span
													key={`${provider.id}-mask-${i}`}
													className="px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800/50 text-zinc-600 dark:text-zinc-400 border border-zinc-200 dark:border-white/10 text-xs font-mono tracking-tight flex items-center"
												>
													<KeyIcon size={12} className="mr-1.5 opacity-50" />
													{mk}
												</span>
											))}
										</div>
									</div>
								)}

								{/* Entry Box */}
								<div>
									<div className="flex items-center justify-between mb-2">
										<Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300">
											ADD KEYS
										</Label>
										<span className="text-[10px] text-zinc-500">
											Comma/newline separated
										</span>
									</div>
									<textarea
										className="w-full h-20 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm font-mono placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300 resize-none shadow-sm"
										placeholder={provider.placeholder}
										value={rawKeys[provider.id] || ""}
										onChange={(e) =>
											setRawKeys((prev) => ({
												...prev,
												[provider.id]: e.target.value,
											}))
										}
									/>
								</div>

								{/* Models configuration */}
								<div>
									<Label className="text-xs font-medium text-zinc-700 dark:text-zinc-300 mb-2 block">
										CUSTOM MODELS
									</Label>
									<div className="flex gap-2">
										<Input
											className="h-9 px-3 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 text-sm shadow-sm"
											placeholder={provider.modelPlaceholder}
											value={newModel[provider.id] || ""}
											onChange={(e) =>
												setNewModel((prev) => ({
													...prev,
													[provider.id]: e.target.value,
												}))
											}
											onKeyDown={(e) => {
												if (e.key === "Enter") {
													e.preventDefault();
													handleAddModel(provider.id);
												}
											}}
										/>
										<Button
											variant="secondary"
											onClick={() => handleAddModel(provider.id)}
											className="h-9 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shrink-0"
										>
											Add
										</Button>
									</div>
									{(data?.customModels || []).length > 0 && (
										<div className="flex flex-wrap gap-2 mt-3 p-3 bg-zinc-50 dark:bg-[#0f0f0f] rounded-lg border border-zinc-100 dark:border-white/5">
											{data?.customModels.map((model) => (
												<span
													key={model}
													className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 text-[11px] text-zinc-700 dark:text-zinc-300 shadow-sm"
												>
													{model}
													<button
														type="button"
														onClick={() =>
															handleRemoveModel(provider.id, model)
														}
														className="text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-100 ml-0.5 outline-none rounded-full focus-visible:ring-1 focus-visible:ring-zinc-500"
														aria-label={`Remove model ${model}`}
													>
														×
													</button>
												</span>
											))}
										</div>
									)}
								</div>

								{/* Action Buttons */}
								<div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-white/5">
									<div className="flex items-center gap-2">
										<Button
											variant="outline"
											size="sm"
											className="h-9 text-xs font-medium border-zinc-200 dark:border-white/10"
											disabled={
												testing === provider.id || !rawKeys[provider.id]?.trim()
											}
											onClick={() => handleTest(provider.id)}
										>
											{testing === provider.id ? (
												<Loader2Icon
													className="animate-spin mr-1.5"
													size={14}
												/>
											) : null}
											Test Setup
										</Button>
										<Button
											size="sm"
											className="h-9 text-xs font-medium bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200"
											disabled={
												saving === provider.id || !rawKeys[provider.id]?.trim()
											}
											onClick={() => handleSave(provider.id)}
										>
											{saving === provider.id ? (
												<Loader2Icon
													className="animate-spin mr-1.5"
													size={14}
												/>
											) : null}
											Save
										</Button>
									</div>

									{data && (
										<Button
											variant="ghost"
											size="sm"
											className="h-9 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 dark:text-red-400 dark:hover:text-red-300 dark:hover:bg-red-950/30"
											onClick={() => handleDelete(provider.id)}
										>
											Clear Config
										</Button>
									)}
								</div>
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
				// Ignores if unconfigured
			} finally {
				setLoading(false);
			}
		}
		load();
	}, []);

	const handleSave = async (e: React.FormEvent) => {
		e.preventDefault();
		setSaving(true);
		try {
			const res = await fetch("/api/user/settings/personalization", {
				method: "PATCH",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify(settings),
			});
			if (res.ok) {
				toast.success("Preferences saved successfully.");
			} else {
				toast.error("Failed to save changes.");
			}
		} catch {
			toast.error("Network error while saving.");
		} finally {
			setSaving(false);
		}
	};

	if (loading) {
		return (
			<div className="flex justify-center items-center h-48">
				<Loader2Icon className="animate-spin text-zinc-400" size={24} />
			</div>
		);
	}

	return (
		<div className="space-y-10 max-w-2xl">
			<SectionHeader
				title="AI Preferences"
				description="Customize how the AI behaves and responds to you across all chats."
			/>

			<form onSubmit={handleSave} className="space-y-6">
				<div className="space-y-2">
					<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Display Name
					</Label>
					<Input
						className="h-10 bg-white dark:bg-zinc-900 border-zinc-200 dark:border-white/10 dark:text-zinc-100 max-w-sm"
						placeholder="What should the AI call you?"
						value={settings.displayName || ""}
						onChange={(e) =>
							setSettings({ ...settings, displayName: e.target.value })
						}
					/>
				</div>

				<div className="space-y-2">
					<div className="flex items-center justify-between">
						<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
							System Instructions
						</Label>
					</div>
					<textarea
						className="w-full h-32 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm placeholder:text-zinc-400 dark:placeholder:text-zinc-600 outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300 resize-none shadow-sm dark:text-zinc-100 line-height-[1.6]"
						placeholder="E.g. Always respond in Markdown. I'm a senior React developer requiring concise code snippets..."
						value={settings.customInstructions || ""}
						onChange={(e) =>
							setSettings({ ...settings, customInstructions: e.target.value })
						}
					/>
					<p className="text-xs text-zinc-500">
						These instructions will be prepended to the system prompt in new
						chats.
					</p>
				</div>

				<div className="space-y-2">
					<Label className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
						Language Model Output
					</Label>
					<select
						className="w-full max-w-xs h-10 px-3 py-2 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-white/10 rounded-lg text-sm text-zinc-900 dark:text-zinc-100 outline-none focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300 shadow-sm"
						value={settings.language || "en"}
						onChange={(e) =>
							setSettings({ ...settings, language: e.target.value })
						}
					>
						<option value="en">English (Default)</option>
						<option value="id">Bahasa Indonesia</option>
					</select>
				</div>

				<div className="pt-4">
					<Button
						type="submit"
						disabled={saving}
						className="bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-10 px-6 w-full sm:w-auto"
					>
						{saving ? (
							<Loader2Icon className="animate-spin mr-2" size={16} />
						) : null}
						Save Preferences
					</Button>
				</div>
			</form>
		</div>
	);
}

// ============================================================
// Redeem Voucher Tab
// ============================================================
function RedeemTab() {
	const [code, setCode] = useState("");
	const [loading, setLoading] = useState(false);
	const [result, setResult] = useState<{
		type: string;
		message: string;
	} | null>(null);

	const handleRedeem = async (e: React.FormEvent) => {
		e.preventDefault();
		if (!code.trim()) {
			toast.error("Code cannot be empty.");
			return;
		}

		setLoading(true);
		setResult(null);

		try {
			const res = await fetch("/api/redeem", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ code: code.trim().toUpperCase() }),
			});
			const data = await res.json();

			if (data.error) {
				setResult({ type: "error", message: data.error });
				toast.error(data.error);
			} else {
				const msg =
					data.type === "PRO"
						? "PRO status activated successfully!"
						: `${data.value || 0} credits added to your account!`;
				setResult({ type: "success", message: msg });
				toast.success(msg);
				setCode(""); // Clear on success
			}
		} catch {
			const errMsg = "A network error occurred. Please try again.";
			setResult({ type: "error", message: errMsg });
			toast.error(errMsg);
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="space-y-10 max-w-2xl">
			<SectionHeader
				title="Redeem Voucher"
				description="Claim PRO access days or bonus credits via an exclusive voucher code."
			/>

			<Card className="max-w-md">
				<form onSubmit={handleRedeem} className="space-y-6">
					<div className="space-y-3">
						<Label
							htmlFor="voucherCode"
							className="text-sm font-medium text-zinc-700 dark:text-zinc-300"
						>
							Voucher Code
						</Label>
						<div className="relative">
							<TicketIcon
								className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
								size={18}
							/>
							<Input
								id="voucherCode"
								autoComplete="off"
								spellCheck="false"
								className="h-12 pl-10 bg-white dark:bg-zinc-900/50 border-zinc-200 dark:border-white/10 font-mono tracking-widest uppercase text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-400 dark:placeholder:text-zinc-600 focus-visible:ring-1 focus-visible:ring-zinc-900 dark:focus-visible:ring-zinc-300 shadow-sm"
								placeholder="ULTRA-XXXXXXXX"
								value={code}
								onChange={(e) => {
									// Normalize instantly for better parsing UX
									setCode(
										e.target.value.replace(/[^a-zA-Z0-9-]/g, "").toUpperCase(),
									);
								}}
								maxLength={32}
							/>
						</div>
					</div>

					<Button
						type="submit"
						disabled={loading || code.length < 5}
						className="w-full bg-zinc-900 text-white hover:bg-zinc-800 dark:bg-white dark:text-black dark:hover:bg-zinc-200 h-11"
					>
						{loading ? (
							<Loader2Icon className="animate-spin mr-2" size={16} />
						) : null}
						Apply Code
					</Button>
				</form>

				{result && (
					<div
						className={`mt-6 p-4 rounded-lg flex items-start gap-3 border text-sm ${
							result.type === "success"
								? "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-900/50 text-emerald-800 dark:text-emerald-300"
								: "bg-red-50 dark:bg-red-950/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-300"
						}`}
					>
						<div className="shrink-0 mt-0.5">
							{result.type === "success" ? (
								<SparklesIcon size={16} className="text-emerald-500" />
							) : (
								<LockIcon size={16} className="text-red-500" />
							)}
						</div>
						<p className="font-medium">{result.message}</p>
					</div>
				)}
			</Card>

			<div className="pt-2">
				<h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-4">
					Types of Vouchers
				</h3>
				<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
					<div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0f0f0f]">
						<div className="w-8 h-8 rounded-full bg-amber-100 dark:bg-amber-900/30 text-amber-600 dark:text-amber-400 flex items-center justify-center mb-3">
							<SparklesIcon size={14} />
						</div>
						<h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
							PRO Membership
						</h4>
						<p className="text-xs text-zinc-500 line-height-[1.5]">
							Unlocks unlimited queries and premium models for the duration
							specified in the voucher.
						</p>
					</div>
					<div className="p-4 rounded-xl border border-zinc-100 dark:border-white/5 bg-zinc-50/50 dark:bg-[#0f0f0f]">
						<div className="w-8 h-8 rounded-full bg-indigo-100 dark:bg-indigo-900/30 text-indigo-600 dark:text-indigo-400 flex items-center justify-center mb-3">
							<ZapIcon size={14} />
						</div>
						<h4 className="text-sm font-medium text-zinc-900 dark:text-zinc-100 mb-1">
							Message Credits
						</h4>
						<p className="text-xs text-zinc-500 line-height-[1.5]">
							Permanently adds to your message allowance, used after your free
							daily tier limits are reached.
						</p>
					</div>
				</div>
			</div>
		</div>
	);
}
