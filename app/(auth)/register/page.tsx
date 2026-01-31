"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { useActionState, useEffect, useState } from "react";
import { AuthForm } from "@/components/auth-form";
import { SubmitButton } from "@/components/submit-button";
import { toast } from "@/components/toast";
import { type RegisterActionState, register } from "../actions";

export default function Page() {
  const router = useRouter();

  const [isSuccessful, setIsSuccessful] = useState(false);

  const [state, formAction] = useActionState<RegisterActionState, FormData>(
    register,
    {
      status: "idle",
    }
  );

  const { update: updateSession } = useSession();

  // biome-ignore lint/correctness/useExhaustiveDependencies: router and updateSession are stable refs
  useEffect(() => {
    if (state.status === "user_exists") {
      toast({ type: "error", description: "Akun sudah ada!" });
    } else if (state.status === "password_mismatch") {
      toast({ type: "error", description: "Kata sandi tidak cocok!" });
    } else if (state.status === "failed") {
      toast({ type: "error", description: "Gagal membuat akun!" });
    } else if (state.status === "invalid_data") {
      toast({
        type: "error",
        description: "Gagal memvalidasi data Anda!",
      });
    } else if (state.status === "success") {
      toast({ type: "success", description: "Akun berhasil dibuat!" });

      setIsSuccessful(true);
      updateSession();
      router.refresh();
    }
  }, [state.status]);

  const handleSubmit = (formData: FormData) => {
    formAction(formData);
  };

  return (
    <div className="flex min-h-dvh w-screen items-center justify-center bg-[#09090b] relative overflow-hidden py-12">
      {/* Background radial gradients for depth */}
      <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_50%,rgba(24,24,27,1)_0%,rgba(9,9,11,1)_100%)] z-0" />
      <div className="absolute top-[10%] right-[10%] w-[40%] h-[40%] bg-primary/10 rounded-full blur-[120px] z-0" />
      <div className="absolute bottom-[10%] left-[10%] w-[40%] h-[40%] bg-zinc-500/5 rounded-full blur-[120px] z-0" />

      <div className="flex w-full max-w-sm flex-col gap-8 relative z-10 animate-in fade-in zoom-in duration-500">
        <div className="flex flex-col items-center justify-center gap-3 px-4 text-center">
          <h1 className="font-bold text-3xl tracking-tight text-white">
            Daftar Akun
          </h1>
          <p className="text-zinc-500 text-sm font-medium">
            Bergabunglah dengan Ultramaxo AI dan mulai petualanganmu
          </p>
        </div>

        <AuthForm action={handleSubmit} type="register">
          <SubmitButton isSuccessful={isSuccessful}>Buat Akun Sekarang</SubmitButton>
          <p className="mt-6 text-center text-zinc-500 text-xs font-medium">
            {"Sudah punya akun? "}
            <Link
              className="text-zinc-200 hover:text-primary transition-colors underline underline-offset-4"
              href="/login"
            >
              Masuk sekarang
            </Link>
          </p>
        </AuthForm>
      </div>
    </div>
  );
}
