import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function WorkspacePage() {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-[#07090c] text-white">
      <div className="max-w-2xl px-6 text-center">
        <h1 className="mb-6 text-4xl font-bold tracking-tight sm:text-5xl">Workspace</h1>
        <p className="mb-8 text-lg text-white/70">
          A dedicated space for continuous, uninterrupted flow. Keep your chat, files, and context together in one integrated environment.
        </p>
        <Link 
          href="/"
          className="inline-flex items-center gap-2 rounded-xl bg-white/10 px-5 py-3 text-sm font-medium transition-colors hover:bg-white/20"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to Home
        </Link>
      </div>
    </div>
  );
}
