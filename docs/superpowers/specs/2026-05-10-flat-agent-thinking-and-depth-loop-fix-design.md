# Flat Agent Thinking + Maximum Depth Loop Fix

## Goal
Keep the default thinking UI as plain shimmer text, switch to a flat agent row with a small expand toggle when agent mode activates, and remove the `Maximum update depth exceeded` loop risk from the thinking event flow.

## UI behavior
- Simple thinking stays as shimmer text only.
- Agent mode stays flat as well: shimmer label on the left, compact `↕` toggle on the right.
- Expanding reveals streamed agent reasoning text below the row.
- The main label should follow the latest agent activity instead of using a generic static title.
- When the final answer appears, the agent thinking row disappears.

## State behavior
- Thinking state should ignore duplicate phase transitions and duplicate chunk syncs.
- The done transition should not repeatedly re-fire from effects.
- Agent upgrade events may arrive multiple times; they should not trigger repeated phase churn.

## Files
- `components/AgentThinking.tsx`
- `components/ThinkingIndicator.tsx`
- `components/agent-thinking-panel.tsx`
- `components/message-reasoning.tsx`
- `hooks/useThinkingState.ts`

## Validation
- No bubble shell for agent mode.
- Expand/collapse works without affecting normal message rendering.
- Latest agent label is visible while reasoning streams.
- No repeated `Maximum update depth exceeded` client error during stream transitions.
