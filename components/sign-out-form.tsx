import Form from "next/form";

import { signOut } from "@/app/(auth)/auth";

const logoutRedirect =
	process.env.NODE_ENV === "production"
		? "https://ultramaxo.tech/login?loggedOut=1"
		: "/login?loggedOut=1";

export const SignOutForm = () => {
	return (
		<Form
			action={async () => {
				"use server";

				await signOut({
					redirectTo: logoutRedirect,
				});
			}}
			className="w-full"
		>
			<button
				className="w-full px-1 py-0.5 text-left text-red-500"
				type="submit"
			>
				Sign out
			</button>
		</Form>
	);
};
