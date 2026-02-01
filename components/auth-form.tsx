import Link from "next/link";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { signIn } from "next-auth/react";
import { GitIcon, LogoGoogle } from "./icons";
import { useState, useEffect } from "react";
import { toast } from "./toast";

export function AuthForm({
  action,
  children,
  type,
  defaultEmail = "",
}: {
  action: NonNullable<
    string | ((formData: FormData) => void | Promise<void>) | undefined
  >;
  children: React.ReactNode;
  type: "login" | "register";
  defaultEmail?: string;
}) {
  const [email, setEmail] = useState(defaultEmail);
  const [isSendingCode, setIsSendingCode] = useState(false);
  const [countdown, setCountdown] = useState(0);

  useEffect(() => {
    if (countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [countdown]);

  const handleSendCode = async () => {
    if (!email || !email.includes("@")) {
      toast({ type: "error", description: "Silakan masukkan email yang valid." });
      return;
    }

    setIsSendingCode(true);
    try {
      const res = await fetch("/api/auth/send-code", {
        method: "POST",
        body: JSON.stringify({ email }),
      });

      const data = await res.json();
      if (res.ok) {
        toast({ type: "success", description: "Kode verifikasi telah dikirim ke email kamu!" });
        setCountdown(60);
      } else {
        toast({ type: "error", description: data.error || "Gagal mengirim kode." });
      }
    } catch (error) {
      toast({ type: "error", description: "Terjadi kesalahan saat mengirim kode." });
    } finally {
      setIsSendingCode(false);
    }
  };

  return (
    <div className="relative w-full mx-auto">
      <div className="flex flex-col gap-8 w-full p-10 rounded-[2rem] border border-white/5 bg-[#18181b] shadow-2xl relative z-10 mx-auto">
        <div className="flex flex-col gap-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-white">
            {type === "login" ? "Sign in" : "Sign up"}
          </h1>
          <p className="text-zinc-500 text-[13px] leading-relaxed">
            {type === "login"
              ? "Welcome back! Please enter your details."
              : "Create an account to get started."}
          </p>
        </div>

        <form
          action={action}
          className="flex flex-col gap-6 w-full"
          method="POST"
          onKeyDown={(e) => {
            if (e.key === "Enter" && e.target instanceof HTMLInputElement) {
              e.currentTarget.requestSubmit();
            }
          }}
        >
          {type === "register" && (
            <div className="flex flex-col gap-2">
              <Label
                className="font-medium text-zinc-400 text-sm ml-1"
                htmlFor="username"
              >
                Username
              </Label>
              <Input
                autoComplete="username"
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white placeholder:text-zinc-600 w-full px-4"
                id="username"
                name="username"
                placeholder="johndoe"
                required
                type="text"
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <Label
              className="font-medium text-zinc-400 text-sm ml-1"
              htmlFor={type === "login" ? "username" : "email"}
            >
              {type === "login" ? "Email or Username" : "Email Address"}
            </Label>
            <div className="relative">
              <Input
                autoComplete={type === "login" ? "username" : "email"}
                autoFocus={type === "login"}
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white placeholder:text-zinc-600 w-full px-4 pr-24"
                defaultValue={defaultEmail}
                id={type === "login" ? "username" : "email"}
                name={type === "login" ? "username" : "email"}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={type === "login" ? "your@email.com or johndoe" : "name@email.com"}
                required
                type={type === "login" ? "text" : "email"}
              />
              {type === "register" && (
                <button
                  type="button"
                  onClick={handleSendCode}
                  disabled={isSendingCode || countdown > 0}
                  className="absolute right-2 top-1.5 h-8 px-3 rounded-lg bg-zinc-800 hover:bg-zinc-700 disabled:opacity-50 text-[11px] font-bold text-white transition-all"
                >
                  {isSendingCode ? "Sending..." : countdown > 0 ? `${countdown}s` : "Get Code"}
                </button>
              )}
            </div>
          </div>

          {type === "register" && (
            <div className="flex flex-col gap-2">
              <Label
                className="font-medium text-zinc-400 text-sm ml-1"
                htmlFor="code"
              >
                Verification Code
              </Label>
              <Input
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white placeholder:text-zinc-600 w-full px-4"
                id="code"
                name="code"
                placeholder="123456"
                required
                type="text"
                maxLength={6}
              />
            </div>
          )}

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1">
              <Label
                className="font-medium text-zinc-400 text-sm"
                htmlFor="password"
              >
                Password
              </Label>
              {type === "login" && (
                <Link
                  href="/forgot-password"
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <Input
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white w-full px-4"
              id="password"
              name="password"
              required
              placeholder="••••••••"
              type="password"
            />
          </div>

          {type === "register" && (
            <div className="flex flex-col gap-2">
              <Label
                className="font-medium text-zinc-400 text-sm ml-1"
                htmlFor="confirmPassword"
              >
                Confirm Password
              </Label>
              <Input
                className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white w-full px-4"
                id="confirmPassword"
                name="confirmPassword"
                required
                placeholder="••••••••"
                type="password"
              />
            </div>
          )}

          <div className="mt-2 flex flex-col gap-4">
            {children}
          </div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#18181b] px-4 text-zinc-500">
              or
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <button
            onClick={() => signIn("google", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-transparent py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
            type="button"
          >
            <LogoGoogle size={18} />
            <span>Continue with Google</span>
          </button>
          <button
            onClick={() => signIn("github", { callbackUrl: "/" })}
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-transparent py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
            type="button"
          >
            <GitIcon size={18} />
            <span>Continue with GitHub</span>
          </button>
        </div>
      </div>
    </div>
  );
}
