const YOBASEPAY_V3_URL = "https://yobasepay.net/";

async function test() {
    console.log("Testing with User-Agent...");
	const response = await fetch(YOBASEPAY_V3_URL, {
		method: "GET",
		headers: {
			"User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
		},
	});

	const text = await response.text();
	console.log("Status:", response.status);
    console.log("Response len:", text.length);
}
test();
