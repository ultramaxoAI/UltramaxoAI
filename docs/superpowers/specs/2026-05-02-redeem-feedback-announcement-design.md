# Redeem, Feedback Prompt, and Admin Announcement Design

## Goal

Improve the redeem-code experience, add a lightweight timed feedback prompt for signed-in users, and keep admin-managed announcements simple and elegant.

This design intentionally stays minimal in UI while still introducing enough backend structure to support future iteration and safe rollback.

## Scope

This work covers three connected areas:

1. Redeem page UX refinement
2. Timed in-app feedback prompt for signed-in users
3. Admin surfaces for announcements and feedback review

Out of scope for this version:

- Feedback analytics dashboards
- Email notifications for feedback submissions
- Guest-user feedback collection
- Complex moderation or triage workflows

## Product Decisions

### Redeem Flow

- Redeem success and failure should use temporary notifications instead of inline status text
- The redeem page should remain centered, minimal, and premium-looking
- The redeem form should preserve user input on failure
- On success, the code input should clear and the page should refresh relevant data

### Feedback Prompt

- The feedback prompt appears about 2 minutes after a signed-in user is active on the web app
- The prompt should feel product-like, with messaging such as "Bantu kami tingkatkan Ultramaxo"
- The UI should be a small non-blocking in-app panel rather than a full modal or separate page
- The prompt should only appear once per browser session
- Closing the prompt should suppress it for the rest of the session
- Successful submission should store the feedback in the database and dismiss the prompt

### Admin Announcement

- Announcement management stays inside the existing admin settings surface
- The announcement remains distinct from the timed feedback prompt
- Announcement is for admin broadcast
- Feedback prompt is for collecting user sentiment

## UX Design

### Redeem Page

The redeem page remains a single focused card with:

- One title
- One short supporting description
- One input for voucher code
- One primary action

Behavior:

- Loading state disables the form action and changes CTA copy
- Success uses a temporary success toast
- Validation or business-rule failures use specific error toasts
- Network or server failures use a generic error toast

Visual direction:

- Rounded surfaces
- Neutral palette
- Spacious layout
- No noisy banners or stacked status blocks

### Timed Feedback Prompt

The feedback prompt should appear as a floating card near the lower corner of the screen.

Contents:

- Small label or eyebrow
- Product-oriented title
- One short supporting sentence
- Compact textarea
- Primary submit action
- Secondary dismiss action

Behavior:

- Only shown to authenticated non-admin users
- Only shown once per session using session storage
- Appears after a 2-minute timer
- Does not block chat or page interaction
- Preserves typed text if submission fails
- Disappears after successful submission

### Admin Feedback Review

Add a new admin page for feedback review with a simple list or table layout.

The page should display:

- Feedback message
- User identity where available
- Submission source
- Submission time
- Simple status such as `new` or `reviewed`

The visual style should match the current admin UI:

- Clean cards or table rows
- Muted chrome
- Minimal accent color use
- Easy mobile fallback without over-design

## Architecture

### Data Model

Add a new feedback table with a lightweight schema:

- `id`
- `userId`
- `message`
- `source`
- `status`
- `createdAt`
- `updatedAt`

Recommended initial enum-like values:

- `source`: `timed_prompt`
- `status`: `new`, `reviewed`

This schema keeps the first version simple while preserving room for future expansion.

### Backend

Add:

- A database migration for the new feedback table
- Query helpers for creating and listing feedback
- A user-facing API route to submit feedback
- An admin API route or page loader to read feedback entries

Validation requirements:

- Reject empty feedback
- Trim message input
- Require authenticated user for submission
- Restrict feedback listing to admin users

### Frontend

Add:

- Redeem page toast-based feedback handling
- A reusable timed feedback prompt component or embedded chat-side component
- An admin feedback page linked from the admin sidebar

Reuse existing patterns where possible:

- `sonner` toast handling
- Existing admin layout and card styling
- Current chat entry announcement logic as a reference for session-based dismissal

## Data Flow

### Redeem

1. User enters a code
2. Frontend posts to redeem API
3. Backend validates and applies claim
4. Frontend shows temporary success or error toast
5. Success clears input and refreshes state

### Timed Feedback

1. Signed-in user enters supported app surface
2. Frontend starts a 2-minute timer
3. If session has not dismissed or submitted the prompt, the floating card appears
4. User submits feedback
5. Frontend calls feedback API
6. Backend stores feedback entry
7. Frontend shows success toast and hides prompt

### Admin Review

1. Admin opens feedback page
2. Frontend loads latest feedback entries
3. Admin reads entries in a clean list view

## Error Handling

### Redeem

- Invalid code: specific error toast
- Used-up or expired code: specific error toast
- Server failure: generic error toast

### Feedback

- Empty text: prevent submit on client
- Failed request: keep input and show error toast
- Unauthorized request: reject on server and show error toast

## Testing

Minimum testing target for this implementation:

- Feedback submission route accepts valid authenticated requests
- Feedback submission route rejects invalid or empty payloads
- Admin feedback listing is restricted to admin users
- Redeem page surfaces toast-based success and failure states correctly
- Timed prompt only appears once per session

## Rollback Strategy

Changes should be kept isolated to:

- redeem page UI
- feedback database migration
- feedback query helpers
- feedback submission route
- admin feedback page
- admin sidebar link
- timed feedback prompt UI

This makes it straightforward to revert only this feature set later without disturbing unrelated changes already present in the repository.

## Implementation Notes

- Preserve the existing elegant minimal visual language
- Avoid introducing large modal flows for feedback
- Avoid coupling announcement management with feedback collection logic
- Keep the first version operationally simple
