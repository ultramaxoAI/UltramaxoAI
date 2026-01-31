import Form from "next/form";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import { signIn } from "next-auth/react";
import { GitIcon, LogoGoogle } from "./icons";

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
    <div className="flex flex-col gap-6 w-full max-w-sm mx-auto p-8 rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl shadow-2xl relative overflow-hidden group">
      {/* Background Glow Effect */}
      <div className="absolute -top-24 -left-24 size-48 bg-primary/20 rounded-full blur-3xl group-hover:bg-primary/30 transition-all duration-500" />
      <div className="absolute -bottom-24 -right-24 size-48 bg-zinc-500/10 rounded-full blur-3xl group-hover:bg-zinc-500/20 transition-all duration-500" />

      <Form
        action={action}
        className="flex flex-col gap-5 relative z-10"
      >
        {type === "register" && (
          <div className="flex flex-col gap-2">
            <Label
              className="font-medium text-zinc-400 text-xs uppercase tracking-wider ml-1"
              htmlFor="username"
            >
              Username
            </Label>
            <Input
              autoComplete="username"
              className="bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all text-md md:text-sm h-12 rounded-xl"
              id="username"
              name="username"
              placeholder="putra_alghifa"
              required
              type="text"
            />
          </div>
        )}

        <div className="flex flex-col gap-2">
          <Label
            className="font-medium text-zinc-400 text-xs uppercase tracking-wider ml-1"
            htmlFor={type === "login" ? "username" : "email"}
          >
            {type === "login" ? "Username" : "Email Address"}
          </Label>
          <Input
            autoComplete={type === "login" ? "username" : "email"}
            autoFocus={type === "login"}
            className="bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all text-md md:text-sm h-12 rounded-xl"
            defaultValue={defaultEmail}
            id={type === "login" ? "username" : "email"}
            name={type === "login" ? "username" : "email"}
            placeholder={type === "login" ? "Your username" : "user@example.com"}
            required
            type={type === "login" ? "text" : "email"}
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center ml-1">
            <Label
              className="font-medium text-zinc-400 text-xs uppercase tracking-wider"
              htmlFor="password"
            >
              Password
            </Label>
            {type === "login" && (
              <a
                href="#"
                className="text-[10px] uppercase tracking-widest text-zinc-500 hover:text-primary transition-colors font-bold"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Fitur lupa password sedang dalam pengembangan.");
                }}
              >
                Forgot?
              </a>
            )}
          </div>
          <Input
            className="bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all text-md md:text-sm h-12 rounded-xl"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>

        {type === "register" && (
          <div className="flex flex-col gap-2">
            <Label
              className="font-medium text-zinc-400 text-xs uppercase tracking-wider ml-1"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </Label>
            <Input
              className="bg-zinc-900/50 border-zinc-800 focus:border-primary/50 focus:ring-primary/20 transition-all text-md md:text-sm h-12 rounded-xl"
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
            />
          </div>
        )}

        <div className="mt-4">{children}</div>
      </Form>

      <div className="relative z-10">
        <div className="absolute inset-0 flex items-center">
          <span className="w-full border-t border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-[10px] uppercase tracking-[0.2em] font-bold">
          <span className="bg-transparent px-4 text-zinc-500">
            Social Access
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 relative z-10 mb-2">
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition-all active:scale-95"
          type="button"
        >
          <GitIcon />
          <span>GitHub</span>
        </button>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-800 bg-zinc-950/50 py-3 text-xs font-bold uppercase tracking-widest text-zinc-400 hover:bg-zinc-900 hover:text-zinc-200 hover:border-zinc-700 transition-all active:scale-95"
          type="button"
        >
          <LogoGoogle />
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
