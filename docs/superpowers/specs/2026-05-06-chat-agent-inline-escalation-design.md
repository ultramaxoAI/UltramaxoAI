# Chat Agent Inline Escalation Design

Date: 2026-05-06
Status: Proposed

## Goal

Make chat interactions feel like a normal conversation by default, while allowing the assistant UI to smoothly escalate into visible agent behavior when the task becomes complex. The escalation should feel calm, inline, and Claude-like rather than abrupt or dashboard-like.

## User Experience Target

- Short and casual prompts stay in standard chat mode.
- Complex prompts can start in a richer thinking state immediately.
- Prompts that initially look simple can escalate during execution if the assistant begins doing multi-step work, coding, or tool-driven actions.
- The user should never feel like they were moved into a different product mode. Agent activity should remain visible inside the chat surface.
- Thinking animation should feel elegant and alive, with subtle motion, progressive reveal, and natural language labels instead of technical debug logs.

## Product Principles

1. Default to calm chat.
2. Escalate only when there is clear evidence of meaningful work.
3. Escalation is one-way within a single assistant turn.
4. Agent visibility should be inline and understandable.
5. The final answer remains the primary focus after work completes.

## Scope

This design covers:

- preflight complexity detection before submit
- runtime escalation during streaming and tool execution
- inline thinking and agent UI states
- transition rules between states
- completion behavior and collapse behavior

This design does not change:

- backend tool semantics
- model selection rules
- billing or credit logic
- document/workspace execution permissions

## Current Problems

The current experience has three gaps:

1. Agent detection is mostly prompt-based and can miss tasks that become complex only after execution begins.
2. Thinking UI and agent UI feel like separate surfaces instead of one evolving interaction.
3. Basic thinking animation does not yet feel polished enough for lightweight conversational use.

## Desired Interaction Model

Each assistant turn uses a unified interaction surface with four visual states:

### 1. Responding

Used for lightweight chat.

- Shows a compact assistant loading surface.
- Uses subtle shimmer, breathing motion, and a short natural status line such as "Berpikir..."
- Avoids heavy panel framing.

### 2. Deep Thinking

Used when the task appears meaningfully complex before execution starts.

- Still appears inline in chat.
- Expands from the same assistant loading surface rather than swapping to a different UI family.
- Shows a small sequence of human-readable reasoning phases such as:
  - Memahami konteks
  - Menyusun pendekatan
  - Menyiapkan jawaban

### 3. Agent Active

Used when real execution is happening.

- The same thinking surface upgrades into agent mode.
- Visible activities shift from thought-oriented labels to action-oriented labels such as:
  - Membaca file
  - Menyiapkan perubahan
  - Menjalankan pengecekan
- Tool execution, coding work, and multi-step progress remain inline in the conversation area.
- The UI must remain visually restrained and not turn into a separate dashboard.

### 4. Done

Used when the turn has completed.

- The active surface settles and collapses gently.
- A compact summary may remain, such as "3 aksi selesai".
- The actual assistant answer becomes the dominant visual focus again.

## Detection Architecture

Detection becomes two-stage.

### Stage 1: Preflight Detection

Before submit, inspect:

- prompt text
- recent chat context
- attachment presence
- explicit work verbs
- coding / repo / file / terminal references
- multi-step intent

Output:

- `chat`
- `agent-likely`
- confidence score and reason metadata

Rules:

- simple conversational prompts stay `chat`
- clearly complex prompts start as `agent-likely`
- ambiguous prompts start as `chat` unless confidence is high

### Stage 2: Runtime Escalation

During streaming, the UI may upgrade from `chat` or `deep-thinking` to `agent-active` when any of the following appears:

- first tool call
- workspace/file/code action
- more than one meaningful execution step
- explicit patch/edit/run/test behavior
- streamed metadata indicating structured work rather than a direct answer

Rules:

- escalation is one-way within the turn
- no downgrade during the same assistant response
- if the assistant finishes without execution, the UI resolves as normal thinking, not agent mode

## State Model

Suggested turn-level state enum:

- `idle`
- `responding`
- `deep-thinking`
- `agent-active`
- `done`
- `error`

Suggested metadata:

- `startedAt`
- `preflightMode`
- `runtimeEscalated`
- `reasoningSteps`
- `agentSteps`
- `summary`
- `anchoredMessageId`

The assistant UI should be driven by a single state source rather than separate booleans that can drift apart.

## Visual Behavior

### Thinking Animation

The default thinking surface should feel premium and soft:

- low-contrast shimmer or gradient wash
- one active row with breathing opacity
- gentle upward reveal for new steps
- no aggressive spinners as the primary visual
- duration text shown quietly, not prominently

### Step Reveal

- first step appears quickly
- later steps reveal progressively
- completed steps fade into lower contrast
- active step has the strongest emphasis

### Transition to Agent

When escalation occurs:

- the existing surface expands in place
- header text shifts smoothly from a generic thinking label to a work label
- step list morphs from reasoning-oriented to action-oriented content
- avoid remounting to a visually unrelated component where possible

## Copy Guidelines

Thinking and agent labels should sound natural, not like internal logs.

Preferred:

- Berpikir...
- Memahami konteks
- Menyusun pendekatan
- Menyiapkan jawaban
- Membaca file
- Menyiapkan perubahan
- Menjalankan pengecekan

Avoid:

- raw tool names as primary labels
- transport/debug wording
- implementation jargon unless the user explicitly wants technical detail

## Component Architecture

Recommended direction:

1. Keep one primary inline activity surface component.
2. Feed it a normalized sequence of display steps.
3. Let that component render in compact, expanded-thinking, or agent-active variants.
4. Keep message anchoring logic centered in one place so the activity surface always appears next to the correct user turn.

Probable code areas:

- `lib/agent-mode-detector.ts`
- `components/chat.tsx`
- `components/messages.tsx`
- `components/agent-thinking-panel.tsx`
- related data stream / live thinking state containers

## Error Handling

- If escalation metadata is incomplete, fall back to the standard thinking surface.
- If tool activity begins but no rich step data arrives, show a generic action label instead of blank UI.
- If streaming fails mid-turn, preserve the latest visible state and transition to an inline error state without collapsing abruptly.

## Testing Strategy

### Functional

- short greeting remains simple chat
- coding prompt starts as deep-thinking or agent-likely
- ambiguous prompt starts as chat but escalates after tool usage
- escalated turn never downgrades before completion
- completed turn collapses gracefully

### Visual

- no duplicated surfaces for the same turn
- no panel appearing above the wrong message
- transitions remain stable on first, second, and resumed prompts
- lightweight thinking animation still appears when agent mode is not used

### Regression

- existing tool execution still renders results
- resume behavior still restores the correct turn state
- simple chat does not accidentally show heavy agent chrome

## Rollout Plan

1. Refactor turn state into a unified inline activity model.
2. Improve preflight detection outputs.
3. Add runtime escalation triggers from streamed execution data.
4. Rework thinking surface animation and copy.
5. Add completion summaries and collapse behavior.
6. Verify with repeated multi-turn chat scenarios.

## Recommendation

Implement inline escalation as the default architecture.

This gives the closest result to the intended experience:

- normal chat by default
- visible intelligence during hard tasks
- agent work without mode-switch whiplash
- a more premium, Claude-like feeling across both light and heavy prompts
