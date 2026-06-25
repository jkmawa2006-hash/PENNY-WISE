# PENNY-WISE – Personal Finance Manager

A fully client-side personal finance dashboard with multi-user support, income management, budgeting, goal tracking, and financial reporting.

## Quick Start

1. Open `index.html` in any modern browser.
2. Create an account (username + password).
3. Start adding transactions, declaring income, setting budgets, and more.
4. All data is saved locally in your browser (`localStorage`).

## File Structure

| File | Description |
|------|-------------|
| `index.html` | HTML structure for all 12 sections + auth overlay |
| `style.css` | Sage green (#96AA9A) theme with dark/light mode, responsive breakpoints |
| `app.js` | All application logic (auth, CRUD, charts, recurring, theme toggle, etc.) |

## Features

- **Multi-User Authentication** — Register, login, logout. Each user's data is stored separately under `budgetPro_{username}`. Sessions persist per tab via `sessionStorage`.

- **Dashboard** — KPI cards (total income, expenses, net balance, budget remaining). Three interactive charts: Income vs Expense Trend (line), Expense by Category (donut), Monthly Comparison (bar). Spending Insights panel with month-over-month comparison. Statistics Summary (count, averages, projections, savings rate).

- **Transactions** — Add income/expense transactions with category, date, and description. Full CRUD: add, edit (modal), delete (with undo toast). Search/filter by description, category, or type. CSV Export.

- **Income Sources** — Declare income sources with name, type (Salary, Freelance, Business, Investment, Rental, Passive, Other), frequency (monthly/yearly/one-time), amount, and earnings description. Auto-generates income transactions linked to each source so dashboard KPIs and charts reflect declared income automatically. Sources update their linked transaction when edited; deleted sources remove their transaction. New transactions are created each month for recurring sources.

- **Budgets** — Set monthly spending limits per category. Track progress with visual progress bars and warning/over-budget indicators. Category Manager: add/remove custom categories.

- **Goals** — Define savings targets with a deadline, icon, and tracked amount. Visual progress bars with percentage complete and days remaining.

- **Reports** — Weekly spending trend (bar chart) and category radar chart. Category totals and transaction counts.

- **Calendar** — Monthly transaction grid. Click any day to see a detailed breakdown. Income and expense dots on each day.

- **Net Worth** — Track assets (cash, investments, property) and liabilities (loans, credit, other). Snapshot history with trend chart. KPIs for current net worth, total assets, total liabilities, and change.

- **Debt Manager** — Track debts with lender name, total amount, APR, and minimum payment. Compact card design with left-border risk coloring (green <5%, amber 5–10%, red >10%). Progress bar, donut composition chart, avalanche-method payoff recommendation. Record payments against debts.

- **Subscriptions** — Track recurring subscriptions with name, category, cost, billing cycle, and billing day. Days-until-billing display. Monthly/yearly totals.

- **Investments** — Portfolio tracker with ticker, shares, cost basis, and current price. P&L per position (colored green/red). Donut allocation chart. Simulated price refresh button.

- **Admin Panel** — Secret key-protected view (default key: `mawa123`) showing all registered users and their declared income sources. Key can be changed via console: `localStorage.setItem('budgetPro_adminKey', 'newkey')`.

- **Dark / Light Mode** — Toggle via the 🌙/☀️ button in the sidebar footer. Preference saved to `localStorage`.

- **Additional Tools** — Data Backup & Restore (JSON download/upload). Undo Delete for transactions. Recurring transactions with auto-generation on month change.

## Currency

BDT (৳) – Bangladeshi Taka

## Technology

- Pure HTML, CSS, and JavaScript (no frameworks).
- [Chart.js](https://www.chartjs.org/) 4.4.1 (loaded from CDN) for all charts.
- `localStorage` for data persistence.
- `sessionStorage` for session management.
- No backend server required — fully offline-first.

## Theme

- Color: Sage green (#96AA9A) accent on dark background (light mode also available).
- Font: Times New Roman.
- Responsive at 900px and 540px breakpoints.

## Data Structure

Stored in `localStorage` under key `budgetPro_{username}`:

```json
{
  "transactions": [{ "id": 1, "date": "2026-06-01", "type": "income", "category": "Salary", "amount": 5000, "description": "Monthly salary" }],
  "budgets": { "Food": 500, "Transport": 200 },
  "recurring": [{ "id": 1, "description": "Netflix", "amount": 15, "type": "expense", "category": "Entertainment", "day": 15 }],
  "goals": [{ "id": 1, "name": "Emergency Fund", "target": 10000, "saved": 2500, "deadline": "2026-12-31", "icon": "🚨" }],
  "customCategories": ["Healthcare", "Education"],
  "netWorth": [{ "date": "2026-06-01", "cash": 5000, "investments": 10000, "property": 300000, "loans": 200000, "credit": 5000, "other": 0, "netWorth": 110000, "assets": 315000, "liabilities": 205000 }],
  "debts": [{ "id": 1, "name": "Credit Card", "total": 5000, "paid": 1500, "interest": 18.5, "minPayment": 150 }],
  "subscriptions": [{ "id": 1, "name": "Spotify", "cost": 10, "category": "Entertainment", "cycle": "monthly", "billingDay": 10 }],
  "investments": [{ "id": 1, "ticker": "AAPL", "shares": 10, "costBasis": 150, "currentPrice": 175 }],
  "incomeSources": [{ "id": 1, "name": "Day Job", "type": "Salary/Wages", "frequency": "monthly", "amount": 5000, "description": "Software engineer at XYZ Corp", "txId": 12345 }]
}
```
