import Link from "next/link";
import { ArrowLeft, Shield, Lock, Server } from "lucide-react";

export default function SecurityPage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white selection:bg-white/20 font-body flex flex-col relative overflow-hidden">
      <div className="absolute top-0 inset-x-0 h-[500px] bg-gradient-to-b from-[#1a1a1a] to-transparent opacity-50 pointer-events-none" />
      <nav className="fixed top-0 left-0 right-0 p-6 z-50">
        <Link href="/" className="inline-flex items-center gap-2 text-white/60 hover:text-white transition-colors bg-black/50 backdrop-blur-md px-4 py-2 rounded-full border border-white/10 w-fit">
          <ArrowLeft className="w-4 h-4" />
          <span className="text-sm font-medium">Back to Home</span>
        </Link>
      </nav>
      <main className="flex-1 flex flex-col items-center p-6 text-center relative z-10 mt-32 mb-20">
        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center border border-white/10 mb-8">
          <Shield className="w-8 h-8 text-white" />
        </div>
        <h1 className="text-4xl md:text-5xl lg:text-6xl font-heading italic tracking-tight mb-6">Data Security</h1>
        <p className="max-w-2xl mx-auto text-white/60 text-base md:text-lg leading-relaxed mb-16">
          Enterprise-grade security built into the foundation of your workspace. We take the protection of your code and conversations seriously.
        </p>

        <div className="grid md:grid-cols-2 gap-6 max-w-4xl mx-auto text-left">
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <Lock className="w-6 h-6 text-white mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Encryption at Rest & Transit</h3>
            <p className="text-white/60 leading-relaxed text-sm">All data is encrypted in transit using TLS 1.3 and at rest using AES-256. Your sensitive API keys are stored securely using industry-standard cryptography.</p>
          </div>
          <div className="bg-white/5 border border-white/10 p-8 rounded-3xl">
            <Server className="w-6 h-6 text-white mb-4" />
            <h3 className="text-xl font-semibold text-white mb-3">Isolated Infrastructure</h3>
            <p className="text-white/60 leading-relaxed text-sm">Our backend leverages secure, isolated environments for execution and storage. We adhere strictly to modern compliance and access control standards.</p>
          </div>
        </div>
      </main>
    </div>
  );
}
