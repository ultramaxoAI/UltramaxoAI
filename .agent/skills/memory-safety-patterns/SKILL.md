---
name: memory-safety-patterns
description: "Ensures critical context, decisions, and project state are persisted across sessions. Use when managing long-term memory files, documenting architecture decisions, tracking TODOs, or maintaining project context for agents."
risk: safe
source: "ClawForge / Custom"
date_added: "2026-04-23"
---

# Memory Safety Patterns Skill

This skill prevents context loss by defining where and how to store project memory. It ensures that agents (and humans) can resume work without re-discovering facts.

## 🎯 When to Use
- Starting a new feature or complex task.
- Making architectural decisions that affect multiple files.
- Discovering non-obvious project quirks (env vars, deployment steps, auth flows).
- Ending a session and needing to hand off context.
- Documenting why a certain library, pattern, or workaround was chosen.

## 1. Core Memory Files
Maintain these files in the project root (or `.agent/memory/`):
- **`ARCHITECTURE.md`**: High-level system design, tech stack, data flow, deployment architecture.
- **`DECISIONS.md`**: Architecture Decision Records (ADRs). Date, context, decision, consequences.
- **`TODO.md`**: Active tasks, blockers, and next steps. Update on every session end.
- **`CONTEXT.md`**: Environment quirks, auth setup, required env vars, local dev gotchas.
- **`API.md`**: External API integrations, rate limits, webhook flows, API key locations (never store actual keys).

## 2. Writing Rules
- **Append, Don't Overwrite**: Add new decisions/context with timestamps. Mark old ones as `[DEPRECATED YYYY-MM-DD]` if superseded.
- **Atomic Facts**: One idea per paragraph or bullet. Avoid walls of text.
- **Explicit Links**: Reference filenames, function names, or commit SHAs when relevant.
  ```markdown
  ## 2026-04-23: Auth Flow Decision
  - **Context**: Clerk JWT validation needs to happen in both middleware and API routes.
  - **Decision**: Created `lib/auth.ts:verifyToken()` reused by `middleware.ts` and `app/api/*`.
  - **Consequences**: Single source of truth for auth logic.
  ```
- **Assume Amnesia**: Write as if the next reader knows nothing about the project.

## 3. Memory Hygiene
- **Session Bookends**: 
  - **Start**: Read `TODO.md` and `CONTEXT.md` to catch up.
  - **End**: Update `TODO.md` with progress, new blockers, and next actions.
- **Decision Fatigue**: If you spend >10 minutes deciding between two approaches, document it in `DECISIONS.md` immediately.
- **Cleanup**: Monthly review of memory files. Archive completed TODOs to `TODO_ARCHIVE.md`.
- **Searchable**: Use clear headings and tags (`#auth`, `#database`, `#deployment`) for grep-ability.

## 4. Code as Memory
- **Comments for Context**: When a code choice is weird due to external constraints, add a comment with a date and explanation.
  ```typescript
  // HACK 2026-04-23: Drizzle doesn't support this specific Postgres feature yet.
  // Revisit after drizzle-orm > 0.30. See DECISIONS.md#drizzle-workaround.
  ```
- **TODO Comments**: Use `TODO(agent): ...` or `FIXME(agent): ...` for items that require external context.
- **Type Definitions**: Complex types are memory. Document why unions/tuples are shaped a certain way.

## 5. Environment Memory
- **`.env.example`**: Must always be in sync with required env vars. Add a comment explaining each var.
- **Secrets**: Never commit secrets. Use `.env.local` for local, Vercel/Render dashboard for production.
- **Dependency Lockfiles**: `package-lock.json` is memory. Don't delete it. Document why if you must regenerate.

## 6. Cross-Session Agent Memory
When an agent resumes work:
1. Check `.agent/memory/` or root memory files.
2. Read the most recent `TODO.md` entry.
3. Verify `CONTEXT.md` for any env or setup requirements.
4. Only then begin coding.

Before ending:
1. Update `TODO.md` with checked-off items.
2. Log any new decisions to `DECISIONS.md`.
3. Note any new quirks to `CONTEXT.md`.

## 🛠️ Implementation Checklist
- [ ] Does the project have `ARCHITECTURE.md`, `DECISIONS.md`, `TODO.md`, and `CONTEXT.md`?
- [ ] Are all env vars documented in `.env.example` with explanations?
- [ ] Are weird code workarounds explained in comments with dates?
- [ ] Is `TODO.md` updated at the end of every session?
- [ ] Are decisions written with context + consequences, not just the decision?
- [ ] Are completed tasks archived so active TODOs remain actionable?
