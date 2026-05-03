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

## Detailed Product Decisions

### Redeem Limits

- `maxClaims` must accept positive integers only
- `0` should be rejected rather than interpreted as unlimited
- existing redeem codes migrate as `maxClaims = null`; `claimedCount` should default to `0` and be backfilled from historical successful claims if that data already exists
- `claimedCount` reflects successful claims only
- existing claim records, if present in the system, remain the source of truth for duplicate-user checks

This keeps admin behavior simple:

- empty field means unlimited
- any filled value means a hard cap
- there is no special sentinel value to memorize

### Chat Announcement

- only one announcement payload is active at a time
- dismiss state is client-local and session-scoped
- a full page reload may show the same announcement again
- if announcement is disabled, chat should not reserve layout space for it
- if title or message is missing while enabled, the server should treat the announcement as invalid and not render it

This intentionally favors a lightweight product notice instead of a persistent notification system.

## User Flows

### Redeem Flow

1. user submits a code from the redeem surface
2. server normalizes the code using current project conventions
3. server loads the redeem code and validates expiry
4. server checks whether the current user already claimed the code
5. server checks whether quota is already exhausted
6. server applies the entitlement or voucher effect
7. server records the user claim and increments `claimedCount`
8. client receives success state and refreshes any balance or entitlement UI

Failure cases:

- unknown code -> `invalid code`
- expired by date -> `code expired`
- exhausted by quota -> `code quota reached`
- duplicate user claim -> `already claimed by this account`

### Announcement Flow

1. admin enables announcement and saves title + message
2. chat entry surface fetches the current announcement state during existing bootstrapping
3. if enabled and valid, modal opens once on entry
4. user closes modal
5. client stores local dismiss flag for the current browser session
6. modal stays closed until reload or a fresh session

## Data And Contract Shape

### Redeem Code Shape

Recommended server shape:

```ts
type RedeemCode = {
  id: string
  code: string
  expiresAt: Date | null
  maxClaims: number | null
  claimedCount: number
}
```

The code is redeemable only when:

```ts
const isNotExpiredByDate = !expiresAt || expiresAt > now
const isNotExhausted = maxClaims == null || claimedCount < maxClaims
const isRedeemable = isNotExpiredByDate && isNotExhausted
```

### Announcement Settings Shape

Recommended settings payload:

```ts
type ChatAnnouncementSettings = {
  chatAnnouncementEnabled: boolean
  chatAnnouncementTitle: string
  chatAnnouncementMessage: string
}
```

Client-facing shape can be trimmed to:

```ts
type ChatAnnouncement = {
  enabled: boolean
  title: string
  message: string
}
```

This keeps the admin settings schema aligned with existing storage while allowing chat to consume a smaller, explicit payload.

## Validation Rules

### Admin Redeem Form

- `maxClaims` optional
- if provided, it must be an integer
- minimum valid value is `1`
- editing an existing code must not allow setting `maxClaims` below `claimedCount`

### Admin Announcement Form

- when disabled, title and message may remain stored but are ignored
- when enabled, title is required after trimming
- when enabled, message is required after trimming
- title should stay short enough for modal layout
- message should support plain text only in this pass

### Server Enforcement

- never trust client-side quota or duplicate-claim checks
- duplicate-claim protection must happen on the server even if admin UI already shows counts
- announcement response should return disabled if the stored payload is incomplete

## Concurrency And Integrity

Redeem quota correctness matters more than perfect admin count freshness.

Recommended integrity rules:

- enforce duplicate-claim uniqueness using the existing claim table if one exists, or add a unique `(userId, redeemCodeId)` constraint if needed
- perform quota validation and count increment in the same transaction
- derive failure from the write result rather than assuming pre-checks stayed true during contention

Preferred implementation shape:

1. open transaction
2. verify redeem code is still redeemable
3. create claim record for `(userId, redeemCodeId)`
4. increment `claimedCount`
5. commit only if both operations succeed

If two users redeem near the cap at the same moment, exactly one claim should win the final slot and the other should receive a clean quota-reached failure.

## UI Notes

### Admin Vouchers Page

- keep the current table structure if it already exists
- add usage visibility without making the row visually noisy
- `used up` status should be visually distinct from `expired`
- unlimited codes should still show momentum through `claimedCount`

Suggested display:

- `3 / 10`
- `17 / unlimited`

### Chat Modal

- use the same modal primitive and motion style already present in chat or app surfaces
- width should stay compact and readable on desktop
- mobile should prioritize comfortable padding and a clearly reachable close action
- do not add illustrations, banners, or secondary CTA buttons in this pass

## Testing Strategy

### Redeem

- create unlimited code and confirm multiple users can claim it
- create limited code with cap `1` and confirm second user is rejected
- confirm same user cannot claim the same unlimited code twice
- confirm expired code still fails before quota logic matters
- confirm admin cannot save `maxClaims = 0`
- confirm editing cannot reduce cap below current `claimedCount`
- run a concurrent redemption check around the final remaining slot

### Announcement

- save enabled announcement and confirm it appears on chat entry
- close modal and confirm it stays closed for the current session
- reload page and confirm it may reappear
- disable announcement and confirm chat opens without modal
- save incomplete payload while disabled and confirm no chat regression

## Rollout Notes

- existing redeem codes should remain valid without manual admin action
- migration should be backward-compatible and default-safe
- if historical claim rows exist, run a one-time backfill so `claimedCount` matches distinct successful claims per code
- announcement settings should default to disabled
- no user-facing migration message is needed

## Open Questions Resolved

- guest support should follow current chat access behavior; this feature should not introduce a separate guest-only rule
- announcement delivery should reuse existing settings infrastructure unless a missing public read path forces a tiny dedicated endpoint
