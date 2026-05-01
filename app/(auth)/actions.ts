"use server";

import {
	createUser,
	getUser,
	getUserByIdentifier,
	getUserByUsername,
} from "@backend/db/queries";
import { z } from "zod";
import { signIn } from "./auth";

const authFormSchema = z.object({
	email: z.string().email().optional(),
	username: z.string().min(3).optional(),
	password: z.string().min(6),
	confirmPassword: z.string().min(6).optional(),
	code: z.string().length(6).optional(),
});

export type LoginActionState = {
	status:
		| "idle"
		| "in_progress"
		| "success"
		| "failed"
		| "invalid_data"
		| "unverified";
};

function isNextRedirectError(
	error: unknown,
): error is Error & { digest: string } {
	return (
		error instanceof Error &&
		"digest" in error &&
		typeof (error as { digest?: unknown }).digest === "string" &&
		(error as { digest: string }).digest.startsWith("NEXT_REDIRECT")
	);
}

function isCredentialsSigninError(
	error: unknown,
): error is { type: "CredentialsSignin" } {
	return (
		typeof error === "object" &&
		error !== null &&
		"type" in error &&
		(error as { type?: unknown }).type === "CredentialsSignin"
	);
}

function isAdminCandidate({
	email,
	role,
}: {
	email?: string | null;
	role?: string | null;
}) {
	const normalizedEmail = email?.trim().toLowerCase();
	const adminEmail = process.env.ADMIN_EMAIL?.trim().toLowerCase();

	return (
		role === "admin" || Boolean(adminEmail && normalizedEmail === adminEmail)
	);
}

export const login = async (
	_: LoginActionState,
	formData: FormData,
): Promise<LoginActionState> => {
	try {
		const validatedData = authFormSchema.parse({
			username: formData.get("username"),
			password: formData.get("password"),
		});
		const identifier = validatedData.username?.trim();

		if (!identifier) {
			return { status: "invalid_data" };
		}

		const emailVerificationEnabled =
			process.env.ENABLE_EMAIL_VERIFICATION === "true";

		if (emailVerificationEnabled) {
			const [candidateUser] = await getUserByIdentifier(identifier);
			const candidateIsAdmin = isAdminCandidate({
				email: candidateUser?.email,
				role: candidateUser?.role,
			});

			if (candidateUser && !candidateUser.emailVerified && !candidateIsAdmin) {
				return { status: "unverified" };
			}
		}

		const result = await signIn("credentials", {
			username: identifier,
			password: validatedData.password,
			redirect: false,
			redirectTo: "/chat",
		});

		if (result?.error) {
			console.error("Login failed:", result.error);
			return { status: "failed" };
		}

		return { status: "success" };
	} catch (error) {
		if (
			isNextRedirectError(error) ||
			(error instanceof Error && error.message.includes("NEXT_REDIRECT"))
		) {
			throw error;
		}

		if (error instanceof z.ZodError) {
			return { status: "invalid_data" };
		}

		if (error instanceof Error && error.name === "CredentialsSignin") {
			return { status: "failed" };
		}

		if (isCredentialsSigninError(error)) {
			return { status: "failed" };
		}

		console.error("Unexpected login error:", error);
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
		| "username_exists"
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
			confirmPassword: formData.get("confirmPassword") || undefined,
		});
		const normalizedEmail = validatedData.email?.trim().toLowerCase();
		// Username is optional -- generate from email prefix if not provided
		const normalizedUsername =
			validatedData.username?.trim() || normalizedEmail?.split("@")[0] || "";

		if (!normalizedEmail) {
			return { status: "invalid_data" };
		}

		// Check if user exists
		const [user] = await getUser(normalizedEmail);
		if (user) {
			return { status: "user_exists" } as RegisterActionState;
		}

		const [existingUsername] = await getUserByUsername(normalizedUsername);
		if (existingUsername) {
			return { status: "username_exists" };
		}

		// Only check password match if confirmPassword was provided
		if (
			validatedData.confirmPassword &&
			validatedData.password !== validatedData.confirmPassword
		) {
			return { status: "password_mismatch" };
		}

		const emailVerificationEnabled =
			process.env.ENABLE_EMAIL_VERIFICATION === "true";

		// 1. Create the user in the database (unverified)
		await createUser(
			normalizedEmail,
			validatedData.password,
			normalizedUsername,
		);

		// 2. If email verification is enabled, do NOT sign in. Generate magic link.
		if (emailVerificationEnabled) {
			const crypto = require("node:crypto");
			const token = crypto.randomUUID();

			const { upsertVerificationCode } = require("@backend/db/queries");
			await upsertVerificationCode(normalizedEmail, token);

			const { sendVerificationEmail } = require("@backend/email");
			await sendVerificationEmail(normalizedEmail, token);

			return { status: "verification_sent" };
		}

		// 3. Otherwise (verification disabled), sign in immediately
		await signIn("credentials", {
			email: normalizedEmail,
			username: normalizedUsername,
			password: validatedData.password,
			redirect: false,
		});

		try {
			const { sendWelcomeEmail } = require("@backend/email");
			await sendWelcomeEmail(normalizedEmail, normalizedUsername || "User");
		} catch (emailErr) {
			console.error("Failed to send welcome email:", emailErr);
		}

		return { status: "success" };
	} catch (error) {
		if (error instanceof z.ZodError) {
			return { status: "invalid_data" };
		}

		return { status: "failed" };
	}
};
