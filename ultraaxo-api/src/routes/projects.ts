import { FastifyInstance, FastifyPluginOptions } from 'fastify';
import { prisma } from '../utils/db';

export default async function projectRoutes(fastify: FastifyInstance, _options: FastifyPluginOptions) {
  
  // Protect all routes in this plugin
  fastify.addHook('preHandler', async (request, reply) => {
    try {
      await request.jwtVerify();
    } catch (err) {
      return reply.code(401).send({ error: 'Unauthorized. Invalid or missing token.' });
    }
  });

  // Get all projects for logged-in user
  fastify.get('/', async (request) => {
    const user = request.user as { id: string };
    
    const projects = await prisma.project.findMany({
      where: { userId: user.id },
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        name: true,
        description: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return projects;
  });

  // Create a new project
  fastify.post('/', async (request, reply) => {
    const user = request.user as { id: string };
    const { name, description, files } = request.body as {
      name?: string;
      description?: string;
      files?: Array<{ path: string; content: string }>;
    };

    if (!name) {
      return reply.code(400).send({ error: 'Project name is required' });
    }

    try {
      const project = await prisma.project.create({
        data: {
          name,
          description,
          userId: user.id,
          files: files ? {
            createMany: {
              data: files.map(f => ({
                path: f.path,
                content: f.content,
              })),
            },
          } : undefined,
        },
        include: {
          files: true,
        },
      });

      return reply.code(210).send(project);
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error while creating project' });
    }
  });

  // Get project by ID (includes files and messages)
  fastify.get('/:id', async (request, reply) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    try {
      const project = await prisma.project.findUnique({
        where: { id },
        include: {
          files: true,
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      if (!project || project.userId !== user.id) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      return project;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error while fetching project' });
    }
  });

  // Delete project
  fastify.delete('/:id', async (request, reply) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };

    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project || project.userId !== user.id) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      await prisma.project.delete({
        where: { id },
      });

      return { success: true, message: 'Project deleted successfully' };
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error while deleting project' });
    }
  });

  // Sync endpoint - for background sync and offline edits
  fastify.post('/:id/sync', async (request, reply) => {
    const user = request.user as { id: string };
    const { id } = request.params as { id: string };
    const { files, deletedPaths, messages } = request.body as {
      files?: Array<{ path: string; content: string }>; // files to update/create
      deletedPaths?: string[]; // files to delete
      messages?: Array<{ role: string; content: string; stepLogs?: string }>; // new messages to append
    };

    try {
      const project = await prisma.project.findUnique({
        where: { id },
      });

      if (!project || project.userId !== user.id) {
        return reply.code(404).send({ error: 'Project not found' });
      }

      // Perform sync in transaction
      await prisma.$transaction(async (tx) => {
        // 1. Delete files
        if (deletedPaths && deletedPaths.length > 0) {
          await tx.file.deleteMany({
            where: {
              projectId: id,
              path: { in: deletedPaths },
            },
          });
        }

        // 2. Upsert files
        if (files && files.length > 0) {
          for (const file of files) {
            await tx.file.upsert({
              where: {
                projectId_path: {
                  projectId: id,
                  path: file.path,
                },
              },
              update: {
                content: file.content,
              },
              create: {
                projectId: id,
                path: file.path,
                content: file.content,
              },
            });
          }
        }

        // 3. Append messages
        if (messages && messages.length > 0) {
          await tx.message.createMany({
            data: messages.map(m => ({
              projectId: id,
              role: m.role,
              content: m.content,
              stepLogs: m.stepLogs || null,
            })),
          });
        }

        // 4. Update project timestamp
        await tx.project.update({
          where: { id },
          data: { updatedAt: new Date() },
        });
      });

      // Retrieve and return the fully updated project
      const updatedProject = await prisma.project.findUnique({
        where: { id },
        include: {
          files: true,
          messages: {
            orderBy: { createdAt: 'asc' },
          },
        },
      });

      return updatedProject;
    } catch (error) {
      fastify.log.error(error);
      return reply.code(500).send({ error: 'Internal server error during synchronization' });
    }
  });
}
