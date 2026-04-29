import { redirect } from "next/navigation";
import { auth } from "@/app/(auth)/auth";

type PrivateLayoutProps = {
	children: React.ReactNode;
};

export default async function ApiConsolePrivateLayout({
	children,
}: PrivateLayoutProps) {
	const session = await auth();

	if (!session?.user?.id) {
		redirect("/login?callbackUrl=/api-console");
	}

	return children;
}
