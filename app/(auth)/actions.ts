"use server";

import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";

const authFormSchema = z.object({
  email: z.string().email().optional(),
  username: z.string().min(3).optional(),
  password: z.string().min(6),
  confirmPassword: z.string().min(6).optional(),
});

export type LoginActionState = {
  status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
  _: LoginActionState,
  formData: FormData
): Promise<LoginActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      username: formData.get("username"),
      password: formData.get("password"),
    });

    const result = await signIn("credentials", {
      username: validatedData.username,
      password: validatedData.password,
      redirect: false,
    });

    if (result?.error) {
      console.error("Login failed:", result.error);
      return { status: "failed" };
    }

    return { status: "success" };
  } catch (error) {
    console.error("Unexpected login error:", error);
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};

export type RegisterActionState = {
  status:
    | "idle"
    | "in_progress"
    | "success"
    | "failed"
    | "user_exists"
    | "password_mismatch"
    | "invalid_data";
};

export const register = async (
  _: RegisterActionState,
  formData: FormData
): Promise<RegisterActionState> => {
  try {
    const validatedData = authFormSchema.parse({
      email: formData.get("email"),
      password: formData.get("password"),
      username: formData.get("username"),
      confirmPassword: formData.get("confirmPassword"),
    });

    if (validatedData.password !== validatedData.confirmPassword) {
      return { status: "password_mismatch" };
    }

    const [user] = await getUser(validatedData.email!);

    if (user) {
      return { status: "user_exists" } as RegisterActionState;
    }
    await createUser(
      validatedData.email!,
      validatedData.password,
      validatedData.username
    );
    await signIn("credentials", {
      email: validatedData.email,
      username: validatedData.username,
      password: validatedData.password,
      redirect: false,
    });

    return { status: "success" };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { status: "invalid_data" };
    }

    return { status: "failed" };
  }
};
