# Premium Minimal Product Design

## Goal

Unify Ultramaxo into a dark-first AI product with a cleaner, more professional UX across chat, auth, docs, API console, and supporting pages. The product should feel calm, premium, mobile-friendly, and intentionally designed rather than template-driven.

## Experience Direction

- Dark-first by default, with a refined light mode available through toggle.
- Visual reference point is a mature AI workspace, closer to GPT/Kimi than a decorative landing page shell.
- Mobile should feel native-app-like: sticky controls, strong touch targets, stable keyboard behavior, and efficient navigation.
- Ultramaxo remains visible as a brand anchor, but the interface prioritizes clarity and trust over aggressive branding.

## Visual System

- Neutral charcoal backgrounds with layered surfaces instead of flat black blocks.
- Subtle borders, restrained shadows, and limited accent color usage.
- Sans-first product typography, with serif reserved for occasional editorial accent moments outside the core chat workflow.
- Consistent spacing, radius, and panel structure across app sections.

## Product UX Priorities

1. Improve chat shell first: sidebar, composer, empty state, message canvas, and mobile ergonomics.
2. Reuse the same surface language in auth, settings, docs, and API console.
3. Reduce visual noise and make actions easier to scan and reach.

## Chat Shell Rules

- Sidebar should feel lighter, quieter, and easier to scan.
- Composer should read as a single polished control cluster.
- Empty state should feel purposeful and premium, not generic.
- Header chrome should step back so the conversation remains the focal point.
- Mobile layout should protect the message canvas while keeping primary actions reachable.

## Verification

- After each implementation batch, run a validation step such as `npx tsc --noEmit`.
- Keep changes compatible with the existing chat flows and navigation patterns.
