"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.default = authRoutes;
const bcrypt_1 = __importDefault(require("bcrypt"));
const db_1 = require("../utils/db");
const crypto_1 = require("../utils/crypto");
const SALT_ROUNDS = 10;
async function authRoutes(fastify, _options) {
    // Register
    fastify.post('/register', async (request, reply) => {
        const { email, password, name } = request.body;
        if (!email || !password || !name) {
            return reply.code(400).send({ error: 'Email, password, and name are required' });
        }
        try {
            const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
            if (existingUser) {
                return reply.code(409).send({ error: 'User with this email already exists' });
            }
            const passwordHash = await bcrypt_1.default.hash(password, SALT_ROUNDS);
            const user = await db_1.prisma.user.create({
                data: {
                    email,
                    passwordHash,
                    name,
                    plan: 'FREE',
                    aiUsageToday: 0,
                    aiUsageLimit: 50000,
                },
            });
            const token = fastify.jwt.sign({ id: user.id, email: user.email, name: user.name });
            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    avatarUrl: user.avatarUrl,
                },
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error during registration' });
        }
    });
    // Login
    fastify.post('/login', async (request, reply) => {
        const { email, password } = request.body;
        if (!email || !password) {
            return reply.code(400).send({ error: 'Email and password are required' });
        }
        try {
            const user = await db_1.prisma.user.findUnique({ where: { email } });
            if (!user || !user.passwordHash) {
                return reply.code(401).send({ error: 'Invalid email or password' });
            }
            const isPasswordValid = await bcrypt_1.default.compare(password, user.passwordHash);
            if (!isPasswordValid) {
                return reply.code(401).send({ error: 'Invalid email or password' });
            }
            const token = fastify.jwt.sign({ id: user.id, email: user.email, name: user.name });
            return {
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    avatarUrl: user.avatarUrl,
                    githubConnected: !!user.githubToken,
                },
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error during login' });
        }
    });
    // Get GitHub Authorization URL
    fastify.get('/oauth/github/url', async () => {
        const clientId = process.env.GITHUB_CLIENT_ID || '';
        const redirectUri = process.env.GITHUB_REDIRECT_URI || '';
        const scope = 'user repo';
        const githubUrl = `https://github.com/login/oauth/authorize?client_id=${clientId}&redirect_uri=${encodeURIComponent(redirectUri)}&scope=${encodeURIComponent(scope)}`;
        return { url: githubUrl };
    });
    // GitHub OAuth Callback
    fastify.post('/oauth/github/callback', async (request, reply) => {
        const { code } = request.body;
        if (!code) {
            return reply.code(400).send({ error: 'Authorization code is required' });
        }
        const clientId = process.env.GITHUB_CLIENT_ID;
        const clientSecret = process.env.GITHUB_CLIENT_SECRET;
        if (!clientId || !clientSecret) {
            return reply.code(500).send({ error: 'GitHub OAuth config is missing on server' });
        }
        try {
            // 1. Exchange code for GitHub token
            const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                },
                body: JSON.stringify({
                    client_id: clientId,
                    client_secret: clientSecret,
                    code,
                }),
            });
            const tokenData = await tokenResponse.json();
            if (tokenData.error || !tokenData.access_token) {
                return reply.code(400).send({
                    error: 'GitHub authentication failed',
                    details: tokenData.error_description || tokenData.error,
                });
            }
            const githubToken = tokenData.access_token;
            // 2. Fetch user profile from GitHub
            const userResponse = await fetch('https://api.github.com/user', {
                headers: {
                    Authorization: `Bearer ${githubToken}`,
                    'User-Agent': 'UltraaxoAI-Backend',
                },
            });
            const userData = await userResponse.json();
            if (!userData.id) {
                return reply.code(400).send({ error: 'Failed to retrieve GitHub user details' });
            }
            // Encrypt the github token
            const encryptedGithubToken = (0, crypto_1.encryptToken)(githubToken);
            // 3. Upsert user in database
            // If user is already logged in (JWT present), we link github to their account.
            // Otherwise, we login/register using github.
            let user;
            let authorizationHeader = request.headers.authorization;
            if (authorizationHeader && authorizationHeader.startsWith('Bearer ')) {
                const decoded = fastify.jwt.verify(authorizationHeader.split(' ')[1]);
                user = await db_1.prisma.user.update({
                    where: { id: decoded.id },
                    data: {
                        githubId: String(userData.id),
                        githubToken: encryptedGithubToken,
                        avatarUrl: userData.avatar_url || null,
                    },
                });
            }
            else {
                // OAuth Register/Login
                user = await db_1.prisma.user.findUnique({
                    where: { githubId: String(userData.id) },
                });
                if (!user) {
                    // If email is returned by github, we check if a user with that email already exists
                    const email = userData.email || `${userData.login}@github.com`;
                    const existingUser = await db_1.prisma.user.findUnique({ where: { email } });
                    if (existingUser) {
                        // Link github to existing account
                        user = await db_1.prisma.user.update({
                            where: { email },
                            data: {
                                githubId: String(userData.id),
                                githubToken: encryptedGithubToken,
                                avatarUrl: userData.avatar_url || existingUser.avatarUrl,
                            },
                        });
                    }
                    else {
                        // Create new user
                        user = await db_1.prisma.user.create({
                            data: {
                                email,
                                name: userData.name || userData.login,
                                githubId: String(userData.id),
                                githubToken: encryptedGithubToken,
                                avatarUrl: userData.avatar_url || null,
                                plan: 'FREE',
                                aiUsageToday: 0,
                                aiUsageLimit: 50000,
                            },
                        });
                    }
                }
                else {
                    // Update github token
                    user = await db_1.prisma.user.update({
                        where: { id: user.id },
                        data: { githubToken: encryptedGithubToken },
                    });
                }
            }
            const jwtToken = fastify.jwt.sign({ id: user.id, email: user.email, name: user.name });
            return {
                token: jwtToken,
                user: {
                    id: user.id,
                    email: user.email,
                    name: user.name,
                    plan: user.plan,
                    avatarUrl: user.avatarUrl,
                    githubConnected: true,
                },
            };
        }
        catch (error) {
            fastify.log.error(error);
            return reply.code(500).send({ error: 'Internal server error during GitHub authentication' });
        }
    });
}
