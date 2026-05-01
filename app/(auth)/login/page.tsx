import { Suspense } from "react";
import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import LoginClient from "./login-client";

const CHAT_URL =
	process.env.NODE_ENV === "production"
		? "https://chat.ultramaxo.tech/chat"
		: "/chat";

export default async function Page() {
	const session = await auth();

	if (session?.user?.id) {
		redirect(CHAT_URL);
	}

	return (
		<Suspense fallback={null}>
			<LoginClient />
		</Suspense>
	);
}
