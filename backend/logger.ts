/**
 * Centralized logging service with log levels.
 *
 * Production behaviour:
 *   1. The Next.js SWC compiler strips every `console.*` call from the bundle
 *      at build-time via `compiler.removeConsole`.
 *   2. As a **double safety-net**, this logger is a complete no-op when
 *      `NODE_ENV === "production"` — nothing is emitted, period.
 *
 * Development behaviour:
 *   All levels (debug / info / warn / error) are printed with sensitive
 *   data automatically masked.
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV !== "production";

class Logger {
	/**
	 * In production every method is a no-op.
	 * In development all levels pass through.
	 */
	private shouldLog(_level: LogLevel): boolean {
		return isDevelopment;
	}

	private sanitize(data: unknown): unknown {
		if (typeof data === "string") {
			return data
				.replace(/password[=:]\s*\S+/gi, "password=***")
				.replace(/token[=:]\s*\S+/gi, "token=***")
				.replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=***")
				.replace(/bearer\s+\S+/gi, "bearer ***");
		}

		if (typeof data === "object" && data !== null) {
			const sanitized = { ...data } as Record<string, any>;
			const sensitiveKeys = [
				"password",
				"token",
				"apiKey",
				"api_key",
				"secret",
				"authorization",
			];

			for (const key of Object.keys(sanitized)) {
				if (sensitiveKeys.some((sk) => key.toLowerCase().includes(sk))) {
					sanitized[key] = "***";
				}
			}

			return sanitized;
		}

		return data;
	}

	debug(message: string, ...args: unknown[]) {
		if (this.shouldLog("debug")) {
			console.log(`[DEBUG] ${message}`, ...args.map((a) => this.sanitize(a)));
		}
	}

	info(message: string, ...args: unknown[]) {
		if (this.shouldLog("info")) {
			console.info(`[INFO] ${message}`, ...args.map((a) => this.sanitize(a)));
		}
	}

	warn(message: string, ...args: unknown[]) {
		if (this.shouldLog("warn")) {
			console.warn(`[WARN] ${message}`, ...args.map((a) => this.sanitize(a)));
		}
	}

	error(message: string, error?: unknown, ...args: unknown[]) {
		if (this.shouldLog("error")) {
			const sanitizedError =
				error instanceof Error
					? { message: error.message, stack: error.stack }
					: this.sanitize(error);

			console.error(
				`[ERROR] ${message}`,
				sanitizedError,
				...args.map((a) => this.sanitize(a)),
			);
		}
	}

	// Special method for AI provider logging
	aiProvider(message: string, data?: any) {
		if (isDevelopment) {
			console.log(`[AI Provider] ${message}`, data ? this.sanitize(data) : "");
		}
	}

	// Special method for database operations
	database(operation: string, data?: any) {
		if (isDevelopment) {
			console.log(`[Database] ${operation}`, data ? this.sanitize(data) : "");
		}
	}
}

export const logger = new Logger();
