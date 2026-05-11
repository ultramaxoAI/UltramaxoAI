const YOBASEPAY_API_KEY = "yo_base_510054be1c917183e7c61cb256c44d42";
const YOBASEPAY_V3_URL = "https://yobasepay.net/api_v3.php";

async function test() {
	const params = new URLSearchParams({
		action: "create_order",
		api_key: YOBASEPAY_API_KEY,
		amount: "15000",
		ref_id: "test_" + Date.now(),
	});

	const v3Url = `${YOBASEPAY_V3_URL}?${params.toString()}`;
    console.log("Requesting:", v3Url);
	const response = await fetch(v3Url, {
		method: "GET",
		headers: {
			"X-API-KEY": YOBASEPAY_API_KEY,
		},
	});

	const text = await response.text();
	console.log("Status:", response.status);
    console.log("Response:", text);
}
test();
