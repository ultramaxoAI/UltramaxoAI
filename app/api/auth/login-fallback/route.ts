import { signIn } from "@/app/(auth)/auth";

function resolveRedirectTo(request: Request) {
	const url = new URL(request.url);
	const redirectTo = url.searchParams.get("redirectTo");

	if (redirectTo?.startsWith("/")) {
		return redirectTo;
	}

	return "/chat";
}

export async function POST(request: Request) {
	const formData = await request.formData();
	const username = String(formData.get("username") ?? "").trim();
	const password = String(formData.get("password") ?? "");

	return signIn("credentials", {
		username,
		password,
		redirect: true,
		redirectTo: resolveRedirectTo(request),
	});
}