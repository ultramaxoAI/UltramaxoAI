const YOBASEPAY_API_KEY = "yo_base_510054be1c917183e7c61cb256c44d42";
const YOBASEPAY_V3_URL = "https://yobasepay.net/api_v3.php";
const YOBASEPAY_BASE_URL = "https://yobasepay.net/api/v3";

async function testV3() {
    console.log("=== V3 API ===");
	const params = new URLSearchParams({
		action: "create_order",
		api_key: YOBASEPAY_API_KEY,
		amount: "15000",
		ref_id: "test_" + Date.now(),
	});

	const v3Url = `${YOBASEPAY_V3_URL}?${params.toString()}`;
	const response = await fetch(v3Url, {
		method: "GET",
		headers: {
			"X-API-KEY": YOBASEPAY_API_KEY,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
	});

	const text = await response.text();
	console.log("Status:", response.status);
    console.log("Response:", text.slice(0, 500));
}

const crypto = require("node:crypto");
async function testV1() {
    console.log("\n=== V1 API ===");
    const merchantRef = "test_" + Date.now();
    const amount = 15000;
	const signaturePayload = `${merchantRef}${amount}`;
	const signature = crypto.createHmac("sha256", YOBASEPAY_API_KEY)
		.update(signaturePayload)
		.digest("hex");

	const payload = {
		api_key: YOBASEPAY_API_KEY,
		merchant_ref: merchantRef,
		amount,
		customer_name: "Test",
		description: "Test",
		success_url: "https://ultramaxo.tech",
		signature,
	};
    
	const response = await fetch(`${YOBASEPAY_BASE_URL}/transaction/create`, {
		method: "POST",
		headers: {
			"Content-Type": "application/json",
			"Authorization": `Bearer ${YOBASEPAY_API_KEY}`,
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
		},
		body: JSON.stringify(payload),
	});

	const text = await response.text();
	console.log("Status:", response.status);
    console.log("Response:", text.slice(0, 500));
}

async function main() {
    await testV3();
    await testV1();
}
main();
