import { redirect } from "next/navigation";

function resolveTarget(rawTarget?: string) {
	if (rawTarget?.startsWith("/")) {
		return rawTarget;
	}

	return "/chat";
}

export default async function OAuthCompletePage({
	searchParams,
}: {
	searchParams: Promise<{ target?: string }>;
}) {
	const { target } = await searchParams;
	redirect(resolveTarget(target));
}