# Stash — MVP Development Plan (revised)

**Codebase check (2026-09-18):** the repo has no app implementation yet — only `.cursor/rules` (`general`, `workflow`, `security`, `testing`, `avoid-ai-mistakes`) and the original plan. Stack, schema, and phases below are still greenfield. Nothing in Phases 1–10 is already done.

---

## 1. Product Overview

Personal finance iOS app: current position, spending, recurring expenses, savings goals.

MVP principles: fast expense entry; clear available money; multiple accounts; RSD + EUR; AI category assist; recurring expenses; savings goals; limited insights; correct, consistent money math; premium, minimal iOS UX.

Stay focused. No extra features, microservices, or speculative infra.

---

## 2. Technology Stack

**Mobile (iOS-first):** React Native, Expo, TypeScript, Expo Router, TanStack Query for server state. Reanimated / Gesture Handler only where useful. Lightweight local state only where needed. Follow iOS conventions, not generic cross-platform UI.

**Backend (modular monolith):** NestJS, TypeScript, PostgreSQL, Prisma, REST, JWT. Docker for local dev. Priority: correctness, consistency, simplicity, then performance/maintainability. No microservices.

**Local infra:** Docker Compose → PostgreSQL + backend. Mobile talks REST. Keep infra minimal.

---

## 3. Design Direction

Premium, minimal, conventional financial-app look (light mode). Monochrome: white / black / gray. No gradients, glassmorphism, neon, glow, excessive shadows/rounding, or decorative illustrations.

Structure with type, spacing, hierarchy, borders, subtle elevation. Subtle, purposeful animation only. Standard iOS patterns.

---

## 4. Application Structure

Primary areas: Home, Activity, Insights, Goals.

Secondary (not primary tabs): Accounts, Recurring expenses, Profile / Settings. Avoid extra nav items.

Always easy: add a transaction, recent transactions, balances, spending, savings progress.

---

## 5. Authentication

**Email:** register (email + password) → verification email → verify → login / logout / password reset. Unverified accounts are not fully active. Hash passwords; never store plaintext.

**Sign in with Apple:** map Apple identity to the internal user. Same email must not create a second account (careful linking).

---

## 6. User Model

User owns: Accounts, Transactions, Recurring Expenses, Categories, Savings Goals.

**Flag:** original tree also listed `Budgets`. There is no budgets domain, API, table, or MVP feature elsewhere. Treat budgets as **out of scope**, not as a model to implement.

Every user-owned query must enforce ownership on the backend. Do not rely on the client.

---

## 7. Supported Currencies

MVP: **RSD** and **EUR** only. One currency per account. User has a primary currency.

Never add RSD and EUR as raw numbers. Conversion is later; for MVP, show balances separately when currencies differ.

---

## 8. Accounts

User-created accounts (e.g. Raiffeisen, EUR Account, Cash, Savings).

Fields: `id`, `userId`, `name`, `currency`, `initialBalance`, `currentBalance`, `createdAt`, `updatedAt`.

Balance must be derived from history or updated in the same DB transaction as related records. Correctness over premature optimization.

Ops: create, rename, change details where safe, view balance, list transactions. Delete only if no dependent transactions — never silently wipe history. Validate and confirm.

---

## 9. Transaction Domain

Types: `EXPENSE` | `INCOME` | `TRANSFER`. Transfers are not spending.

Example: Raiffeisen → Cash, 20,000 RSD → source −20,000, dest +20,000; total unchanged.

Minimum fields: `id`, `userId`, `type`, `amount`, `currency`, `description`, `categoryId`, `accountId`, `transactionDate`, `createdAt`, `updatedAt`. Transfers also need destination account.

---

## 10. Expense Creation

Two flows. User can always review/edit before save.

**Natural language (fast path):** e.g. `1200 taxi do grada` → amount 1200 RSD, description, category Taxi. `3400 dinner with friends` → amount 3400, Eating Out.

**Form:** amount, description, category, account, date.

---

## 11. AI Expense Classification

MVP AI use: classify expenses only. AI must not write financial records.

Flow: description → AI → `{ "category": "TAXI", "confidence": 0.96 }` → user confirms → create transaction. Low confidence → user picks category.

If AI is down: show the normal form → user picks category → save. AI is never a SPOF for creating expenses.

---

## 12. Categories

Predefined, small set: Food, Groceries, Eating Out, Taxi, Transportation, Fuel, Travel, Entertainment, Shopping, Bills, Rent, Loan, Subscriptions, Health, Other.

User can override auto-category. Keep the model extensible; do not add dozens of categories now.

---

## 13. Recurring Expenses

Named obligations (rent, internet, phone, loan, Netflix, insurance).

Fields: `name`, `amount`, `currency`, `category`, `account`, `frequency`, `nextOccurrence`, `active`.

MVP: **monthly** only. Use upcoming recurrences in expected spending. Generation (if any) must be **idempotent** — no silent duplicates.

---

## 14. Income

Manual income only (salary, bonus, freelance, refund, other). Updates balances and monthly calcs. **No bank sync.**

---

## 15. Savings Goals

Primary use: monthly target (e.g. September, €500). Show target, progress, remaining.

Also consider current spending, expected income, recurring expenses, remaining days in the period — whether the pace can hit the target.

---

## 16. Spending Guidance

Backend, deterministic (not AI):

`(available money + expected income − expected recurring − savings target − committed amounts) = flexible spending`

`flexible spending ÷ remaining days ≈ daily allowance`

Present as guidance, not a guarantee.

---

## 17. Insights

Limited analytics. Each viz must answer a real question; do not overload charts.

- Spending by category (period): absolute and share where useful
- Current month vs previous month (major categories)
- Top individual expenses
- Simple spending-over-time

---

## 18. Financial Status

Show current balances, income, expenses, recurring, savings progress, remaining flexible spend — concise, not an analytics dashboard. Closer to a banking app than a BI tool.

---

## 19. Data Consistency

Create expense / income / transfer must update related balances **atomically** (PostgreSQL transactions). Never update a transaction and account balance independently if that can diverge.

---

## 20. API Design

REST. Suggested routes:

`/api/auth` `/api/users` `/api/accounts` `/api/transactions` `/api/categories` `/api/recurring-expenses` `/api/savings-goals` `/api/insights` `/api/ai`

DTOs at the boundary (no raw Prisma). Validate all input. Consistent errors.

---

## 21. Backend Architecture

```text
src/{auth,users,accounts,transactions,categories,recurring-expenses,savings-goals,insights,ai,common,database}/
```

Per domain: controller, service, dto, validation. Logic in services, not controllers. No unused abstractions.

---

## 22. Database

PostgreSQL tables: `users`, `accounts`, `transactions`, `categories`, `recurring_expenses`, `savings_goals`, plus auth tables as needed.

Constraints: transaction type, currency, positive amounts, ownership, valid account refs.

Index `userId`, `accountId`, `transactionDate`, `categoryId`. Do not index everything.

---

## 23. Money Representation

No floats. PostgreSQL `DECIMAL`/`NUMERIC`; preserve precision on the API. Explicit rounding. Deterministic calcs, covered by tests.

---

## 24. Security

Password hashing; JWT; secure tokens; email verification; authz on every user-owned resource; input validation; no IDOR; AI credentials only on the server; secrets in env, never committed; CORS as needed.

Never trust client-supplied user IDs — use the auth context.

---

## 25. Testing Strategy

**Backend unit:** expense/income/transfer, balances, savings, recurring, currency, authz, AI fallback, date edges.

**Integration:** create transaction → balance changes; transfer → source down, dest up, total unchanged.

**Mobile:** critical flows only — login, create account, create/edit expense, income, transfer, savings goal, view insights.

Align with existing testing rule: behavior over implementation, deterministic, don’t weaken tests to pass.

---

## 26. UX Principles

Fast: a typical expense in few interactions. Avoid extra confirms, forms, modals, nav, decoration.

Empty / loading / error states. Optimistic UI only when it cannot break financial correctness. Prefer correctness over perceived speed.

---

## 27. Accessibility

Dynamic type where practical; contrast; icon labels; usable touch targets; don’t rely on color alone for financial status.

---

## 28. MVP Scope

In: email auth (register, verify, login, reset) + Sign in with Apple; RSD/EUR accounts, initial balances, management, tracking; expenses/income/transfers, NL + form entry, categories, edit/delete; AI classify + confidence + confirm + fallback; monthly recurrences (bills, subs, loans) and upcoming; monthly savings + progress + spending guidance; insights (category, month compare, top expenses, basic trends); iOS / RN+Expo+TS / NestJS / PostgreSQL / Docker.

This is a checklist of §§5–17, not extra work.

---

## 29. Explicitly Out of Scope for MVP

Bank/card sync, auto-import, receipts/OCR, investments/crypto, debt amortization, advanced forecast, auto FX / multi-currency conversion, push unless a core flow needs it, social/shared households, web, Android-specific work, microservices, event-driven architecture, AI financial advisor.

---

## 30. Development Phases

Incremental. **All phases are still ahead** (empty repo).

1. **Foundation:** RN+Expo+TS+Expo Router; NestJS; PostgreSQL; Prisma; Compose; env; basic CI; ESLint; Prettier. Structure first.
2. **Design system:** type, spacing, weights, radius, borders, elevation, icons; buttons, inputs, lists, sheets; empty/loading/error. Monochrome light. Reuse components.
3. **Auth:** register, verify email, login, logout, reset, session, Apple. Protect routes.
4. **Accounts:** CRUD list/details, initial balance, RSD/EUR. Seed development categories.
5. **Transactions:** expense, income, transfer, history, details, edit, delete, balance updates. All money mutations in DB transactions. Financial core **before** AI.
6. **AI classify:** description → AI → category+confidence → confirm → save. Isolate behind a service; app must not depend on a specific provider.
7. **Recurring:** create/edit/delete-or-deactivate; monthly; upcoming; idempotent generation if auto-generation is built.
8. **Savings:** monthly goal CRUD; progress, remaining, spending allowance — backend calcs.
9. **Insights:** category spend, month vs prior, top expenses, basic trends. Simple viz.
10. **Polish:** consistency, nav, states, a11y, performance, keyboard, safe areas, animation, API/auth/calc edges. Remove leftover complexity.

---

## 31. Cursor Development Rules

Workspace `.cursor/rules` already cover reuse, small changes, secrets, validation, authz, and tests. During implementation also:

1. Stay inside this MVP unless asked otherwise.
2. Don’t change architecture without explaining why the current one is insufficient.
3. Simple over abstract; no abstractions for hypothetical futures.
4. Deterministic finance on the backend — never an LLM. AI = expense classification only; AI down must not block manual entry.
5. No secrets/API keys on the mobile app.
6. Authz on all user-owned resources. Don’t duplicate business logic on the client; backend is source of truth.
7. No floating-point money.
8. Inspect and reuse before adding files/components. Small focused components. Comments only for non-obvious constraints. No drive-by refactors.

---

## 32. Definition of Done

A new user can: register → verify email → create RSD/EUR accounts with balances → record income → record expenses (NL + confirm AI category) → transfers → recurring expenses → monthly savings target → track spend and savings progress → review insights.

Quality bar: **can a user trust Stash for everyday tracking?** Feature count is secondary.
