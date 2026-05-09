# Chat Artifact Stream Lifecycle Stability Design

## Context
UltramaxoV2 chat still has a long-running artifact regression affecting both code and document artifacts:
- artifacts can open while their content stays empty during generation
- the writing state can remain pending after generation should have completed
- real-time partial content does not reliably appear in the artifact shell
- the artifact viewport can get forced downward during writing, leaving the user unable to scroll normally
- the issue is older than the latest changes, but recent chat/tool/artifact work made it more visible

Recent work already touched chat persistence, tool cards, artifact visibility, reasoning, and agent mode UI. This spec focuses on stabilizing artifact streaming lifecycle and keeping reasoning/tool UI from blocking artifact updates.

## Goals
- Stream partial artifact content into the UI in real time for both code and document artifacts
- Move artifact state through a clear lifecycle: `idle -> pending -> streaming -> completed | error`
- Ensure writing/pending indicators terminate correctly when the tool or artifact completes
- Keep final artifact content recoverable even if partial streaming fails
- Stop forced downward viewport behavior while preserving optional auto-follow when the user is already near the bottom

## Non-goals
- Redesign the entire chat protocol
- Replace the editor or artifact shell UI wholesale
- Rework unrelated sidebar, navigation, or landing page logic
- Introduce a new persistence model beyond what is required for stable artifact completion and reload correctness

## Approach Options
### Option 1: UI patch only
Force rerenders in artifact components and weaken autoscroll logic.
- Pros: fast, small edits
- Cons: pending state and empty artifact bugs can remain if stream/state orchestration is wrong

### Option 2: Full backend-first protocol redesign
Make the server emit a more explicit artifact lifecycle contract and rewrite consumers around it.
- Pros: clean long-term source of truth
- Cons: larger scope and slower path to fixing the live regression

### Option 3: Stream normalization plus frontend lifecycle store (recommended)
Normalize incoming stream events, give artifacts their own lifecycle state, and add final-result fallback recovery.
- Pros: fixes root cause in current architecture, keeps scope controlled, improves both realtime and completion behavior
- Cons: touches several connected files in chat, artifact, and thinking layers

## Recommended Design

### 1. Artifact stream ownership
Artifact rendering must read from one canonical artifact state layer rather than inferring completion from reasoning cards or mixed message-local conditions.

Each artifact instance should be keyed by stable identifiers already available in the flow, preferring `artifactId` and falling back to a stable message/tool relationship when needed. The canonical artifact state stores:
- identity: `artifactId`, `messageId`, `toolCallId`, `kind`
- lifecycle: `idle | pending | streaming | completed | error`
- content: latest merged partial or final payload
- metadata: title, path, mime/type hints, timestamps
- UI hints: `isVisible`, `isUserNearBottom`, `autoFollowEnabled`

Reasoning/tool components may observe this state for labels, but they must not own the artifact lifecycle.

### 2. Stream normalization contract
Incoming stream events from chat routes and stream handlers must be normalized into a small internal event model before touching UI state. The frontend should not rely on several ad-hoc branches that each update a different slice of artifact state.

Normalized artifact-related events:
- `artifact-started`
- `artifact-partial`
- `artifact-completed`
- `artifact-error`
- `tool-completed-with-artifact` as a fallback completion bridge when a dedicated artifact completion event is absent

Rules:
- `artifact-started` creates or reuses a canonical artifact entry and sets lifecycle to `pending`
- first valid content chunk upgrades lifecycle to `streaming`
- `artifact-partial` merges into the same artifact entry rather than replacing identity
- `artifact-completed` finalizes content and sets lifecycle to `completed`
- `artifact-error` sets lifecycle to `error` without deleting current visible content

This keeps partial updates attached to one stable artifact instead of creating state drift between message, document, and artifact panel layers.

### 3. Partial content merge behavior
Partial updates must be merged according to artifact type:
- code artifacts: replace the editor buffer with the latest canonical full content snapshot if the stream already sends whole-file content; if the stream sends deltas, apply them deterministically in the store first and then render the resulting full buffer
- document/text artifacts: append or replace based on normalized event semantics, but always expose one current canonical string to the renderer

The UI should render from the current canonical content only. It should not wait for final completion before hydrating the visible artifact.

### 4. Completion and stuck-state recovery
A missing final stream event must not leave the artifact empty forever or the UI stuck in pending.

Recovery rules:
- if a tool finishes and includes final artifact content, hydrate the artifact immediately and mark it `completed`
- if final content exists in message/tool result state while artifact lifecycle is still `pending` or `streaming`, reconcile to `completed`
- if the artifact remains non-terminal beyond a reasonable guard window after the tool reports completion, force a completion reconciliation pass
- if no content ever arrived and the tool reports failure, mark artifact `error` with a visible degraded state instead of endless pending

This adds a small fallback layer without making fallback the primary path.

### 5. Scroll and viewport behavior
The artifact viewport should only auto-follow while the user is already near the bottom. Once the user scrolls upward or interacts manually, follow mode pauses until the user returns near the bottom or explicitly re-enables follow.

Rules:
- opening an artifact may scroll to the newest content once
- incoming partial content may continue auto-follow only if `isUserNearBottom` is true
- manual scroll disables forced downward jumps for the current interaction period
- completion must not force a final downward lock if the user is reading older content

This applies to both code and document artifacts to avoid the current “writer area slides down and becomes hard to scroll” behavior.

### 6. Isolation from reasoning and tool cards
Reasoning streams, tool cards, and thinking indicators should continue to render progress feedback, but their completion state must not block artifact hydration or artifact completion. Artifact content should appear when artifact content exists, even if a thinking/timer UI element resolves slightly later.

Likewise, hiding or closing an artifact should only affect visibility, not lifecycle completion or content storage.

## Component Impact
### `components/data-stream-provider.tsx`
- own canonical artifact lifecycle store or artifact-oriented state reducer
- normalize raw stream events into artifact lifecycle events
- run completion reconciliation and timeout guards

### `components/data-stream-handler.tsx`
- stop dispatching artifact-related updates through multiple inconsistent paths
- feed normalized events into one orchestration path

### `components/artifact.tsx`
- render from canonical artifact state
- separate visibility logic from streaming lifecycle logic

### `components/document.tsx`
- hydrate document content from canonical partial/final state immediately
- use guarded auto-follow behavior rather than unconditional downward forcing

### `artifacts/code/client.tsx`
- hydrate the code editor buffer from canonical content during streaming
- preserve manual scroll behavior and avoid forced bottom jumps during user interaction

### `components/ReasoningStream.tsx`, `components/AgentThinking.tsx`, `components/SimpleThinking.tsx`, `components/ThinkingIndicator.tsx`
- consume artifact status passively where needed
- stop acting as an implicit gate for artifact completion UI

### `hooks/useThinkingState.ts`
- remove or reduce coupling between thinking-state transitions and artifact terminal state

### `app/(chat)/api/chat/route.ts`
### `app/(chat)/api/chat/[id]/stream/route.ts`
- verify emitted event ordering and payload consistency for artifact start, partial updates, and final completion
- preserve current protocol where possible, only tightening semantics needed by normalization

## Data Flow
1. user sends prompt
2. backend starts tool/artifact work and emits raw stream events
3. frontend stream layer normalizes events into artifact lifecycle events
4. canonical artifact state creates or updates one artifact entry
5. artifact UI reads current canonical content and lifecycle during streaming
6. reasoning/tool cards render parallel progress but do not own artifact state
7. final artifact event or tool-result fallback reconciles the artifact into `completed` or `error`
8. reload or chat revisit reads the final stored artifact state without reviving stale pending indicators

## Error Handling
- stale or out-of-order events must not overwrite newer artifact content
- malformed partial payloads should be ignored with logging, not crash the artifact renderer
- terminal final content always wins over older partial content
- completion reconciliation should be idempotent so rerenders and duplicate events do not create duplicate transitions
- if artifact visibility closes mid-stream, background content updates may continue, but visibility state stays user-controlled

## Testing
### Manual verification
1. generate a code artifact and confirm content appears during streaming
2. generate a document artifact and confirm the same realtime behavior
3. confirm lifecycle transitions `pending -> streaming -> completed`
4. simulate delayed completion and confirm fallback reconciliation closes pending state
5. manually scroll during streaming and verify no forced downward locking
6. close and reopen artifact during or after streaming and confirm content remains synced
7. reload or switch chats after completion and confirm final artifact content persists without resurrecting pending state

### Targeted implementation checks
- unit or reducer-level tests for event normalization and lifecycle transitions
- merge tests for partial content handling
- timeout/reconciliation tests for final-result fallback
- UI checks for auto-follow only when near bottom

## Risks and Mitigations
- Risk: current backend events are less consistent than expected
  - Mitigation: normalize on the frontend first and tighten backend ordering only where necessary
- Risk: code and document artifacts require different merge semantics
  - Mitigation: share lifecycle infrastructure but keep content merge strategy artifact-type aware
- Risk: completion guard marks slow but valid runs too early
  - Mitigation: trigger hard reconciliation only after tool completion evidence or explicit timeout criteria
- Risk: refactoring stream ownership breaks recent tool-card fixes
  - Mitigation: keep artifact lifecycle isolated and treat reasoning/tool state as observers, not co-owners

## Implementation Slice
1. inspect current artifact event shapes across chat routes and stream handlers
2. introduce canonical artifact lifecycle normalization in the stream provider layer
3. wire artifact and document/code renderers to canonical partial content
4. add completion reconciliation and pending guard logic
5. replace unconditional auto-follow behavior with near-bottom guarded scrolling
6. verify manual chat flows for code and document generation, close/reopen, and reload
