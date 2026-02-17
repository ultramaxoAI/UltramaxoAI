import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import { PricingPage } from "@/components/pricing-page";

export default async function PlanPage() {
  const session = await auth();
  
  // Auto-redirect if user is already PRO
  if (session?.user?.type === "pro") {
    redirect("/chat");
  }
  
  return <PricingPage user={session?.user} />;
}
