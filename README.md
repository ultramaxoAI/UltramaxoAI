<div align="center">
  <h1>🚀 UltramaxoAI</h1>
  <p>Advanced AI-powered chatbot with code workspace, artifacts, and multimodal support</p>
</div>

<p align="center">
  <a href="#features"><strong>Features</strong></a> ·
  <a href="#tech-stack"><strong>Tech Stack</strong></a> ·
  <a href="#getting-started"><strong>Getting Started</strong></a> ·
  <a href="#deployment"><strong>Deployment</strong></a>
</p>
<br/>

## Features

- 🤖 **Groq-Powered AI** - Ultra-fast responses using Llama 3.3 70B
- 💬 **Advanced Chat** - Real-time streaming with message history
- 📝 **Code Workspace** - Built-in code editor with syntax highlighting
- 🎨 **Artifacts** - Create and edit documents, images, and sheets
- 🔐 **User Authentication** - Secure login with NextAuth.js
- 💳 **Pro Subscription** - Redeem codes for premium features
- 🌓 **Dark Mode** - Beautiful UI with theme support
- 📱 **Responsive Design** - Works on desktop and mobile

## Tech Stack

- **Framework**: [Next.js 14](https://nextjs.org) with App Router
- **AI**: [AI SDK](https://ai-sdk.dev) + [Groq](https://groq.com) (Llama 3.3 70B)
- **Database**: PostgreSQL (Neon/Supabase)
- **Auth**: [NextAuth.js](https://authjs.dev)
- **Styling**: [Tailwind CSS](https://tailwindcss.com) + [shadcn/ui](https://ui.shadcn.com)
- **Deployment**: Vercel

## Getting Started
## Getting Started

### Prerequisites

- Node.js 18+ and pnpm
- PostgreSQL database (Neon, Supabase, or local)
- [Groq API Key](https://console.groq.com/keys)

### Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/ultramaxo.git
cd ultramaxo
```

2. Install dependencies:
```bash
pnpm install
```

3. Set up environment variables (copy from `.env.example`):
```bash
cp .env.example .env.local
```

4. Configure your `.env.local` file with required variables:
- `AUTH_SECRET` - Generate with: `openssl rand -base64 32`
- `POSTGRES_URL` - Your database connection string
- `GROQ_API_KEY` - Your Groq API key
- `NEXT_PUBLIC_APP_URL` - Your app URL (e.g., https://ultramaxo.tech)

5. Run database migrations:
```bash
pnpm db:migrate
```

6. Start the development server:
```bash
pnpm dev
```

Your app should now be running on [http://localhost:3000](http://localhost:3000)!

## Deployment

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository on [Vercel](https://vercel.com)
3. Add environment variables in Vercel dashboard
4. Deploy!

### Environment Variables

See [.env.example](.env.example) for all required environment variables.

## License

MIT

---

<div align="center">
  <p>Built with ❤️ using Next.js and Groq AI</p>
</div>
