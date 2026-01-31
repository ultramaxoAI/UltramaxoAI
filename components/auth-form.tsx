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
    <div className="flex flex-col gap-6">
      <Form
        action={action}
        className="flex flex-col gap-4 px-4 sm:px-16"
      >
        {type === "register" && (
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="username"
            >
              Username
            </Label>
            <Input
              autoComplete="username"
              className="bg-muted text-md md:text-sm h-11"
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
            className="font-normal text-zinc-600 dark:text-zinc-400"
            htmlFor="email"
          >
            Email Address
          </Label>
          <Input
            autoComplete="email"
            autoFocus={type === "login"}
            className="bg-muted text-md md:text-sm h-11"
            defaultValue={defaultEmail}
            id="email"
            name="email"
            placeholder="user@example.com"
            required
            type="email"
          />
        </div>

        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="password"
            >
              Password
            </Label>
            {type === "login" && (
              <a
                href="#"
                className="text-xs text-zinc-500 hover:text-zinc-800 dark:hover:text-zinc-200 transition-colors"
                onClick={(e) => {
                  e.preventDefault();
                  alert("Fitur lupa password sedang dalam pengembangan.");
                }}
              >
                Forgot password?
              </a>
            )}
          </div>
          <Input
            className="bg-muted text-md md:text-sm h-11"
            id="password"
            name="password"
            required
            type="password"
          />
        </div>

        {type === "register" && (
          <div className="flex flex-col gap-2">
            <Label
              className="font-normal text-zinc-600 dark:text-zinc-400"
              htmlFor="confirmPassword"
            >
              Confirm Password
            </Label>
            <Input
              className="bg-muted text-md md:text-sm h-11"
              id="confirmPassword"
              name="confirmPassword"
              required
              type="password"
            />
          </div>
        )}

        <div className="mt-2">{children}</div>
      </Form>

      <div className="relative px-4 sm:px-16">
        <div className="absolute inset-0 flex items-center px-4 sm:px-16">
          <span className="w-full border-t border-zinc-200 dark:border-zinc-800" />
        </div>
        <div className="relative flex justify-center text-xs uppercase">
          <span className="bg-background px-2 text-zinc-500">
            Or continue with
          </span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4 px-4 sm:px-16 mb-4">
        <button
          onClick={() => signIn("github", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all"
          type="button"
        >
          <GitIcon />
          <span>GitHub</span>
        </button>
        <button
          onClick={() => signIn("google", { callbackUrl: "/" })}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-white px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-zinc-50 hover:shadow-sm dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-300 dark:hover:bg-zinc-900 transition-all"
          type="button"
        >
          <LogoGoogle />
          <span>Google</span>
        </button>
      </div>
    </div>
  );
}
