# Ultramaxo

## Overview
- **Name**: Ultramaxo
- **Slug**: ultramaxo
- **Website**: https://ultramaxo.tech
- **Stage**: established
- **Created**: 2026-03-13
- **Developer**: Putra (UltraTeam)

## What We Do
Ultramaxo is a premium, full-stack AI workspace platform that brings UltraAgent chat, code and document artifacts, image generation, file uploads, workspace modes, and reusable history into one unified product. Built with a BYOK (Bring Your Own Key) architecture, users can connect their own Gemini, Anthropic (Claude), or OpenAI API keys — eliminating expensive monthly AI subscriptions. The workspace is designed for actual, sustained daily work rather than disposable chat sessions.

## Target Audience

### Primary Segments
1. **Anak Sekolahan (SMP/SMA)** — Pelajar yang penasaran dengan dunia IT, coding, dan cybersecurity. Menggunakan Ultramaxo sebagai asisten belajar yang bisa menjelaskan konsep, membuat code, dan membantu tugas tanpa batas filter.
2. **Mahasiswa IT / Informatika** — Mahasiswa jurusan IT, teknik komputer, atau siber yang butuh workspace AI untuk coding, debugging, riset, dan eksperimen teknis sehari-hari.
3. **Pemula Belajar Hacking / Cybersecurity** — Orang yang baru mulai belajar ethical hacking, penetration testing, CTF (Capture The Flag), dan keamanan jaringan. Butuh AI yang bisa menjelaskan tools, teknik, dan konsep tanpa sensor.
4. **Self-Taught Developer / Script Kiddie** — Anak muda yang belajar programming dan IT secara otodidak, mencari AI workspace yang powerful dan bisa dipakai sehari-hari tanpa biaya berlangganan mahal.

### Demographics
- **Usia**: 14-24 tahun
- **Background**: Pelajar, mahasiswa, otodidak IT
- **Budget**: Terbatas (makanya Free tier dan harga Rupiah yang terjangkau sangat penting)
- **Behavior**: Aktif di Discord, Telegram, TikTok, YouTube tutorial IT/hacking
- **Pain point**: AI mainstream terlalu banyak sensor, subscription mahal, tidak bisa BYOK

### Geographic Focus
- Primary: Indonesia (pricing dalam Rupiah, bahasa campuran ID/EN)
- Secondary: Southeast Asia

## Unique Selling Proposition
One AI workspace where chat, artifacts (code, text, image, sheet), file uploads, model switching, and iteration history live together — not as disposable messages but as a persistent, editable workspace. The BYOK architecture means users pay only for what they actually use through their own API keys, not inflated subscriptions.

## Product Capabilities
- UltraAgent AI chat with full context threading
- Code, text, image, and sheet artifact system
- File upload and analysis
- Custom model selection and BYOK flow
- Chat history, export, and settings
- PWA install (native app experience)
- Full-stack and mobile development modes
- Web search integration
- Image generation
- Dark mode optimized workspace
- Admin dashboard with user management and analytics

## Tech Stack
- **Framework**: Next.js 16 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS 4 + Framer Motion
- **Database**: PostgreSQL (Neon, via Drizzle ORM)
- **Authentication**: Auth.js (NextAuth v5) — Google OAuth, credential, magic link
- **AI SDK**: Vercel AI SDK + OpenRouter + Groq
- **PWA**: Serwist
- **Deployment**: Vercel

## Pricing
| Plan    | Price          | Key Features                                        |
|---------|----------------|-----------------------------------------------------|
| Free    | Rp 0 / forever | Core AI chat, basic workspace tools, limited history |
| Pro     | Rp 30.000/mo   | Unlimited conversations, full artifact workflows, priority support |
| Annual  | Rp 150.000/yr  | Everything in Pro, best value, long-term access      |

## Current Marketing Status
- Landing page live at ultramaxo.tech with product narrative, use cases, pricing, and FAQ
- Google OAuth and credential-based authentication active
- PWA installable
- SEO meta tags and sitemap implemented
- No active paid campaigns
- No structured social media presence yet
- No email marketing sequences in place
- No content marketing or blog publishing yet

## Competitors
- ChatGPT (OpenAI) — general AI chat, no BYOK, subscription-heavy
- Claude.ai (Anthropic) — strong reasoning, no BYOK, limited artifact system
- Poe (Quora) — multi-model access, no code workspace
- TypingMind — BYOK chat interface, less artifact/workspace focus
- OpenRouter Chat — model aggregator, minimal workspace features
- Cursor — AI-powered code editor, limited to coding context

## Brand Voice & Tone
- Professional yet accessible
- Calm, focused, confident
- Technical precision without jargon overload
- Understated premium (not flashy, not corporate)
- Light-first presentation, dark-mode ready workspace

## Visual Identity
- **Primary colors**: Teal gradient (#0F766E to #14B8A6)
- **Light theme**: Warm off-white (#f4f1ea), dark text (#171717)
- **Dark theme**: Deep charcoal (#111315), light text (#f3f4f1)
- **Typography**: Geist font family
- **Design language**: Glassmorphism, subtle dot grid patterns, rounded corners (18-34px radius), ambient glow effects

## Notes
- Product built by Putra (solo developer)
- Indonesian market first, English-first product for global reach
- Payment integration via DompetX gateway
- Email via Resend (no-reply@ultramaxo.tech)
