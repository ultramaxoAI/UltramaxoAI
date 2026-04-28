# API Platform Model Catalog + Docs + Billing (Per Token)

Date: 2026-04-28
Owner: Putra
Status: Draft (approved in chat, pending written review)

## Goals
- Build a reliable model catalog sourced from SwiftRouter, cached in DB, and used by API responses, docs, and landing UI.
- Provide complete per-model documentation (pricing, context, capabilities) for both public docs and in-app API tab.
- Fix API billing logic to be per-token and consistent for streaming and non-streaming.
- Add rate limiting and quota enforcement per API key.
- Ensure all features work end-to-end with tests and minimal bugs.

## Non-Goals
- Replacing SwiftRouter or adding alternative upstream providers.
- Building a full billing UI beyond existing credit balances and top-up flow.
- Large UI redesign of pricing/landing pages (only add model capabilities badges and docs surfaces).

## Current Issues Observed
- [app/api/v1/chat/completions/route.ts](app/api/v1/chat/completions/route.ts) uses a hardcoded SwiftRouter API key fallback.
- Streaming billing uses a flat fee and does not use actual usage tokens.
- Model listing is fetched live without normalization and without capability metadata.
- Landing page model table uses a static list and does not show capability badges from a source of truth.

## Approach (Approved)
Hybrid cache + override (SwiftRouter as source of truth):
- Pull models from SwiftRouter on a schedule and normalize metadata into a local catalog.
- Use the catalog for docs, landing, and API responses.
- Allow overrides for missing metadata (capability tags, pricing gaps).

## Architecture
1) Sync job (cron) pulls SwiftRouter models.
2) Normalize: map raw fields into the catalog schema.
3) Store: upsert records in `model_catalog` and append refresh logs.
4) Serve:
   - `/api/v1/models` reads from catalog.
   - Public docs and API Platform tab read from catalog.
   - Landing page gets badges from catalog (capabilities).

## Data Model
### Table: model_catalog
- id (uuid)
- modelId (text, unique): raw id from SwiftRouter
- name (text)
- provider (text)
- context (integer or text)
- priceIn (numeric)
- priceOut (numeric)
- currency (text, default USD)
- isFree (boolean)
- capabilities (json array): e.g. ["text", "vision", "logo", "audio"]
- status (text): active|deprecated|hidden
- raw (json): original SwiftRouter payload (for debugging)
- updatedAt (timestamp)

### Table: model_catalog_refresh_log
- id (uuid)
- status (text): success|error
- message (text)
- refreshedAt (timestamp)
- count (integer)

## Normalization Rules
- If SwiftRouter provides price fields, map to `priceIn` and `priceOut`.
- If missing price info, mark `isFree` only when known, else leave as paid with `priceIn/Out = null` and `status = hidden` until filled.
- Capabilities derived from SwiftRouter if available. Otherwise apply a small override map in repo for known models.
- Model `context` should be numeric if provided; fallback to text for unknown formats.

## API Endpoints
### Public
- `GET /api/v1/models`
  - Query: `capability`, `provider`, `free`, `limit`, `offset`
  - Response: normalized catalog list

- `GET /api/v1/models/:id`
  - Response: normalized model detail

### Admin/cron
- `POST /api/admin/models/refresh`
  - Auth: admin-only
  - Triggers a refresh and returns summary

## Docs Surfaces
- Public docs section with list and detail pages from catalog.
- API Platform tab in Pricing page shows the same catalog data.
- Landing page adds capability badges (Vision/Text/Logo/Audio) per model.

## Billing (Per Token)
- For non-streaming responses:
  - Use `usage.prompt_tokens` and `usage.completion_tokens` from SwiftRouter response.
  - Cost = prompt_tokens * priceIn + completion_tokens * priceOut
  - Debit `creditAccount` and insert `creditTransaction`.

- For streaming responses:
  - Parse final SSE chunk for usage when available.
  - If upstream never returns usage, estimate tokens from total text (fallback) and apply a minimum fee policy (configurable).
  - Ensure account debit happens once per request.

## Rate Limiting & Quota
- Limit per API key (requests per minute/hour).
- Enforce quota based on credit balance.
- Return 429 for rate limit and 402 for insufficient credits.

## Testing
- Unit tests:
  - Normalization (raw model -> catalog)
  - Billing cost calculation

- Integration tests:
  - `/api/v1/models` returns cached data
  - Fallback to refresh when cache empty
  - `/api/v1/chat/completions` debits credits for non-streaming
  - Streaming billing uses usage tokens when present

## Rollout Plan
1) Add schema and migration.
2) Implement catalog sync + admin refresh.
3) Update `/api/v1/models` to read catalog.
4) Fix billing logic for per-token charges.
5) Update landing page and API Platform docs.
6) Add rate limit.
7) Tests and staging verify.

## Risks and Mitigations
- SwiftRouter metadata incomplete -> keep override map, mark unknown models as hidden.
- Upstream downtime -> cached catalog + admin refresh.
- Streaming usage missing -> fallback estimation with minimum fee.

## Open Questions
- None (all requirements confirmed).
