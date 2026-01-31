import { auth } from "@/app/(auth)/auth";
import { notFound } from "next/navigation";
import AdminDashboardClient from "./client-page";

export default async function AdminPage() {
  const session = await auth();

  if (session?.user?.role !== 'admin') {
      return notFound();
  }

  return <AdminDashboardClient />;
}
