---
name: frontend-design
description: "Expert frontend design and component architecture skill for React/Next.js. Use when building UI, choosing layouts, styling with Tailwind, or reviewing frontend code. Covers responsive design, accessibility, component patterns, and visual hierarchy."
risk: safe
source: "ClawForge / Custom"
date_added: "2026-04-23"
---

# Frontend Design Skill

This skill turns functional UIs into polished, professional interfaces. It covers layout, typography, color, spacing, accessibility, and React/Next.js component architecture.

## 🎯 When to Use
- Building new pages, components, or layouts.
- Reviewing existing UI for visual polish and consistency.
- Choosing between Tailwind patterns, Shadcn/ui variants, or custom styling.
- Improving mobile responsiveness and accessibility (a11y).

## 1. Layout & Spacing
- **Whitespace is King**: Generous padding and margin reduce cognitive load. Use `gap-*` and `p-*` generously.
- **Container Boundaries**: Use `max-w-*` and `mx-auto` to prevent content from stretching too wide on large screens.
- **Grid & Flex**: Use `flex` for 1D layouts, `grid` for 2D. Prefer `grid-cols-1 md:grid-cols-2 lg:grid-cols-3` for responsive cards.
- **Consistent Rhythm**: Maintain consistent spacing scale (4px base). Avoid arbitrary values when standard Tailwind utilities exist.

## 2. Typography
- **Hierarchy**: Every page should have exactly one `h1`. Use `h2`, `h3` for clear section hierarchy.
- **Readability**: Body text should be `text-base` (16px) minimum. `leading-relaxed` improves readability for long text.
- **Font Weights**: Use `font-semibold` for emphasis, `font-bold` sparingly for headings. Too much bold = nothing stands out.
- **Line Length**: Optimal reading width is 45–75 characters. Constrain prose with `max-w-prose`.

## 3. Color & Visuals
- **Semantic Color**: Use `bg-destructive` for errors, `bg-primary` for CTAs. Don't introduce one-off hex colors unless absolutely necessary.
- **Contrast**: Ensure WCAG AA contrast ratios. Use `text-muted-foreground` on `bg-muted`, not light gray on white.
- **Shadows & Depth**: Use `shadow-sm` for cards, `shadow-md` for modals/dropdowns, `shadow-lg` for floating elements. Never use heavy shadows on static content.
- **Border Radius Consistency**: Match `rounded-*` to the design system. Inputs usually `rounded-md`, cards `rounded-lg`, pills `rounded-full`.

## 4. Component Architecture
- **Composition over Configuration**: Prefer compound components (`<Tabs><TabsList><TabsTrigger>...</Tabs></Tabs>`) over props-heavy monoliths.
- **Single Responsibility**: A component does one thing. Split `UserCard` into `UserAvatar`, `UserInfo`, `UserActions` if it grows.
- **Client vs Server**: Default to Server Components. Use `'use client'` only when interactivity (state, effects, browser APIs) is required.
- **Props Interface**: Use explicit TypeScript interfaces. Avoid `any`. Destructure props at the top.
- **Forward Refs**: Always forward refs for reusable UI primitives (buttons, inputs) using `React.forwardRef`.

## 5. Responsive Design
- **Mobile First**: Write base styles for mobile, use `md:` and `lg:` to enhance for larger screens.
- **Breakpoints**: `sm:640px`, `md:768px`, `lg:1024px`, `xl:1280px`. Don't invent custom breakpoints unless design requires it.
- **Touch Targets**: Interactive elements must be at least 44×44px. Use `min-h-[44px]` or `p-3` on buttons.

## 6. Accessibility (a11y)
- **Semantic HTML**: Use `<button>` for actions, `<a>` for navigation. Don't attach `onClick` to `<div>`.
- **Alt Text**: Every `<img>` needs meaningful `alt`. Decorative images use `alt=""`.
- **Focus States**: Never remove focus outlines without replacement. Use `focus-visible:ring-2 focus-visible:ring-ring`.
- **ARIA**: Use `aria-label`, `aria-expanded`, `aria-live` when native semantics aren't enough.
- **Keyboard Navigation**: Ensure tab order is logical. Modals should trap focus.

## 7. Animation & Micro-interactions
- **Purposeful Motion**: Animations should guide attention or provide feedback, not distract.
- **Performance**: Prefer `transform` and `opacity` animations. Avoid animating `width`, `height`, `top`, `left`.
- **Transitions**: Use `transition-colors`, `transition-transform`, `duration-200` for hover states.
- **Reduced Motion**: Respect `prefers-reduced-motion` for users who disable animations.

## 8. Shadcn/ui & Tailwind Patterns
- **Theme Tokens**: Use CSS variables from `globals.css` (`--background`, `--foreground`, `--primary`) instead of hardcoded hex.
- **cn() Utility**: Always use `cn(clsx, tailwind-merge)` for conditional classes. Never concatenate strings manually.
- **Extending Components**: When customizing Shadcn, copy the component into `components/ui/` and modify. Don't patch node_modules.

## 🛠️ Implementation Checklist
- [ ] Is the layout responsive from `sm` to `xl`?
- [ ] Are colors using design system tokens, not arbitrary hex?
- [ ] Is there exactly one `h1` per page?
- [ ] Are interactive elements keyboard-accessible?
- [ ] Are images optimized (Next.js `<Image>`) and have alt text?
- [ ] Are props typed explicitly with TypeScript?
- [ ] Does it respect `prefers-reduced-motion`?
