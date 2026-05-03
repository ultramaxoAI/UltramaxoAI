import {
	handleYoBasePayWebhook,
	handleYoBasePayWebhookHealthcheck,
} from "./handler";

export const POST = handleYoBasePayWebhook;
export const GET = handleYoBasePayWebhookHealthcheck;
