"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";

import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type LoginActionState, login } from "../actions";

export default function Page() {
  const router = useRouter();

  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<LoginActionState, FormData>(
    login,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "failed") {
      toast({
        type: "error",
        description: "Invalid credentials!",
      });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Failed validating your submission!",
      });
    } else if (state.status === "success") {
      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    formAction(formData);
  };

  return (
    <div className="flex h-dvh w-screen items-center justify-center bg-[#09090b] relative overflow-hidden">
      {/* Background radial gradients for depth */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,1)_0%,rgba(9,9,11,1)_100%)] z-0" />
      <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] z-0" />
      <div className="absolute -bottom-[10%] -right-[10%] w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[120px] z-0" />

      <div className="flex w-full max-w-sm flex-col gap-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="font-bold text-3xl tracking-tight text-white">
            Welcome Back
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Enter your username and password to access your account
          </p>
        </div>
        
        <AuthForm action={handleSubmit} defaultEmail="" type="login">
          <SubmitButton isSuccessful={isSuccessful}>Sign In</SubmitButton>
          <p className="mt-6 text-center text-zinc-500 text-xs font-medium">
            {"New to Ultramaxo? "}
            <Link
              className="text-zinc-200 hover:text-primary transition-colors underline underline-offset-4"
              href="/register"
            >
              Construct your account
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
