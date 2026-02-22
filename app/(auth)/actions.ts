"use server";

import { z } from "zod";
import { createUser, getUser } from "@/lib/db/queries";
import { signIn } from "./auth";

const authFormSchema = z.object({
	email: z.string().email().optional(),
	username: z.string().min(3).optional(),
	password: z.string().min(6),
	confirmPassword: z.string().min(6).optional(),
	code: z.string().length(6).optional(),
});

export type LoginActionState = {
	status: "idle" | "in_progress" | "success" | "failed" | "invalid_data";
};

export const login = async (
	_: LoginActionState,
	formData: FormData,
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
		| "invalid_data"
		| "invalid_code"
		| "verification_sent";
};

export const register = async (
	_: RegisterActionState,
	formData: FormData,
): Promise<RegisterActionState> => {
	try {
		const validatedData = authFormSchema.parse({
			email: formData.get("email"),
			password: formData.get("password"),
			username: formData.get("username"),
			confirmPassword: formData.get("confirmPassword"),
		});

		// Check if user exists
		const [user] = await getUser(validatedData.email as string);
		if (user) {
			return { status: "user_exists" } as RegisterActionState;
		}

		if (validatedData.password !== validatedData.confirmPassword) {
			return { status: "password_mismatch" };
		}

		const emailVerificationEnabled =
			process.env.ENABLE_EMAIL_VERIFICATION === "true";

		// 1. Create the user in the database (unverified)
		await createUser(
			validatedData.email as string,
			validatedData.password,
			validatedData.username,
		);

		// 2. If email verification is enabled, do NOT sign in. Generate magic link.
		if (emailVerificationEnabled) {
			const crypto = require("node:crypto");
			const token = crypto.randomUUID();

			const { upsertVerificationCode } = require("@/lib/db/queries");
			await upsertVerificationCode(validatedData.email as string, token);

			const { sendVerificationEmail } = require("@/lib/email");
			await sendVerificationEmail(validatedData.email as string, token);

			return { status: "verification_sent" };
		}

		// 3. Otherwise (verification disabled), sign in immediately
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
