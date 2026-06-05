import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import BuilderDashboardClient from "@/components/builder/dashboard-client";

export default async function BuilderPage() {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <BuilderDashboardClient user={session.user} />;
}
