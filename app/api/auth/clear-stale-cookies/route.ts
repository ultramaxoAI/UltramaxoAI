import { NextResponse } from "next/server";

const COOKIE_NAMES = [
	"authjs.session-token",
	"authjs.callback-url",
	"authjs.csrf-token",
	"authjs.pkce.code_verifier",
	"authjs.state",
	"authjs.nonce",
	"next-auth.session-token",
	"next-auth.callback-url",
	"next-auth.csrf-token",
];

const COOKIE_PREFIXES = ["", "__Secure-"];
const COOKIE_DOMAINS = [undefined, ".ultramaxo.tech"] as const;
const COOKIE_CHUNK_SUFFIXES = ["", ".0", ".1", ".2", ".3", ".4", ".5"];
const isProduction = process.env.NODE_ENV === "production";

function expireAuthCookies(response: NextResponse) {
	for (const domain of COOKIE_DOMAINS) {
		for (const prefix of COOKIE_PREFIXES) {
			for (const cookieName of COOKIE_NAMES) {
				for (const suffix of COOKIE_CHUNK_SUFFIXES) {
					response.cookies.set({
						name: `${prefix}${cookieName}${suffix}`,
						value: "",
						expires: new Date(0),
						path: "/",
						httpOnly:
							cookieName.includes("session-token") ||
							cookieName.includes("csrf-token"),
						secure: isProduction,
						sameSite: "lax",
						...(domain && isProduction ? { domain } : {}),
					});
				}
			}
		}
	}

	return response;
}

export async function GET() {
	return expireAuthCookies(
		new NextResponse("stale auth cookies cleared", {
			status: 200,
			headers: {
				"cache-control":
					"no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0",
				pragma: "no-cache",
				expires: "0",
			},
		}),
	);
}

export async function POST() {
	return GET();
}
