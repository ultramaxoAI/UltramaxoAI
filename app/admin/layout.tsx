import { notFound } from "next/navigation";
import { auth } from "@/app/(auth)/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
	children,
}: {
	children: React.ReactNode;
}) {
	const session = await auth();

	if (session?.user?.role !== "admin") {
		return notFound();
	}

	return (
		<div className="flex min-h-screen bg-gray-50 dark:bg-black text-gray-900 dark:text-gray-100 font-sans selection:bg-indigo-100 selection:text-indigo-900 dark:selection:bg-indigo-900/30 dark:selection:text-indigo-200">
			<style>{`
				.dark select option {
					background-color: #0a0a0a;
					color: #fff;
				}
			`}</style>
			<AdminSidebar />
			<main className="flex-1 min-w-0 pb-20 md:pb-0">
				{children}
			</main>
		</div>
	);
}
