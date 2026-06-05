import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import BuilderWorkspaceClient from "@/components/builder/workspace-client";

export default async function WorkspacePage({ params }: { params: { id: string } }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  return <BuilderWorkspaceClient projectId={params.id} user={session.user} />;
}
