# Manual Workspace Entry Design

## Goal
Make chat the default response surface. Do not push users into artifacts automatically when they ask for code or editable content. Instead, show a manual workspace entry action beside the existing top copy action when the assistant response is relevant for editing.

## UX
- Assistant answers stay in normal chat by default.
- A small `Workspace` action appears beside the top copy button on relevant assistant messages.
- The action is only shown when the message contains content that benefits from editing, such as code, structured snippets, or longer editable document output.
- Clicking the action opens the related workspace/artifact.
- If a matching artifact already exists for that response, reuse it.
- If no artifact exists yet, create/open a code or text workspace from the assistant message content.

## Behavior changes
- Reduce automatic artifact-first presentation in chat.
- Keep artifact infrastructure available for manual continuation and editing.
- Avoid intrusive inline artifact previews for cases that should remain simple chat-first.

## UI placement
- Place the manual workspace action in the assistant message top action area, beside the copy control.
- Keep styling compact and aligned with current message actions.

## Detection rules
Relevant messages may include:
- fenced code blocks
- high-confidence code-like text
- structured editable output
- long-form generated content that is better continued in an editor

Messages without editable value should not show the action.

## Implementation areas
- `components/message-actions.tsx`
- `components/message.tsx`
- `components/document-preview.tsx`
- artifact open/create helpers used by assistant responses
- any helper needed to classify assistant output as workspace-worthy

## Constraints
- Do not degrade existing artifact editing once the workspace is opened.
- Preserve copy and regenerate actions.
- Keep mobile UI tidy and compact.
- Prefer reusing existing artifact data over creating duplicates.

## Validation
- Asking for code returns code in chat, not an auto-forced artifact view.
- Relevant assistant messages show a workspace action beside copy.
- Non-relevant assistant messages do not show the workspace action.
- Clicking the action opens or creates the proper workspace cleanly.
