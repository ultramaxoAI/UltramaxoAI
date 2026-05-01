import type { Metadata } from "next";

export const metadata: Metadata = {
	title: "API Documentation — Error Reference",
	description:
		"Referensi kode error Ultramaxo API. Panduan troubleshooting untuk HTTP status code dan error message.",
	openGraph: {
		title: "Ultramaxo API — Error Reference",
		description: "Referensi kode error dan troubleshooting API.",
		url: "https://app.ultramaxo.tech/docs/errors",
	},
};

export default function DocsErrorsPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Error Reference</h1>
				<p className="apic-subtitle">
					HTTP status codes and error response format.
				</p>
			</div>

			<div className="apic-prose">
				<h2>Error Response Format</h2>
				<p>All errors follow a consistent JSON structure:</p>
				<pre className="apic-code">{`{
  "error": {
    "message": "Human-readable description of the error.",
    "type": "invalid_request_error",
    "code": "model_not_found"
  }
}`}</pre>

				<h2>HTTP Status Codes</h2>
				<table className="apic-table">
					<thead>
						<tr>
							<th>Code</th>
							<th>Meaning</th>
							<th>Common Cause</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<code className="apic-code--inline">400</code>
							</td>
							<td>Bad Request</td>
							<td>
								Invalid JSON, missing required fields, or invalid parameter
								values.
							</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">401</code>
							</td>
							<td>Unauthorized</td>
							<td>
								Missing or invalid API key. Ensure your key starts with{" "}
								<code className="apic-code--inline">ux_sk_</code>.
							</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">402</code>
							</td>
							<td>Payment Required</td>
							<td>
								Insufficient balance for a paid model. Minimum $2 required. Top
								up via the Billing page.
							</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">404</code>
							</td>
							<td>Not Found</td>
							<td>The requested model ID does not exist in the catalog.</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">429</code>
							</td>
							<td>Rate Limited</td>
							<td>
								Too many requests. Wait and retry after the time indicated in{" "}
								<code className="apic-code--inline">Retry-After</code>.
							</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">500</code>
							</td>
							<td>Internal Server Error</td>
							<td>
								Unexpected server-side error. If persistent, contact support.
							</td>
						</tr>
						<tr>
							<td>
								<code className="apic-code--inline">502</code>
							</td>
							<td>Bad Gateway</td>
							<td>
								Upstream model provider returned an error or is temporarily
								unavailable.
							</td>
						</tr>
					</tbody>
				</table>

				<h2>Handling Errors</h2>
				<h3>Retry Strategy</h3>
				<p>
					For <code className="apic-code--inline">429</code> and{" "}
					<code className="apic-code--inline">502</code> errors, implement
					exponential backoff with jitter:
				</p>
				<pre className="apic-code">{`async function fetchWithRetry(url, options, maxRetries = 3) {
  for (let i = 0; i < maxRetries; i++) {
    const res = await fetch(url, options);
    if (res.status === 429 || res.status === 502) {
      const delay = Math.pow(2, i) * 1000 + Math.random() * 500;
      await new Promise(r => setTimeout(r, delay));
      continue;
    }
    return res;
  }
  throw new Error("Max retries exceeded");
}`}</pre>

				<h3>Error Codes</h3>
				<div className="apic-params">
					<div className="apic-params-row">
						<div className="apic-params-name">invalid_api_key</div>
						<div className="apic-params-meta">
							<div className="apic-params-desc">
								The provided API key is not recognized or has been revoked.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">insufficient_balance</div>
						<div className="apic-params-meta">
							<div className="apic-params-desc">
								Account balance is below the $2 minimum for paid models.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">model_not_found</div>
						<div className="apic-params-meta">
							<div className="apic-params-desc">
								The specified model ID does not exist in the catalog.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">rate_limit_exceeded</div>
						<div className="apic-params-meta">
							<div className="apic-params-desc">
								You&apos;ve exceeded the per-minute or per-day request limit.
							</div>
						</div>
					</div>
					<div className="apic-params-row">
						<div className="apic-params-name">upstream_error</div>
						<div className="apic-params-meta">
							<div className="apic-params-desc">
								The upstream model provider returned an error.
							</div>
						</div>
					</div>
				</div>
			</div>
		</div>
	);
}
