---
name: typed-service-contracts
description: "Enforces type-safe API contracts between frontend and backend. Use when defining API endpoints, creating shared types, validating payloads, or integrating Next.js with external/backend services. Covers Zod, TypeScript, tRPC-style patterns, and Drizzle schema alignment."
risk: safe
source: "ClawForge / Custom"
date_added: "2026-04-23"
---

# Typed Service Contracts Skill

This skill ensures that data flowing between frontend and backend is strictly typed, validated, and predictable. Eliminates runtime surprises by catching contract mismatches at build time.

## 🎯 When to Use
- Defining new API routes or server actions.
- Creating shared types between frontend and backend.
- Validating request/response payloads.
- Syncing database schemas (Drizzle) with API types.
- Building internal SDKs or service layers.

## 1. Shared Types
- **Single Source of Truth**: Define types in a shared location (e.g., `lib/types.ts`, `types/api.ts`) imported by both frontend and backend.
- **Runtime + Compile-time**: Use Zod schemas as the source of truth, then infer TypeScript types from them.
  ```typescript
  import { z } from "zod";
  export const UserSchema = z.object({
    id: z.string().uuid(),
    email: z.string().email(),
    name: z.string().min(1).max(100),
  });
  export type User = z.infer<typeof UserSchema>;
  ```
- **No Duplication**: Never define a separate TypeScript interface and Zod schema manually. Derive one from the other.

## 2. API Route Contracts
- **Request Validation**: Validate every incoming request with Zod before processing.
  ```typescript
  const body = requestSchema.parse(await req.json()); // throws on bad input
  ```
- **Response Typing**: Return typed responses. Use a standard envelope:
  ```typescript
  type ApiResponse<T> = { success: true; data: T } | { success: false; error: string; code: string };
  ```
- **Error Handling**: Return consistent HTTP status codes and typed error responses. Don't leak internal stack traces.
- **Method Safety**: Use specific HTTP methods (`GET`, `POST`, `PUT`, `PATCH`, `DELETE`). Don't overload `POST` for everything.

## 3. Server Actions (Next.js)
- **Input Validation**: Always wrap server actions with Zod validation.
  ```typescript
  "use server";
  export async function createUser(input: unknown) {
    const data = CreateUserSchema.parse(input);
    // ... db logic
  }
  ```
- **Return Types**: Return typed results, never throw raw errors to the client. Use `try/catch` and map to user-friendly messages.
- **Auth Boundaries**: Validate session/permissions inside the action, not just at the route level.

## 4. Drizzle Schema Alignment
- **Schema as Contract**: Drizzle schema definitions should map 1:1 with API types.
- **Select/Insert Types**: Use Drizzle's `inferSelectModel` and `inferInsertModel` for DB types.
  ```typescript
  import { users } from "@/db/schema";
  import { inferSelectModel } from "drizzle-orm";
  export type DbUser = inferSelectModel<typeof users>;
  ```
- **Transforms**: If DB shape differs from API shape, create explicit mapper functions (`toApiUser(dbUser)`) rather than casting.
- **Migrations**: Every schema change needs a migration. Run `drizzle-kit generate` and commit migration files.

## 5. Client Integration
- **Fetch Wrappers**: Create a typed fetch wrapper that attaches auth headers, handles base URL, and parses responses.
  ```typescript
  async function api<T>(path: string, options?: RequestInit): Promise<T> {
    const res = await fetch(`${API_BASE}${path}`, { ...options, headers: { "Content-Type": "application/json", ...options?.headers } });
    if (!res.ok) throw new ApiError(res.status, await res.json());
    return res.json() as Promise<T>;
  }
  ```
- **No `any`**: Ban `any` in network layers. Use `unknown` + Zod parse if the API contract is external/untrusted.
- **Caching Strategy**: Use React Query / SWR with typed keys. Cache keys should include all variables that affect the response.

## 6. Contract Evolution
- **Versioning**: If breaking changes are unavoidable, version the API (`/api/v2/...`).
- **Deprecation**: Mark deprecated fields in Zod with `.describe("deprecated: use fullName instead")` and log warnings.
- **Backward Compatibility**: Add optional fields rather than renaming required ones. Handle missing fields gracefully.

## 🛠️ Implementation Checklist
- [ ] Is every request validated with Zod before processing?
- [ ] Are types shared between frontend and backend from a single source?
- [ ] Does the API return a consistent typed response envelope?
- [ ] Are Drizzle schemas aligned with API types via explicit mappers?
- [ ] Is there no `any` type in the network/service layer?
- [ ] Are server actions wrapped in try/catch with typed error returns?
- [ ] Is there a typed fetch wrapper for client-side API calls?
