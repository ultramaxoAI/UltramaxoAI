import { redirect } from "next/navigation";
import { Suspense } from "react";
import { auth } from "@/app/(auth)/auth";
import LoginClient from "./login-client";

const CHAT_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

function getSafeCallbackUrl(callbackUrl?: string) {
	if (!callbackUrl) return CHAT_URL;
	if (!callbackUrl.startsWith("/") || callbackUrl.startsWith("//"))
		return CHAT_URL;
	return callbackUrl;
}

export default async function Page({
	searchParams,
}: {
	searchParams?: Promise<{ callbackUrl?: string }>;
}) {
	const session = await auth();
	const resolvedSearchParams = await searchParams;
	const callbackUrl = getSafeCallbackUrl(resolvedSearchParams?.callbackUrl);

	if (session?.user?.id) {
		redirect(callbackUrl);
	}

	return (
		<Suspense fallback={null}>
			<LoginClient callbackUrl={callbackUrl} />
		</Suspense>
	);
}
