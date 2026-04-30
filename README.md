# ✦ Ultramaxo AI Workspace

> **The Uncensored, Highly-Customizable AI Platform for Power Users.**

[![Next.js](https://img.shields.io/badge/Next.js-15.0-black.svg?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC.svg?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg?style=for-the-badge)](https://opensource.org/licenses/MIT)

Ultramaxo is a premium, full-stack AI platform built to bypass traditional AI limits. Featuring a built-in **BYOK (Bring Your Own Key)** architecture, real-time code execution, document generation, and a powerful Admin Dashboard. It is designed to be the ultimate daily driver for developers, hackers, and prompt engineers.

---

## 🔥 Key Features

- **Bring Your Own Key (BYOK)**: Natively connect your Gemini, Anthropic (Claude), or OpenAI API keys. Say goodbye to expensive monthly subscriptions. 
- **PHOENIX Algorithmic Persona**: Built-in system architecture for an uncensored, zero-filter, direct-execution AI persona.
- **Glassmorphic UI**: Beautiful, premium, and responsive user interface built with Tailwind CSS, Framer Motion, and Radix UI.
- **Multi-Modal Capabilities**: Support for document creation, code rendering, language detection, and image generation.
- **Admin Dashboard**: Comprehensive user management, voucher generation, analytics tracking, and role-based access control.
- **Progressive Web App (PWA)**: Download the web app as a stand-alone native application (APK equivalent) with offline caching.
- **Authentication**: Secure JWT-based passwordless/magic-link and credential authentication using NextAuth V5.

## 🛠️ Tech Stack

- **Framework**: [Next.js 15](https://nextjs.org/) (App Router)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Styling**: [Tailwind CSS 4](https://tailwindcss.com/) & [Framer Motion](https://www.framer.com/motion/)
- **Database**: [PostgreSQL](https://www.postgresql.org/) (via Drizzle ORM)
- **Authentication**: [Auth.js (NextAuth v5)](https://authjs.dev/)
- **AI SDK**: [Vercel AI SDK](https://sdk.vercel.ai/docs)
- **PWA Management**: [Serwist](https://serwist.build/)

---

## 🚀 Getting Started

### Prerequisites
Make sure you have Node.js (v18+) and `pnpm` installed.

```bash
npm install -g pnpm
```

### Installation

1. **Clone the repository:**
   ```bash
   git clone https://github.com/yourusername/ultramaxo.git
   cd ultramaxo
   ```

2. **Install dependencies:**
   ```bash
   pnpm install
   ```

3. **Set up environment variables:**
   Copy the example environment file and fill in your database credentials and auth secrets.
   ```bash
   cp .env.example .env.local
   ```
   *Note: Ensure you configure your Postgres database URL and Auth Secret.*

4. **Initialize the Database:**
   Generate tables and push the schema using Drizzle.
   ```bash
   pnpm run db:push
   ```

5. **Run the Development Server:**
   ```bash
   pnpm run dev
   ```
   *Open [http://localhost:3000](http://localhost:3000) to view the application.*

---

## 🛡️ Admin Dashboard & Roles
To access the `/admin` route, your account must have the `admin` role in the PostgreSQL database.

Use `ADMIN_EMAIL` and `ADMIN_PASSWORD` when running the admin update script. Do not commit real admin credentials.

---

## 📦 Deployment

This project is optimized for deployment on Vercel. 

[![Deploy with Vercel](https://vercel.com/button)](https://vercel.com/new/clone?repository-url=https%3A%2F%2Fgithub.com%2Fyourusername%2Fultramaxo)

Make sure to add your `.env` variables in the Vercel Dashboard before building.

---

## 📄 License
This project is proprietary and commercial. Source code distribution without explicit permission is strictly prohibited. 
*(If you are open-sourcing this, change this section to MIT/GPL).*

---
*Built with ❤️ by Putra.*
