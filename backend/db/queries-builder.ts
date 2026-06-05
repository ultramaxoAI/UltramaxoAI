import "server-only";

import { eq, and, inArray } from "drizzle-orm";
import { db } from "./queries";
import { builderProject, builderFile } from "./schema";
import { generateUUID } from "@/lib/utils";

export async function getBuilderProjects(userId: string) {
  try {
    return await db
      .select()
      .from(builderProject)
      .where(eq(builderProject.userId, userId))
      .orderBy(builderProject.updatedAt);
  } catch (error) {
    console.error("Drizzle Error (getBuilderProjects):", error);
    throw new Error("Failed to get builder projects");
  }
}

export async function createBuilderProject(
  userId: string,
  name: string,
  description?: string,
  initialFiles?: Array<{ path: string; content: string }>
) {
  try {
    const projectId = generateUUID();
    
    // Perform transaction to create project and initial files
    await db.transaction(async (tx) => {
      await tx.insert(builderProject).values({
        id: projectId,
        name,
        description,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      });

      if (initialFiles && initialFiles.length > 0) {
        for (const file of initialFiles) {
          await tx.insert(builderFile).values({
            id: generateUUID(),
            path: file.path,
            content: file.content,
            projectId,
            createdAt: new Date(),
            updatedAt: new Date(),
          });
        }
      }
    });

    const [project] = await db
      .select()
      .from(builderProject)
      .where(eq(builderProject.id, projectId))
      .limit(1);

    const files = await db
      .select()
      .from(builderFile)
      .where(eq(builderFile.projectId, projectId));

    return {
      ...project,
      files,
    };
  } catch (error) {
    console.error("Drizzle Error (createBuilderProject):", error);
    throw new Error("Failed to create builder project");
  }
}

export async function getBuilderProject(projectId: string, userId: string) {
  try {
    const [project] = await db
      .select()
      .from(builderProject)
      .where(and(eq(builderProject.id, projectId), eq(builderProject.userId, userId)))
      .limit(1);

    if (!project) return null;

    const files = await db
      .select()
      .from(builderFile)
      .where(eq(builderFile.projectId, projectId));

    return {
      ...project,
      files,
    };
  } catch (error) {
    console.error("Drizzle Error (getBuilderProject):", error);
    throw new Error("Failed to get builder project details");
  }
}

export async function deleteBuilderProject(projectId: string, userId: string) {
  try {
    // Verify project belongs to user
    const [project] = await db
      .select()
      .from(builderProject)
      .where(and(eq(builderProject.id, projectId), eq(builderProject.userId, userId)))
      .limit(1);

    if (!project) return false;

    // Drizzle will handle cascade delete if specified, otherwise delete manually
    await db.transaction(async (tx) => {
      await tx.delete(builderFile).where(eq(builderFile.projectId, projectId));
      await tx.delete(builderProject).where(eq(builderProject.id, projectId));
    });

    return true;
  } catch (error) {
    console.error("Drizzle Error (deleteBuilderProject):", error);
    throw new Error("Failed to delete builder project");
  }
}

export async function syncBuilderProject(
  projectId: string,
  userId: string,
  files?: Array<{ path: string; content: string }>,
  deletedPaths?: string[]
) {
  try {
    // 1. Verify project ownership
    const [project] = await db
      .select()
      .from(builderProject)
      .where(and(eq(builderProject.id, projectId), eq(builderProject.userId, userId)))
      .limit(1);

    if (!project) {
      throw new Error("Project not found or unauthorized");
    }

    // 2. Perform updates in transaction
    await db.transaction(async (tx) => {
      // Delete requested files
      if (deletedPaths && deletedPaths.length > 0) {
        await tx.delete(builderFile).where(
          and(
            eq(builderFile.projectId, projectId),
            inArray(builderFile.path, deletedPaths)
          )
        );
      }

      // Upsert requested files
      if (files && files.length > 0) {
        for (const file of files) {
          // Check if file already exists in project
          const [existingFile] = await tx
            .select()
            .from(builderFile)
            .where(
              and(
                eq(builderFile.projectId, projectId),
                eq(builderFile.path, file.path)
              )
            )
            .limit(1);

          if (existingFile) {
            // Update
            await tx
              .update(builderFile)
              .set({
                content: file.content,
                updatedAt: new Date(),
              })
              .where(eq(builderFile.id, existingFile.id));
          } else {
            // Insert
            await tx.insert(builderFile).values({
              id: generateUUID(),
              path: file.path,
              content: file.content,
              projectId,
              createdAt: new Date(),
              updatedAt: new Date(),
            });
          }
        }
      }

      // Update project timestamp
      await tx
        .update(builderProject)
        .set({ updatedAt: new Date() })
        .where(eq(builderProject.id, projectId));
    });

    // Return the updated project state
    return await getBuilderProject(projectId, userId);
  } catch (error) {
    console.error("Drizzle Error (syncBuilderProject):", error);
    throw new Error("Failed to synchronize builder project files");
  }
}
