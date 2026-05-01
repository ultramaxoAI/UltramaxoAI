# Redeem Limits And Chat Announcement Design

Date: 2026-05-01
Owner: Codex
Status: Proposed

## Goal

Add two admin-controlled capabilities:

1. redeem codes can optionally limit how many distinct accounts may claim them
2. admin can publish a dismissible announcement modal that appears when users enter chat

## Why This Change

Current redeem codes only support simple expiration and single-use behavior patterns. That is too limited for promotions where one code should be shared across multiple users but only up to a fixed cap.

Current admin tooling also has no direct way to broadcast short product updates, feature launches, or notices to users inside chat.

## Scope

In scope:

- redeem code max-claim support
- one-user-one-claim validation
- automatic code exhaustion when claim cap is reached
- admin UI support for max claims
- admin-configured chat announcement modal
- chat-side modal display and dismiss behavior

Out of scope:

- announcement targeting by plan or role
- scheduling announcements by date
- announcement history/audit log
- multi-banner or rich announcement feed
- global website announcement outside chat

## Redeem Code Behavior

### Rules

- one user can only claim a given redeem code once
- claim counting is based on distinct user accounts
- `maxClaims` is optional
- if `maxClaims` is empty/null, the code is unlimited
- if `maxClaims` is set, each successful claim increments `claimedCount`
- once `claimedCount >= maxClaims`, the code is treated as exhausted
- exhausted codes should behave like expired codes for future claim attempts

### Data Model

Add fields to redeem codes:

- `maxClaims` nullable integer
- `claimedCount` integer default `0`

Keep current expiry date support. Final redeem validity becomes:

- code exists
- code not expired by date
- code not exhausted by max claims
- user has not already claimed it

### Server Logic

On redeem request:

1. load redeem code
2. reject if expired by date
3. reject if exhausted by claim cap
4. reject if current user already claimed the same code
5. apply voucher effect
6. increment `claimedCount`
7. if count reaches cap, future requests treat code as expired/exhausted

Implementation should prefer a transactional update so successful claim and counter increment stay in sync.

### Admin UI

Admin voucher creation form gets:

- `maximum claims (optional)` numeric input

Voucher listing should show:

- `claimedCount / maxClaims`
- if unlimited, show `claimedCount / unlimited`
- status label:
  - `active`
  - `used up`
  - `expired`

### User Messaging

Possible failure messaging:

- already claimed by this account
- code expired
- code quota reached
- invalid code

Messages should be plain and short.

## Chat Announcement Behavior

### Rules

- admin can publish one active chat announcement
- announcement only appears when user enters chat
- user can close the modal
- closing only dismisses locally for that visit/session unless page is reloaded or the modal is intentionally shown again by product logic
- guest users may be excluded unless existing chat entry points already treat them the same as logged-in users

### Data Model

Store in site settings:

- `chatAnnouncementEnabled`
- `chatAnnouncementTitle`
- `chatAnnouncementMessage`

Optional styling fields are not needed in this pass.

### Admin UI

Add a new settings section in admin:

- enable toggle
- title
- message
- preview/status copy

Validation:

- title required if enabled
- message required if enabled

### Chat UI

When user enters chat:

- fetch announcement state from existing settings surface or a small public/internal endpoint
- if enabled, show a centered modal
- modal contains:
  - title
  - message
  - close button

The modal should be simple, elegant, and consistent with the chat UI. No oversized marketing treatment.

## Technical Approach

### Recommended Approach

Use direct fields on the redeem code row for quota tracking, plus existing settings infrastructure for announcements.

Why:

- smallest change surface
- easy to expose in admin
- fast reads
- avoids introducing a whole announcement subsystem or full claim-history table

### Concurrency Consideration

Redeem handling should update quota safely.

Preferred behavior:

- claim validation and `claimedCount` increment happen in one transaction
- if claim count reaches cap during race conditions, later concurrent claims should fail cleanly

## Files Likely In Scope

Redeem / vouchers:

- `backend/db/schema.ts`
- redeem code queries and helpers in `backend/db/queries.ts` or related query files
- `app/api/admin/redeem-codes/route.ts`
- user redeem route used by `/redeem`
- `app/admin/vouchers/page.tsx`

Chat announcement:

- `backend/db/queries-settings.ts`
- `app/api/admin/site-settings/route.ts`
- `app/admin/settings/page.tsx`
- chat layout or entry component where onboarding/entry modals already exist
- possibly `app/layout.tsx` or chat-specific shell if modal ownership belongs there

## Success Criteria

The feature is successful if:

- admin can create limited or unlimited redeem codes
- one user cannot claim the same code twice
- a limited code automatically becomes unavailable after the configured number of successful unique claims
- admin can publish a chat announcement from dashboard settings
- users see the announcement modal when entering chat and can close it

## Risks

- race conditions on claim counter updates
- admin confusion if exhausted status is not visually distinct
- announcement modal becoming intrusive if shown too often

Mitigation:

- use transactional claim updates
- surface explicit status labels in admin vouchers page
- keep modal lightweight and dismissible

