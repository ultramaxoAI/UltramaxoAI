import { isAllowedFirstPartyOrigin } from "@/lib/request-security";

export function isSafeFirstPartyMutation(request: Request) {
	const origin = request.headers.get("origin");
	const secFetchSite = request.headers.get("sec-fetch-site");

	if (!origin) {
		return false;
	}

	if (!isAllowedFirstPartyOrigin(request)) {
		return false;
	}

	if (secFetchSite && secFetchSite !== "same-origin" && secFetchSite !== "same-site") {
		return false;
	}

	return true;
}

export const NO_STORE_HEADERS = {
	"Cache-Control": "no-store, no-cache, must-revalidate, proxy-revalidate",
	Pragma: "no-cache",
	Expires: "0",
};
