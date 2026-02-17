"use client";

import { useFormStatus } from "react-dom";

import { LoaderIcon } from "@/components/icons";

import { Button } from "./ui/button";

export function SubmitButton({
  children,
  isSuccessful,
}: {
  children: React.ReactNode;
  isSuccessful: boolean;
}) {
  const { pending } = useFormStatus();

  return (
    <Button
      aria-disabled={pending || isSuccessful}
      className="relative w-full rounded-xl h-11 text-sm font-bold bg-gray-100 dark:bg-gray-200 text-gray-900 hover:bg-gray-200 dark:hover:bg-gray-300 transition-all active:scale-[0.98] disabled:opacity-50 disabled:bg-zinc-800 disabled:text-zinc-500 border border-gray-300 dark:border-gray-400 shadow-sm"
      disabled={pending || isSuccessful}
      type={pending ? "button" : "submit"}
    >
      {children}

      {(pending || isSuccessful) && (
        <span className="absolute right-4 animate-spin text-gray-600">
          <LoaderIcon />
        </span>
      )}

      <output aria-live="polite" className="sr-only">
        {pending || isSuccessful ? "Loading" : "Submit form"}
      </output>
    </Button>
  );
}
