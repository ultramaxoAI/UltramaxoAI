"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = chatRoutes;
const db_1 = require("../utils/db");
async function chatRoutes(fastify, _options) {
    // Protect route with JWT verification
    fastify.addHook('preHandler', async (request, reply) => {
        try {
            await request.jwtVerify();
        }
        catch (err) {
            return reply.code(401).send({ error: 'Unauthorized. Invalid or missing token.' });
        }
    });
    // Chat endpoint (SSE stream proxy to FreeModel.dev)
    fastify.post('/', async (request, reply) => {
        const user = request.user;
        const { messages, projectId } = request.body;
        if (!messages || !Array.isArray(messages) || messages.length === 0) {
            return reply.code(400).send({ error: 'Messages array is required' });
        }
        try {
            // 1. Check user plan limits
            const dbUser = await db_1.prisma.user.findUnique({
                where: { id: user.id },
            });
            if (!dbUser) {
                return reply.code(404).send({ error: 'User not found' });
            }
            if (dbUser.aiUsageToday >= dbUser.aiUsageLimit) {
                return reply.code(402).send({
                    error: 'Daily AI usage limit reached. Please upgrade your plan or try again tomorrow.',
                });
            }
            const apiKey = process.env.FREEMODEL_API_KEY || 'fe_oa_a0a141248ea57219eb7a55450d189c22a6aafacc4af0eb5b';
            const baseUrl = process.env.FREEMODEL_BASE_URL || 'https://api.freemodel.dev';
            // 2. Setup system instructions if not present
            const systemPrompt = {
                role: 'system',
                content: `You are UltraaxoAI, an expert web developer AI agent. 
You write high-quality, production-ready code.
You are running in a client-side WebContainer Node.js sandbox.
You have access to write files, read files, and execute terminal commands.

When you want to perform actions, you MUST use XML-style tool calls that the parser can execute.
Format your tool calls exactly like this (do not escape tags):

<tool name="write_file" path="src/components/Counter.tsx">
import React from 'react';
// file content here...
</tool>

<tool name="run_command" cmd="npm install lucide-react"></tool>

Available tools:
1. write_file: path (attribute), content (inner text) - Writes a file to workspace
2. read_file: path (attribute) - Reads file content
3. delete_file: path (attribute) - Deletes a file
4. list_dir: path (attribute) - Lists directory contents
5. run_command: cmd (attribute) - Runs terminal commands (e.g., npm install, npm run build, npm run dev)

Do not run commands that block the terminal unless necessary. Always output thoughts explaining what you are doing before executing tool calls.`,
            };
            // Prep messages array
            const apiMessages = [systemPrompt, ...messages];
            // 3. Request completions from FreeModel.dev (OpenAI compatible)
            const aiResponse = await fetch(`${baseUrl}/v1/chat/completions`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Authorization: `Bearer ${apiKey}`,
                },
                body: JSON.stringify({
                    model: 'gpt-5.5',
                    messages: apiMessages,
                    stream: true,
                }),
            });
            if (!aiResponse.ok) {
                const errText = await aiResponse.text();
                fastify.log.error(`FreeModel API Error: ${errText}`);
                return reply.code(502).send({ error: 'AI provider returned an error', details: errText });
            }
            if (!aiResponse.body) {
                return reply.code(500).send({ error: 'No response stream from AI provider' });
            }
            // 4. Setup SSE headers on Fastify reply
            reply.raw.writeHead(200, {
                'Content-Type': 'text/event-stream',
                'Cache-Control': 'no-cache',
                Connection: 'keep-alive',
                'Access-Control-Allow-Origin': '*',
            });
            const reader = aiResponse.body.getReader();
            const decoder = new TextDecoder('utf-8');
            let fullContent = '';
            let isClosed = false;
            // Read the stream and write to reply
            while (!isClosed) {
                const { done, value } = await reader.read();
                if (done) {
                    isClosed = true;
                    break;
                }
                const chunk = decoder.decode(value, { stream: true });
                reply.raw.write(chunk);
                // Simple token estimation/parsing to keep track of content
                // In OpenAI format, chunks look like: data: {"choices": [{"delta": {"content": "..."}}]}
                const lines = chunk.split('\n');
                for (const line of lines) {
                    if (line.startsWith('data: ')) {
                        const dataStr = line.slice(6).trim();
                        if (dataStr === '[DONE]')
                            continue;
                        try {
                            const data = JSON.parse(dataStr);
                            const content = data.choices?.[0]?.delta?.content || '';
                            fullContent += content;
                        }
                        catch (e) {
                            // Ignore parse errors on partial lines
                        }
                    }
                }
            }
            reply.raw.end();
            // 5. Update user AI usage stats in database asynchronously
            // Estimate token count (words * 1.3 + system prompt overhead)
            const wordsCount = fullContent.split(/\s+/).length;
            const estimatedTokens = Math.max(100, Math.round(wordsCount * 1.3) + 1000);
            // Increment usage in DB
            await db_1.prisma.user.update({
                where: { id: user.id },
                data: {
                    aiUsageToday: {
                        increment: estimatedTokens,
                    },
                },
            });
            // Save the last exchange to message history if projectId is provided
            if (projectId && messages.length > 0) {
                const lastUserMessage = messages[messages.length - 1];
                // Save user message and assistant message
                await db_1.prisma.message.createMany({
                    data: [
                        {
                            projectId,
                            role: 'user',
                            content: lastUserMessage.content,
                        },
                        {
                            projectId,
                            role: 'assistant',
                            content: fullContent,
                        },
                    ],
                });
            }
        }
        catch (error) {
            fastify.log.error(error);
            // If we haven't written headers yet, send a JSON error
            if (!reply.raw.headersSent) {
                return reply.code(500).send({ error: 'Internal server error in AI proxy stream' });
            }
            else {
                // End the raw response
                reply.raw.end();
            }
        }
    });
}
