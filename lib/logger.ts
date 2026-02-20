/**
 * Centralized logging service with log levels
 * Prevents sensitive data exposure in production logs
 */

type LogLevel = "debug" | "info" | "warn" | "error";

const isDevelopment = process.env.NODE_ENV === "development";
const isProduction = process.env.NODE_ENV === "production";

class Logger {
  private shouldLog(level: LogLevel): boolean {
    if (isDevelopment) {
      return true;
    }
    // In production, only log warnings and errors
    return level === "warn" || level === "error";
  }

  private sanitize(data: any): any {
    if (typeof data === "string") {
      // Mask sensitive patterns
      return data
        .replace(/password[=:]\s*\S+/gi, "password=***")
        .replace(/token[=:]\s*\S+/gi, "token=***")
        .replace(/api[_-]?key[=:]\s*\S+/gi, "api_key=***")
        .replace(/bearer\s+\S+/gi, "bearer ***");
    }

    if (typeof data === "object" && data !== null) {
      const sanitized = { ...data };
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

  debug(message: string, ...args: any[]) {
    if (this.shouldLog("debug")) {
      console.log(`[DEBUG] ${message}`, ...args.map((a) => this.sanitize(a)));
    }
  }

  info(message: string, ...args: any[]) {
    if (this.shouldLog("info")) {
      console.info(`[INFO] ${message}`, ...args.map((a) => this.sanitize(a)));
    }
  }

  warn(message: string, ...args: any[]) {
    if (this.shouldLog("warn")) {
      console.warn(`[WARN] ${message}`, ...args.map((a) => this.sanitize(a)));
    }
  }

  error(message: string, error?: any, ...args: any[]) {
    if (this.shouldLog("error")) {
      const sanitizedError =
        error instanceof Error
          ? {
              message: error.message,
              stack: isProduction ? undefined : error.stack,
            }
          : this.sanitize(error);

      console.error(
        `[ERROR] ${message}`,
        sanitizedError,
        ...args.map((a) => this.sanitize(a))
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
