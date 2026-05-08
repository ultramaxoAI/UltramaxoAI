# Tool Card State and Artifact Visibility Design

## Context
UltramaxoV2 chat currently shows three linked regressions in the assistant/tool experience:
- workspace and artifact tool cards can duplicate
- approval-based tool cards can stay pending forever without a clear recovery state
- artifacts can auto-open unexpectedly and then become hard to close or re-open

Recent fixes already removed some reply persistence and thinking-state issues. This spec focuses on stabilizing the remaining tool/artifact UI state flow without expanding the stream protocol more than necessary.

## Goals
- Render exactly one visible card per tool call
- Keep approval-driven tool cards in one stable state machine: `approval-requested -> approved -> running -> done|error|denied|possibly-stuck`
- Show a fallback `Possibly stuck` state after 10 seconds when a final tool result never arrives
- Preserve manual artifact open/close behavior
- Allow artifacts to be opened, closed, and opened again reliably

## Non-goals
- Redesign the full backend tool stream contract
- Change tool semantics outside the current chat/tool renderer
- Reintroduce forced artifact auto-open side effects

## Approach Options
### Option 1: UI-only inferred state
Infer all approval and stuck states in the frontend.
- Pros: fast, minimal backend changes
- Cons: less canonical, depends on local heuristics

### Option 2: Fully stream-driven state
Require backend to emit explicit approved/running/done transitions.
- Pros: clean source of truth
- Cons: larger scope and risk

### Option 3: Hybrid fallback model (recommended)
Use tool stream state when available, but add a frontend fallback timeline for approval-based tools.
- Pros: robust against missing final events, small scope, fixes current bug fastest
- Cons: modest renderer complexity

## Recommended Design
### 1. Render source of truth
- `message.parts` is the primary render source for tool cards
- `message.annotations` is fallback-only for document tools when the matching tool part does not exist yet
- duplicate document cards are prevented by gating annotation rendering behind presence of a document tool part

### 2. Approval tool state machine
For workspace mutation tools such as `tool-createFile`, `tool-createCodeFile`, `tool-editFile`, `tool-updateCodeFile`, and similar approval-based actions:
- `approval-requested`: show Allow/Deny buttons
- when the user clicks Allow:
  - immediately show `Approved`
  - then show `Running`
- if no terminal stream state arrives within 10 seconds after approval, show `Possibly stuck`
- when a terminal tool state arrives later, it overrides the fallback state immediately:
  - `output-available` -> `Done`
  - `output-error` -> `Error`
  - `output-denied` or denied approval -> `Denied`

The card identity must remain stable by `toolCallId`; state changes update the same card instead of rendering replacement cards.

### 3. Artifact visibility contract
- artifact visibility is controlled only through `useArtifact`
- `ArtifactCard` must not auto-open itself from a mount effect
- document tool components must not force-open artifacts from a mount effect
- clicking the artifact card triggers open explicitly
- closing an artifact sets `isVisible: false` and must not be undone by unrelated rerenders

### 4. Recovery UI
For `Possibly stuck` cards:
- show a distinct badge/state label
- show a small recovery action such as `Retry` or `Refresh`
- if a delayed final tool result eventually arrives, replace `Possibly stuck` automatically with the final state

### 5. Error handling
- invalid or partial tool payloads should still render a stable shell card if a tool call exists
- missing titles/paths fall back to safe generic labels rather than causing render gaps
- the UI should prefer degraded but visible state over disappearing cards

## Component Impact
### `components/message.tsx`
- gate annotation fallback rendering when tool parts already exist
- add stable approval fallback state tracking by `toolCallId`
- map terminal tool states over any local fallback state
- surface `Possibly stuck` recovery actions

### `components/document.tsx`
- keep document cards passive until clicked
- do not auto-open from lifecycle effects

### `components/ArtifactCard.tsx`
- remain stateless with respect to artifact opening
- render status purely from props

### `hooks/use-artifact.ts` and artifact shell consumers
- preserve current global artifact visibility model
- ensure close/open transitions are idempotent

## Data Flow
1. assistant emits tool call part
2. message renderer creates one card keyed by `toolCallId`
3. if approval is requested, user action updates local transient state for that card
4. timer starts after approval
5. final tool stream state clears the timer and becomes canonical UI state
6. if timer expires first, card shows `Possibly stuck`
7. clicking artifact card opens workspace through `useArtifact`
8. closing artifact only updates `useArtifact.isVisible`

## Testing
- document tool renders once even when both part and annotation exist
- approval flow: request -> approved -> running -> done
- approval flow with missing final event: request -> approved -> running -> possibly stuck after 10s
- denied approval renders denied state without duplicate cards
- artifact can open, close, and re-open repeatedly
- delayed final result after `Possibly stuck` replaces fallback state correctly

## Risks and Mitigations
- Risk: local fallback state drifts from stream state
  - Mitigation: terminal stream states always override fallback state
- Risk: timers leak across rerenders
  - Mitigation: key by `toolCallId` and clean timers on unmount/state resolution
- Risk: aggressive fallback marks slow tools as stuck too early
  - Mitigation: 10-second threshold chosen as explicit UX/debug signal, not hard failure

## Implementation Slice
1. finish duplicate suppression in `message.tsx`
2. add approval fallback state/timer layer keyed by `toolCallId`
3. add `Possibly stuck` recovery UI
4. verify artifact open/close behavior remains manual and stable
5. run build and targeted manual chat verification
