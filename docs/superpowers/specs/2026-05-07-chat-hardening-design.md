# Chat Hardening Design

Date: 2026-05-07
Project: UltramaxoV2
Status: Draft for review

## Goal
Stabilize the chat experience across desktop, mobile web, and PWA by fixing three linked issues:

1. AI responses sometimes do not appear.
2. Thinking animation feels low quality and inconsistent.
3. After creating or switching conversations, the conversation can appear in history but the user/assistant messages render empty or disappear.

## Scope
This work covers the end-to-end chat lifecycle:

- sending a message
- optimistic user rendering
- assistant thinking state
- assistant streaming state
- final persistence
- page refresh hydration
- switching conversations from sidebar
- creating a new conversation
- empty/loading/error rendering states

This work may change internal state architecture as needed, while keeping the visible UI broadly familiar.

## Problem Summary
The failures likely come from multiple overlapping sources of truth for chat state.

Likely symptoms:
- persisted messages and in-flight streamed content are merged inconsistently
- active conversation switching races with stream updates
- new chat initialization allows undefined or partial message state
- sidebar/history state and main chat state do not always agree
- thinking UI is coupled too tightly to final assistant message rendering

## Design Principles
- One source of truth for the active conversation.
- Separate persisted data from in-flight UI state.
- No stream update may write into the wrong conversation.
- New chat, switched chat, refreshed chat, and existing chat must share one state contract.
- Empty, loading, failed, thinking, streaming, and ready states must be explicit.
- Thinking UI should be its own lifecycle, not a fake final message.

## Target Architecture
Introduce a single chat state controller in the frontend for the active conversation.

The controller owns:
- `activeConversationId`
- `messages` (persisted/normalized message list)
- `assistantDraft` (in-flight assistant state)
- `status` (`idle | loading | ready | sending | thinking | streaming | error`)
- `requestId` for the current request
- metadata for hydration and retry

### State Model
Persisted messages:
- normalized server-backed chat messages
- stable ids
- safe role/content/timestamp defaults

Draft assistant state:
- temporary assistant response being thought/generated/streamed
- isolated from persisted messages until commit
- can transition to failed state with retry info

UI-only state:
- thinking phase
- loading conversation
- empty conversation
- switching conversation
- transient error banners

## Core Flows

### 1. Send Message
1. User submits prompt.
2. Create optimistic user message immediately.
3. Create assistant draft with status `thinking` and empty content.
4. When stream begins, assistant draft becomes `streaming`.
5. Stream chunks append only to the current request/conversation pair.
6. When complete, finalize draft into normalized persisted assistant message.
7. On failure, preserve user message and render assistant draft as failed instead of silently dropping it.

### 2. Create New Conversation
1. Create a valid empty conversation shell.
2. Reset active state to that shell atomically.
3. Clear previous draft/thinking state.
4. Render explicit empty state, never undefined state.
5. First user message binds to the active new conversation atomically so no old conversation data can leak in.

### 3. Switch Conversation From Sidebar
1. Update `activeConversationId`.
2. Invalidate or isolate in-flight request from previous chat.
3. Set status to `loading`.
4. Load and normalize target conversation snapshot.
5. Move to `ready` only when snapshot is complete enough to render.
6. Prevent stale stream or stale selector updates from mutating the newly active conversation.

### 4. Refresh / Rehydrate
1. Load persisted conversation snapshot.
2. Normalize messages before render.
3. Restore a valid empty state if the conversation exists but has no messages.
4. Avoid SSR/CSR mismatch by ensuring the same message shape and fallback rules on both sides.

## Anti-Race-Condition Rules

### Request Ownership
Every active generation request must carry:
- `conversationId`
- `requestId`

A chunk/event may update UI only if both values match the currently tracked request.

### Atomic Transitions
Conversation switches and new-chat resets must happen as single state transitions, not a chain of loosely related state updates.

### Stream Cancellation / Isolation
If the user switches chats or starts a new conversation while a stream is active, that stream must either:
- be cancelled, or
- be ignored by the now-active conversation state

### Safe Normalization
All incoming messages must be normalized to prevent blank render cases caused by partial payloads.

Normalization rules:
- generate/fill stable ids where safe
- coerce invalid role values to a safe fallback or drop with logging
- coerce missing text containers to empty content arrays/strings as appropriate
- preserve messages whenever possible rather than hiding them

## UI State Rules
The UI must distinguish:
- loading conversation
- empty conversation
- sending user message
- assistant thinking
- assistant streaming
- assistant failed
- ready conversation

The app must never render a “conversation exists but looks blank for unknown reasons” state.

## Thinking Animation Design
Replace scattered or duplicated thinking behavior with a single primary indicator component driven by explicit phases.

### Phases
- `thinking`: compact pre-response animation
- `streaming`: subtle “responding” motion while content is arriving
- `done`: quick fade-out once final message is stable

### Visual Requirements
- smooth on desktop and mobile
- minimal layout shift
- no sudden disappearance on first token
- visually cleaner than the current implementation
- shared behavior across chat entry points

### Component Direction
Consolidate duplicate/overlapping thinking implementations where practical so the app has one consistent behavior contract.

## Likely Files Affected
Frontend:
- `components/chat.tsx`
- `components/messages.tsx`
- `components/message.tsx`
- `components/sidebar-history.tsx`
- `components/sidebar-history-item.tsx`
- `components/ThinkingIndicator.tsx`
- `components/SimpleThinking.tsx`
- `components/AgentThinking.tsx`
- `app/(chat)/...`
- `app/(chat)/actions.ts`

Possibly supporting data/API helpers involved in loading, persisting, or transforming chat history.

## Implementation Shape
Recommended order:
1. audit and centralize active chat state flow
2. normalize message loading/persistence contract
3. isolate assistant draft/thinking/streaming state
4. harden new conversation and conversation switch transitions
5. unify thinking indicator phases and visuals
6. validate refresh, mobile, PWA, and sidebar edge cases

## Error Handling
- failed assistant responses remain visible with retry affordance
- malformed/partial persisted messages should be logged and normalized, not silently dropped
- stale stream events should be ignored deterministically
- empty conversation and loading conversation states must be explicit placeholders

## Testing Strategy
Manual and automated checks should cover:
- send message and receive stream
- slow stream where thinking state is visible
- refresh during active and completed conversation
- create new conversation and send first message
- switch conversations rapidly while streaming
- mobile viewport/PWA rendering
- sidebar history selection after several conversations
- failed response handling
- persisted conversation reload with prior assistant/user messages present

## Success Criteria
The work is successful when:
- AI responses no longer disappear during normal use
- new and switched conversations no longer render as blank shells
- user messages persist visibly across refresh/switch/new chat transitions
- thinking animation feels smooth and intentional
- desktop, mobile web, and PWA use the same stable lifecycle rules

## Out of Scope
- redesigning the overall chat visual language beyond the thinking indicator and state clarity
- unrelated admin/dashboard/chat feature additions
- backend model/provider behavior changes unless directly required to preserve chat lifecycle correctness
