import {
	handleYoBasePayWebhook,
	handleYoBasePayWebhookHealthcheck,
} from "@/app/api/webhooks/yobasepay/handler";

export const POST = handleYoBasePayWebhook;
export const GET = handleYoBasePayWebhookHealthcheck;
