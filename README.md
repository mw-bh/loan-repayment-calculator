# Loan Repayment Calculator — Take-Home Task

Thanks for taking the time to work through this. The task is designed to take around
**one hour** — we're not looking for a production-ready application, and we care far more
about **code quality and decision-making than completeness**. If you run out of time,
leave a note explaining what you'd have done next and why.

This starter uses **React + TypeScript + Vite + Tailwind CSS**, with **Vitest** for tests.
You're welcome to restructure it however you like.

## Getting started

```bash
npm install
npm run dev      # start the dev server
npm test         # run tests in watch mode
npm run test:run # run tests once
npm run build    # type-check and production build
```

Then open the printed local URL and start editing `src/App.tsx`.

---

## The Task

Build a loan repayment calculator with three parts: a calculation form, an amortisation
schedule, and a live currency toggle.

### Part 1 — Calculator Inputs

Build a form with three fields:

| Field | Type | Constraints |
|---|---|---|
| Loan amount | Number (GBP) | Required, positive |
| Annual interest rate | Percentage | Required, 0–100 |
| Loan term | Years | Required, integer, 1–30 |

On submission (or on change — your choice), compute and display:

- **Monthly repayment**
- **Total amount repaid**
- **Total interest paid**

**The formula:**

```
Monthly rate  r = annual rate / 100 / 12
Payments      n = term × 12
Monthly payment M = P × [r(1+r)ⁿ] / [(1+r)ⁿ - 1]
```

Where `P` is the loan principal. This is the standard annuity formula — each payment
covers the interest accrued on the remaining balance, with the rest reducing the principal.

**Special case:** if the interest rate is 0, use `M = P / n` to avoid dividing by zero.

### Part 2 — Amortisation Schedule

Below the summary figures, render a table showing how the loan is paid off month by month.
Each row should show:

| Column | Description |
|---|---|
| Month | Payment number (1, 2, 3 …) |
| Opening balance | Balance at the start of the month |
| Monthly payment | Fixed payment amount |
| Interest | Interest portion of this payment |
| Principal | Principal portion of this payment |
| Closing balance | Balance after this payment |

All amounts should be formatted as GBP using `Intl.NumberFormat` with `style: 'currency'`
and `currency: 'GBP'`.

### Part 3 — Currency Toggle

Fetch live exchange rates from the [Frankfurter API](https://api.frankfurter.dev) to let
users view all amounts in a different currency. No API key is required.

**Endpoint:** `GET https://api.frankfurter.dev/v1/latest?from=GBP`

**Example response:**
```json
{
  "amount": 1,
  "base": "GBP",
  "date": "2025-07-18",
  "rates": { "USD": 1.2734, "EUR": 1.1821, "JPY": 195.43, "CHF": 1.1102 }
}
```

Add a currency dropdown showing at minimum: **GBP** (default), **USD**, **EUR**, **JPY**, **CHF**.

When a non-GBP currency is selected, all computed amounts — the summary figures and every
cell in the schedule — should be converted and reformatted using `Intl.NumberFormat` with
the correct currency code.

---

## Validation Rules

- **Loan amount:** required, must be a positive number
- **Interest rate:** required, must be between 0 and 100
- **Term:** required, must be a whole number between 1 and 30

## What to Focus On

- **Business logic correctness** — does the formula produce the right numbers? Does the schedule balance to zero?
- **Form handling and validation** — controlled inputs, clear error messages, sensible UX choices
- **Table rendering** — a 30-year term produces 360 rows; worth thinking about
- **Currency formatting** — `Intl.NumberFormat` handles JPY zero decimals, GBP pence, etc. correctly
- **Error and loading states** — what happens if the Frankfurter API is down? GBP calculations should still work
- **At least one test** — pick something meaningful and explain why you chose it

## Submitting

A GitHub repo (public or shared with us) is ideal. A short README covering your approach
and any tradeoffs is very welcome — it often starts the best conversations.

*We'll use this as a starting point for a conversation, not a checklist.*
