const PRODUCTION_FIRST_PARTY_ORIGINS = [
	"https://ultramaxo.tech",
	"https://www.ultramaxo.tech",
	"https://app.ultramaxo.tech",
	"https://chat.ultramaxo.tech",
];

export function getAllowedFirstPartyOrigins(request: Request) {
	const allowedOrigins = new Set<string>();
	const requestUrl = new URL(request.url);

	allowedOrigins.add(requestUrl.origin);

	if (process.env.NODE_ENV === "production") {
		for (const origin of PRODUCTION_FIRST_PARTY_ORIGINS) {
			allowedOrigins.add(origin);
		}
	}

	const configuredOrigins = [
		process.env.NEXTAUTH_URL,
		process.env.AUTH_URL,
		process.env.APP_URL,
		process.env.CHAT_URL,
		process.env.MAIN_URL,
	]
		.filter(Boolean)
		.map((value) => {
			try {
				return new URL(value as string).origin;
			} catch {
				return null;
			}
		})
		.filter((value): value is string => Boolean(value));

	for (const origin of configuredOrigins) {
		allowedOrigins.add(origin);
	}

	return allowedOrigins;
}

export function isAllowedFirstPartyOrigin(request: Request) {
	const originHeader = request.headers.get("origin");

	if (!originHeader) {
		return true;
	}

	return getAllowedFirstPartyOrigins(request).has(originHeader);
}
