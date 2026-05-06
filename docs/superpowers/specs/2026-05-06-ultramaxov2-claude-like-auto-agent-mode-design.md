# UltramaxoV2 Claude-like Auto Agent Mode Design

## Goal

Turn UltramaxoV2 into a chat-first AI workspace that automatically escalates complex chats into an autonomous agent run, while keeping the interface clean and premium in a Claude.ai-like style.

The result should feel simple for normal chat, but become powerful when the request needs planning, file work, terminal work, web research, or preview-driven iteration.

## Current State

The repository already has partial agent infrastructure:

- `app/(chat)/api/chat/route.ts` supports IDE-style tool execution
- `backend/ai/prompts.ts` already has fullstack/mobile agent prompts
- `backend/db/schema.ts` already stores `agent_run` and `agent_step`
- `components/data-stream-handler.tsx` already renders agent progress events
- `components/agent-thinking-panel.tsx` and `components/agent-runs-panel.tsx` already show run details

What is still incomplete:

- agent activation is still tied mainly to explicit mode hints
- the current agent experience is fragmented across specialized branches
- the UI is not yet clearly Claude-like or polished enough for a premium product feel
- the current run metadata is too narrow for a general-purpose autonomous agent

## Scope

### In scope

- automatic complexity detection for chat messages
- general autonomous agent mode for complex chats
- Claude-like chat-first layout with a clean agent dock
- full tool access for file, terminal, web research, and preview workflows
- approval gates for risky actions
- persistent run history and step tracking
- UX cleanup for pending and unfinished agent surfaces

### Out of scope

- separate project/workspace management
- multi-agent orchestration
- collaborative real-time editing
- redesigning unrelated app areas
- changing the core model catalog or billing logic

## Product Decisions

### 1) Auto-agent is the default for complex chats

- Normal chats remain normal.
- If the message is detected as complex enough, UltramaxoV2 automatically starts an agent run.
- No manual mode toggle is required in the first version.
- The system should prefer "agent on" when the request clearly implies planning, building, debugging, inspecting, or multi-step work.

### 2) Claude-like UX, not a workspace-heavy IDE

- Primary surface stays chat-first.
- Sidebar stays minimal and quiet.
- Agent progress appears in a bottom dock / lower panel instead of taking over the whole screen.
- The agent panel should feel like a live status area, not a skeleton placeholder.
- When idle, the UI stays calm and simple.
- When running, the dock expands with progress, approvals, and recent steps.

### 3) General agent mode becomes first-class

- Add a true general-purpose agent path, not only fullstack/mobile special cases.
- Existing fullstack and mobile modes can remain as explicit specialty variants.
- General agent mode should support:
  - file inspection and edits
  - terminal commands and installs
  - web research
  - preview/start server flow
  - progress summaries
  - approval-gated risky actions

### 4) Safety stays in place

- Read-only actions run automatically.
- Risky actions require approval before execution.
- Risky actions include destructive file changes, broad overwrites, terminal commands with impact, package installs, and any external side effect that should not happen silently.

## UX Design

### Chat Shell

The main shell should feel close to Claude.ai:

- centered conversation area
- subtle, thin sidebar
- low visual noise
- clean composer
- strong typography and spacing
- agent state expressed through small, high-clarity UI pieces

### Agent Dock

When agent mode activates, a dock appears near the bottom of the chat:

- compact header with run name and progress
- short summary of what the agent is doing
- step list with timestamps / status cues
- approval card when the agent needs permission
- pause / resume / stop controls

### State Model

The UI should support these states:

- `idle` — normal chat
- `running` — agent active and streaming progress
- `approval_needed` — execution paused for user confirmation
- `paused` — run temporarily stopped by user or safety gate
- `completed` — summary shown, dock collapsible
- `failed` — error shown with retry guidance

## Architecture

### Detection Layer

Create a lightweight detection service that decides whether a message should trigger agent mode.

Inputs:

- latest user message text
- recent conversation context
- presence of code / project / build / debug intent
- attachment signals
- explicit request verbs like build, fix, edit, inspect, run, deploy, compare, research

Output:

- `mode`: `chat` or `agent`
- `confidence`: low / medium / high or numeric score
- `reason`: short human-readable explanation for logs and debugging
- optional `suggestedRunGoal`: concise goal summary

The detector should reuse the existing `detectTaskType()` as a baseline, but extend it with complexity scoring instead of relying on one keyword class.

### Chat Route Orchestration

`app/(chat)/api/chat/route.ts` becomes the orchestration layer:

1. parse and validate the request
2. inspect the latest user message
3. run the complexity detector
4. choose prompt/tool bundle
5. create or reuse an agent run when needed
6. stream agent steps and approvals back to the UI
7. persist the run and step history

### Agent Persistence

Extend the run model so general runs are tracked clearly.

Recommended schema changes:

- add `general` to `agent_run.mode`
- add trigger metadata such as:
  - `triggerReason`
  - `triggerConfidence`
  - `autoStarted`

Keep the existing `agent_step` table, but make step labels more useful for non-coding tasks too.

### Tooling

General agent mode should have access to the existing tool set already used by the code workspace flow:

- read / list / create / edit / delete files
- terminal execution
- package install
- preview server
- web search / research
- suggestion / planning helpers

The prompt should encourage the model to pick the smallest safe tool first, then escalate only when needed.

### UI Components

Reuse existing pieces where possible:

- `Chat` for shell orchestration
- `DataStreamHandler` for live agent events
- `AgentThinkingPanel` for step rendering
- `AgentRunsPanel` as the historical run reference
- `Message` / `Messages` for inline approval and progress blocks

Add or refine one focused dock component for the Claude-like agent strip rather than scattering agent state across many surfaces.

## Data Flow

1. User sends a message.
2. Backend validates the request and checks recent context.
3. Detector classifies the message.
4. If complex, backend starts an agent run automatically.
5. Assistant gives a short acknowledgment and begins streaming progress.
6. Tools execute as needed.
7. Risky operations emit approval requests.
8. User approves or denies.
9. Run continues or stops.
10. Completion produces a short summary and leaves the history persisted.

## Error Handling

- If detection is uncertain, bias toward chat unless the request still clearly reads as multi-step work.
- If tool execution fails, persist the failed step and show a clear retry state.
- If streaming breaks, keep the fallback assistant message behavior.
- If approval is denied, mark the run as blocked/paused and explain what happened.
- If the model times out or aborts mid-run, keep the run record and surface the last successful step.

## Testing

Minimum coverage target:

- detector classifies complex vs simple prompts correctly
- agent mode starts automatically for high-confidence complex requests
- simple prompts do not auto-start the agent
- approval-gated actions pause execution
- run persistence stores general-mode history correctly
- UI shows the dock only when needed
- completion and error states render cleanly

Recommended test types:

- unit tests for the detector
- route-level integration tests for mode selection
- UI tests for dock state changes
- end-to-end smoke test for a complex prompt with approval

## Acceptance Criteria

- A complex message in a normal chat auto-starts agent mode.
- The user does not need to manually switch modes first.
- The UI feels clean, premium, and Claude-like.
- Agent progress is visible without overwhelming the chat.
- Risky actions still require approval.
- Run history is persisted and readable after completion.
- The unfinished agent surfaces become coherent instead of fragmented.

## Rollback Strategy

Keep the work isolated to:

- chat route orchestration
- agent detection logic
- agent prompt selection
- agent run schema / queries
- agent dock and progress UI
- stream event rendering

That makes the feature easy to disable or revert without disturbing the rest of UltramaxoV2.
