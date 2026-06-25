PENNY-WISE – Personal Finance Manager
======================================
A fully client-side personal finance dashboard with multi-user support,
income management, budgeting, goal tracking, and financial reporting.

QUICK START
-----------
1. Open index.html in any modern browser.
2. Create an account (username + password).
3. Start adding transactions, declaring income, setting budgets, and more.
4. All data is saved locally in your browser (localStorage).

FILE STRUCTURE
--------------
index.html    – HTML structure for all 11 sections + auth overlay
style.css     – Sage green (#96AA9A) dark theme, responsive breakpoints
app.js        – All application logic (auth, CRUD, charts, recurring, etc.)

FEATURES
--------
- Multi-User Authentication
  Register, login, logout. Each user's data is stored separately under
  the key "budgetPro_{username}". Sessions persist per tab via sessionStorage.

- Dashboard
  KPI cards (total income, expenses, net balance, budget remaining).
  Three interactive charts: Income vs Expense Trend (line), Expense by
  Category (donut), Monthly Comparison (bar).
  Spending Insights panel with month-over-month comparison.
  Statistics Summary (count, averages, projections, savings rate).

- Transactions
  Add income/expense transactions with category, date, and description.
  Full CRUD: add, edit (modal), delete (with undo toast).
  Search/filter by description, category, or type.
  CSV Export of all transaction data.

- Income Sources
  Declare income sources with name, type (Salary, Freelance, Business,
  Investment, Rental, Passive, Other), frequency (monthly/yearly/one-time),
  amount, and earnings description.
  Auto-generates income transactions linked to each source so dashboard
  KPIs and charts reflect declared income automatically.
  Sources update their linked transaction when edited; deleted sources
  remove their transaction. New transactions are created each month for
  recurring sources.

- Budgets
  Set monthly spending limits per category. Track progress with visual
  progress bars and warning/over-budget indicators.
  Category Manager: add/remove custom categories.

- Goals
  Define savings targets with a deadline, icon, and tracked amount.
  Visual progress bars with percentage complete and days remaining.

- Reports
  Weekly spending trend (bar chart) and category radar chart.
  Category totals and transaction counts.

- Calendar
  Monthly transaction grid. Click any day to see a detailed breakdown.
  Income and expense dots on each day.

- Net Worth
  Track assets (cash, investments, property) and liabilities (loans,
  credit, other). Snapshot history with trend chart.
  KPIs for current net worth, total assets, total liabilities, and change.

- Debt Manager
  Track debts with lender name, total amount, APR, and minimum payment.
  Compact card design with left-border risk coloring (green <5%, amber
  5-10%, red >10%).
  Progress bar, donut composition chart, avalanche-method payoff
  recommendation.
  Record payments against debts.

- Subscriptions
  Track recurring subscriptions with name, category, cost, billing cycle,
  and billing day. Days-until-billing display. Monthly/yearly totals.

- Investments
  Portfolio tracker with ticker, shares, cost basis, and current price.
  P&L per position (colored green/red). Donut allocation chart.
  Simulated price refresh button.

- Admin Panel
  Secret key-protected view (default key: mawa123) showing all registered
  users and their declared income sources. Key can be changed via console:
  localStorage.setItem('budgetPro_adminKey', 'newkey').

- Additional Tools
  Data Backup & Restore (JSON download/upload).
  Undo Delete for transactions.
  Recurring transactions with auto-generation on month change.

CURRENCY
--------
BDT (৳) – Bangladeshi Taka

TECHNOLOGY
----------
- Pure HTML, CSS, and JavaScript (no frameworks).
- Chart.js 4.4.1 (loaded from CDN) for all charts.
- localStorage for data persistence.
- sessionStorage for session management.
- No backend server required – fully offline-first.

THEME
-----
- Color: Sage green (#96AA9A) accent on dark background.
- Font: Times New Roman.
- Responsive at 900px and 540px breakpoints.

DATA STRUCTURE (localStorage key: budgetPro_{username})
-------------------------------------------------------
{
  transactions: [{ id, date, type, category, amount, description }],
  budgets: { "CategoryName": limit },
  recurring: [{ id, description, amount, type, category, day }],
  goals: [{ id, name, target, saved, deadline, icon }],
  customCategories: ["Cat1", "Cat2"],
  netWorth: [{ date, cash, investments, property, loans, credit, other,
               netWorth, assets, liabilities }],
  debts: [{ id, name, total, paid, interest, minPayment }],
  subscriptions: [{ id, name, cost, category, cycle, billingDay }],
  investments: [{ id, ticker, shares, costBasis, currentPrice }],
  incomeSources: [{ id, name, type, frequency, amount, description, txId }]
}
