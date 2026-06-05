import { auth } from "@/app/(auth)/auth";
import { NextResponse } from "next/server";
import { syncBuilderProject } from "@/backend/db/queries-builder";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { id } = await params;
    const { files, deletedPaths } = await request.json();
    
    const updatedProject = await syncBuilderProject(
      id,
      session.user.id,
      files,
      deletedPaths
    );


    return NextResponse.json(updatedProject);
  } catch (error: any) {
    console.error("Sync API Error:", error);
    return NextResponse.json({ error: error.message || "Internal server error" }, { status: 500 });
  }
}
