module Api
  module V1
    class ApiDocsController < ApplicationController
      def show
        render html: api_docs_html.html_safe, layout: false
      end

      private

      def api_docs_html
        <<~HTML
          <!DOCTYPE html>
          <html lang="en">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>OpenFinance API Documentation</title>
            <style>
              * { margin: 0; padding: 0; box-sizing: border-box; }
              body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; max-width: 900px; margin: 0 auto; padding: 2rem; color: #1a1a2e; background: #f8f9fa; }
              h1 { font-size: 2rem; margin-bottom: 0.5rem; }
              .subtitle { color: #666; margin-bottom: 2rem; }
              h2 { margin-top: 2rem; margin-bottom: 1rem; color: #16213e; border-bottom: 2px solid #e2e8f0; padding-bottom: 0.5rem; }
              .endpoint { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 1.25rem; margin-bottom: 1rem; }
              .method { display: inline-block; background: #10b981; color: #fff; padding: 2px 10px; border-radius: 4px; font-weight: 700; font-size: 0.85rem; margin-right: 0.5rem; }
              .path { font-family: 'SF Mono', Monaco, monospace; font-weight: 600; }
              .desc { margin-top: 0.5rem; color: #555; font-size: 0.95rem; }
              .params { margin-top: 0.75rem; }
              .params th, .params td { text-align: left; padding: 4px 12px 4px 0; font-size: 0.9rem; }
              .params th { color: #888; font-weight: 600; }
              code { background: #f1f5f9; padding: 2px 6px; border-radius: 3px; font-size: 0.85rem; }
              .auth-note { background: #fef3c7; border: 1px solid #f59e0b; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
              .rate-note { background: #dbeafe; border: 1px solid #3b82f6; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
              .embed-note { background: #dcfce7; border: 1px solid #22c55e; border-radius: 6px; padding: 1rem; margin-bottom: 1.5rem; }
              pre { background: #1e293b; color: #e2e8f0; padding: 1rem; border-radius: 6px; overflow-x: auto; font-size: 0.85rem; margin-top: 0.75rem; }
            </style>
          </head>
          <body>
            <h1>OpenFinance Public API</h1>
            <p class="subtitle">v1 &mdash; REST API for programmatic access to your financial data</p>

            <div class="auth-note">
              <strong>🔑 Authentication:</strong> All API endpoints require an <code>X-Api-Key</code> header. Generate keys in Settings → API Keys.
            </div>

            <div class="rate-note">
              <strong>⏱ Rate Limiting:</strong> 60 requests per minute per API key. Responses include <code>X-RateLimit-Limit</code>, <code>X-RateLimit-Remaining</code>, and <code>X-RateLimit-Reset</code> headers.
            </div>

            <h2>Accounts</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/accounts</span>
              <p class="desc">List all visible accounts with current balances, grouped by type.</p>
            </div>

            <h2>Transactions</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/transactions</span>
              <p class="desc">List transactions with optional filters. Returns up to 200 per request.</p>
              <table class="params">
                <tr><th>Param</th><th>Type</th><th>Description</th></tr>
                <tr><td><code>start_date</code></td><td>string</td><td>Filter from date (YYYY-MM-DD)</td></tr>
                <tr><td><code>end_date</code></td><td>string</td><td>Filter to date (YYYY-MM-DD)</td></tr>
                <tr><td><code>category</code></td><td>string</td><td>Filter by category name</td></tr>
                <tr><td><code>account_id</code></td><td>integer</td><td>Filter by account ID</td></tr>
                <tr><td><code>limit</code></td><td>integer</td><td>Max results (default 50, max 200)</td></tr>
                <tr><td><code>offset</code></td><td>integer</td><td>Pagination offset</td></tr>
              </table>
              <pre>curl -H "X-Api-Key: YOUR_KEY" "#{request_base_url}/api/v1/transactions?limit=10&start_date=2026-01-01"</pre>
            </div>

            <h2>Budgets</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/budgets/:month</span>
              <p class="desc">Budget summary for a given month with per-category spending vs. budgeted amounts.</p>
              <table class="params">
                <tr><th>Param</th><th>Type</th><th>Description</th></tr>
                <tr><td><code>:month</code></td><td>string</td><td>Month in YYYY-MM format</td></tr>
              </table>
            </div>

            <h2>Net Worth</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/net_worth</span>
              <p class="desc">Current net worth summary with asset/liability breakdown by account.</p>
            </div>

            <h2>Monthly Summary</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/monthly_summary/:month</span>
              <p class="desc">Income, expenses, and savings rate for a given month.</p>
            </div>

            <h2>Daily Spend</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/daily_spend/:date</span>
              <p class="desc">Spending breakdown for a specific date.</p>
            </div>

            <h2>Account Balances</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/account_balances</span>
              <p class="desc">Current balances for all accounts.</p>
            </div>

            <h2>Webhooks</h2>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/webhooks</span>
              <p class="desc">List your webhook subscriptions.</p>
            </div>
            <div class="endpoint">
              <span class="method">POST</span> <span class="path">/api/v1/webhooks</span>
              <p class="desc">Create a webhook subscription. Events are delivered via HMAC-signed POST requests.</p>
              <table class="params">
                <tr><th>Param</th><th>Type</th><th>Description</th></tr>
                <tr><td><code>url</code></td><td>string</td><td>Webhook delivery URL (HTTPS)</td></tr>
                <tr><td><code>events</code></td><td>array</td><td>Event types: <code>transaction.created</code>, <code>transaction.updated</code>, <code>account.synced</code>, <code>budget.exceeded</code></td></tr>
              </table>
            </div>

            <h2>Embeddable Widgets</h2>
            <div class="embed-note">
              <strong>🖼 Iframe-Ready:</strong> Add <code>.html</code> to embed endpoints for self-contained HTML widgets. Use <code>?theme=dark</code> for dark mode. No API key required — uses share tokens.
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/embed/net_worth?token=TOKEN</span>
              <p class="desc">Net worth widget (JSON or HTML). Shows assets, liabilities, and net worth.</p>
              <pre>&lt;iframe src="#{request_base_url}/api/v1/embed/net_worth.html?token=YOUR_TOKEN&theme=light"
        width="400" height="220" frameborder="0"&gt;&lt;/iframe&gt;</pre>
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/embed/spending?token=TOKEN</span>
              <p class="desc">Monthly spending widget (JSON or HTML). Shows total spent and transaction count.</p>
              <pre>&lt;iframe src="#{request_base_url}/api/v1/embed/spending.html?token=YOUR_TOKEN&theme=light"
        width="400" height="220" frameborder="0"&gt;&lt;/iframe&gt;</pre>
            </div>
            <div class="endpoint">
              <span class="method">GET</span> <span class="path">/api/v1/embed/budget?token=TOKEN</span>
              <p class="desc">Budget summary widget (JSON or HTML). Shows budgeted vs. spent with category progress bars.</p>
              <table class="params">
                <tr><th>Param</th><th>Type</th><th>Description</th></tr>
                <tr><td><code>month</code></td><td>string</td><td>Month in YYYY-MM format (defaults to current month)</td></tr>
                <tr><td><code>theme</code></td><td>string</td><td><code>light</code> (default) or <code>dark</code></td></tr>
              </table>
              <pre>&lt;iframe src="#{request_base_url}/api/v1/embed/budget.html?token=YOUR_TOKEN&month=2026-03&theme=dark"
        width="420" height="500" frameborder="0"&gt;&lt;/iframe&gt;</pre>
            </div>
          </body>
          </html>
        HTML
      end

      def request_base_url
        ERB::Util.html_escape(request.base_url)
      end
    end
  end
end
