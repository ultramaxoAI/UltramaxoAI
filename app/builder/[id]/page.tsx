import { auth } from "@/app/(auth)/auth";
import { redirect } from "next/navigation";
import BuilderWorkspaceClient from "@/components/builder/workspace-client";

export default async function WorkspacePage({ params }: { params: Promise<{ id: string }> }) {
  const session = await auth();
  if (!session?.user) {
    redirect("/login");
  }

  const { id } = await params;
  return <BuilderWorkspaceClient projectId={id} user={session.user} />;
}

