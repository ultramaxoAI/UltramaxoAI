export default function DocsBillingPage() {
	return (
		<div className="apic-stack apic-stack--32">
			<div>
				<h1 className="apic-h1">Billing &amp; Limits</h1>
				<p className="apic-subtitle">
					Understand how billing, rate limits, and quotas work.
				</p>
			</div>

			<div className="apic-prose">
				<h2>How Billing Works</h2>
				<p>
					Ultramaxo API uses a <strong>pay-as-you-go</strong> model. You
					pre-load credits to your account and are charged per request based on
					token usage.
				</p>

				<h3>Cost Calculation</h3>
				<p>Each request&apos;s cost is calculated using the formula:</p>
				<pre className="apic-code">{`cost = ceil(
  (prompt_tokens / 1,000,000) × input_price +
  (completion_tokens / 1,000,000) × output_price
)`}</pre>
				<p>
					Where <code className="apic-code--inline">input_price</code> and{" "}
					<code className="apic-code--inline">output_price</code> are in{" "}
					<strong>USD per 1 million tokens</strong>, as listed in the model
					catalog.
				</p>

				<h3>Free Models</h3>
				<p>
					Models marked as &quot;free&quot; (e.g. GPT-5.3) do not deduct from
					your balance. You can use them without any credits. However, rate
					limits still apply.
				</p>

				<h3>Minimum Balance</h3>
				<div className="apic-note apic-note--warn">
					To use paid models, your account must have a balance of at least{" "}
					<strong>$2.00 USD</strong> (200 cents). If your balance drops below
					this threshold, requests to paid models will return a{" "}
					<code className="apic-code--inline">402</code> error.
				</div>

				<h2>Top-up</h2>
				<p>
					You can add balance from the Billing page. The minimum top-up is{" "}
					<strong>$2 USD</strong>, which is converted to IDR and processed via
					QRIS payment.
				</p>

				<h2>Balance API</h2>
				<p>You can check your balance programmatically using your API key:</p>
				<pre className="apic-code">{`GET /v1/balance

Authorization: Bearer ux_sk_YOUR_KEY`}</pre>
				<p>Response:</p>
				<pre className="apic-code">{`{
  "data": {
    "balance_cents": 500,
    "balance_usd": "5.0000",
    "lifetime_granted_cents": 1000,
    "lifetime_spent_cents": 500
  }
}`}</pre>

				<h2>Usage API</h2>
				<p>Query your usage history to track spending over time:</p>
				<pre className="apic-code">{`GET /v1/usage?days=30&limit=50

Authorization: Bearer ux_sk_YOUR_KEY`}</pre>
				<p>Response:</p>
				<pre className="apic-code">{`{
  "data": {
    "period_days": 30,
    "total_requests": 142,
    "total_spent_cents": 87,
    "total_spent_usd": "0.8700",
    "transactions": [
      {
        "id": "...",
        "amount_cents": 1,
        "balance_after_cents": 413,
        "reason": "API usage for gpt-5.3-codex",
        "metadata": { "model": "gpt-5.3-codex", "promptTokens": 120, "completionTokens": 450 },
        "created_at": "2026-04-28T..."
      }
    ]
  }
}`}</pre>

				<h2>Rate Limits</h2>
				<p>
					API requests are rate-limited per API key to ensure fair usage and
					system stability.
				</p>
				<table className="apic-table">
					<thead>
						<tr>
							<th>Tier</th>
							<th>Limit</th>
							<th>Value</th>
						</tr>
					</thead>
					<tbody>
						<tr>
							<td>
								<span className="apic-tag apic-tag--green">Free</span>
							</td>
							<td>Requests per minute</td>
							<td>5</td>
						</tr>
						<tr>
							<td>
								<span className="apic-tag apic-tag--amber">Paid</span>
							</td>
							<td>Requests per minute</td>
							<td>60</td>
						</tr>
						<tr>
							<td>All</td>
							<td>Concurrent requests</td>
							<td>10</td>
						</tr>
					</tbody>
				</table>

				<div className="apic-note">
					Rate limit headers are included in every response:{" "}
					<code className="apic-code--inline">X-RateLimit-Limit</code>,{" "}
					<code className="apic-code--inline">X-RateLimit-Remaining</code>, and{" "}
					<code className="apic-code--inline">X-RateLimit-Reset</code>.
				</div>

				<h2>Usage Tracking</h2>
				<p>
					Every request creates a transaction record. You can view your
					transaction history on the Billing page, query it programmatically via
					the <code className="apic-code--inline">/v1/usage</code> endpoint, or
					check your balance via{" "}
					<code className="apic-code--inline">/v1/balance</code>.
				</p>
			</div>
		</div>
	);
}
