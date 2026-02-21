import Link from "next/link";
import { signIn } from "next-auth/react";
import { GitIcon, LogoGoogle } from "./icons";
import { Input } from "./ui/input";
import { Label } from "./ui/label";

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
  return (
    <div className="relative w-full mx-auto">
      <div className="flex flex-col gap-8 w-full p-10 rounded-4xl border border-white/5 bg-[#18181b] shadow-2xl relative z-10 mx-auto">
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

        <form action={action} className="flex flex-col gap-6 w-full">
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
            <Input
              autoComplete={type === "login" ? "username" : "email"}
              autoFocus={type === "login"}
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white placeholder:text-zinc-600 w-full px-4"
              defaultValue={defaultEmail}
              id={type === "login" ? "username" : "email"}
              name={type === "login" ? "username" : "email"}
              placeholder={
                type === "login"
                  ? "your@email.com or johndoe"
                  : "name@email.com"
              }
              required
              type={type === "login" ? "text" : "email"}
            />
          </div>

          <div className="flex flex-col gap-2">
            <div className="flex justify-between items-center ml-1 relative z-10 w-full cursor-pointer pointer-events-auto">
              <Label
                className="font-medium text-zinc-400 text-sm cursor-pointer"
                htmlFor="password"
              >
                Password
              </Label>
              {type === "login" && (
                <Link
                  className="text-xs text-zinc-400 hover:text-white transition-colors font-medium pointer-events-auto cursor-pointer"
                  href="/forgot-password"
                >
                  Forgot password?
                </Link>
              )}
            </div>
            <Input
              className="bg-zinc-900 border-zinc-800 focus:border-zinc-700 focus:ring-1 focus:ring-zinc-700 transition-all text-sm h-11 rounded-xl text-white w-full px-4"
              id="password"
              name="password"
              placeholder="••••••••"
              required
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
                placeholder="••••••••"
                required
                type="password"
              />
            </div>
          )}

          <div className="mt-2 flex flex-col gap-4">{children}</div>
        </form>

        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-zinc-800" />
          </div>
          <div className="relative flex justify-center text-xs">
            <span className="bg-[#18181b] px-4 text-zinc-500">or</span>
          </div>
        </div>

        <div className="flex flex-col gap-3 relative z-10">
          <button
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-transparent py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
            onClick={() => signIn("google", { callbackUrl: "/chat" })}
            type="button"
          >
            <LogoGoogle size={18} />
            <span>Continue with Google</span>
          </button>
          <button
            className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-transparent py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 transition-all active:scale-[0.98]"
            onClick={() => signIn("github", { callbackUrl: "/chat" })}
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
