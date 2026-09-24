# BudgetLens — Cash Flow in Focus
## Comprehensive Product Documentation, Technical Specification, Legal Disclosures & User Manual

*Document Version: 2.4.0 • Release Date: September 2026 • Status: Production Reference*

---

## Executive Summary & Product Vision

**BudgetLens** (formerly *BudgetLens Finance*) is an offline-first, client-side personal financial intelligence system and runway forecasting dashboard. Developed to address the growing invasion of user privacy and subscription fatigue in modern fintech, BudgetLens eliminates third-party servers, cloud databases, and tracking scripts entirely. 

Unlike traditional banking aggregation tools that require Open Banking access tokens or bank login credentials, BudgetLens operates on a **zero-trust, zero-custody architecture**:
1. **100% Local Processing:** Every statement parse, algorithmic calculation, chart render, and storage write occurs within the user's browser sandbox on their local hardware.
2. **Predictive Cash Runway Modeling:** Rather than merely cataloging historical spend, BudgetLens focuses on forward-looking cash survival—calculating how long cash reserves will last under static, frugal, and stress-tested scenarios.
3. **Omni-Format Financial Ingestion:** Native, offline ingestion of CSV spreadsheets, PDF e-statements (via client-side WebAssembly/Web Workers), Markdown expense tables, and unformatted freeform natural-language notes.
4. **Autonomous Intelligent Features:** Dynamic merchant normalization, 3-tier recurring cadence detection, debt amortization tracking with automatic transaction-to-loan linking, and multi-currency parsing across 12 global currencies.

---

## 1. Technical Architecture & System Design

```
+----------------------------------------------------------------------------------------------------+
|                                          BROWSER ENGINE (Client-Side Only)                         |
+----------------------------------------------------------------------------------------------------+
|                                                                                                    |
|   +--------------------------------------------------------------------------------------------+   |
|   |                                    PRESENTATION LAYER (React 19)                           |   |
|   |  - Header & Global Controls (Reset, Tour, Currency Selector)                               |   |
|   |  - Hero Section (Balance, Total Inflow, Total Outflow, Net Worth)                           |   |
|   |  - CashflowChart (Recharts Stacked Bar Matrix: 1M / 3M / 1Y / ALL)                         |   |
|   |  - ExpenditureDonut & Category Legend (Dynamic Slice Breakdown)                            |   |
|   |  - TransactionLedger (Search, Tag Filter, Smart Recurring Hub, Receipt Inspection)          |   |
|   |  - DebtHubSection & LoanCard (Burndown Charts, Amortization Schedules)                     |   |
|   |  - PredictiveRunwayWidget (Frugal / Baseline / High-Outflow Simulation)                     |   |
|   |  - QuickEntryBar & QuickAddOutflows (1-Click Fast Entry)                                   |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                  |                                                 |
|   +----------------------------------------------v---------------------------------------------+   |
|   |                                    APPLICATION STATE LAYER                                 |   |
|   |  - CurrencyContext (ISO-4217 Formatter, Prefix Management, Auto-Detection)                 |   |
|   |  - State Hooks: Transactions[], Loans[], InitialBalance, CategoryConfigs                   |   |
|   +--------------------------------------------------------------------------------------------+   |
|                          |                                               |                         |
|   +----------------------v-----------------------+   +-------------------v---------------------+   |
|   |         INGESTION & PARSING ENGINE           |   |      FINANCIAL CALCULATION ENGINE       |   |
|   |  - csvParser: Header Mapper & Sign Heuristics|   |  - calculateFinanceSummary()            |   |
|   |  - pdfParser: PDF.js Client-Side Worker      |   |  - generateChartBuckets()               |   |
|   |  - mdParser: Pipe & Math Evaluator           |   |  - detectRecurringTransactions()        |   |
|   |  - freeformParser: Regex Tokenizer           |   |  - Amortization & Burndown Math         |   |
|   +----------------------------------------------+   +-----------------------------------------+   |
|                          |                                               |                         |
|   +----------------------------------------------v---------------------------------------------+   |
|   |                                     STORAGE ABSTRACTION LAYER                              |   |
|   |  - IndexedDB Store ("BudgetLensStorage"): "appData" (Txs, Loans, Balances, Configs)        |   |
|   |  - Web Crypto API: SHA-256 PIN Lock ("BudgetLens_pin_hash")                                   |   |
|   |  - File System Access API ("fileHandles"): Direct Auto-Sync to Local Disk File (.md / .csv)|   |
|   |  - Safety Archival Subsystem: Export-before-wipe on workspace reset                        |   |
|   +--------------------------------------------------------------------------------------------+   |
|                                                                                                    |
+----------------------------------------------------------------------------------------------------+
```

### 1.1 Technology Stack

| Layer | Component | Implementation Detail |
| :--- | :--- | :--- |
| **Runtime / UI** | React 19 (`react`, `react-dom`) | Functional components, custom hooks, concurrent rendering |
| **Language** | TypeScript 5.8 | Strict typing across financial domains, zero implicit `any` |
| **Build System** | Vite 6.2 | Fast HMR, tree-shaking, local ESM asset bundling |
| **Visualization** | Recharts 3.10 | SVG responsive stacked bar charts, donut matrices, area burndown |
| **Tabular Parsing** | PapaParse 5.4 | Streaming RFC 4180 CSV parsing with header auto-discovery |
| **PDF Extraction** | PDF.js 6.3 (`pdfjs-dist`) | Embedded offline Web Worker (`pdf.worker.min.mjs`) with zero network fetch |
| **Local Persistence** | IndexedDB API | High-capacity structured binary storage, versioned schema |
| **Desktop / PWA** | Web App Manifest & Service Worker | Installable desktop application on Chromium, Edge, macOS, and iOS Safari |
| **Styling** | Modern CSS Variables & Design Tokens | Glassmorphism, tailored HSL color palettes, responsive CSS grid |

### 1.2 Data Sovereignty & Offline-First Guarantees
BudgetLens does not establish any network connection to remote endpoints during execution:
- No telemetry, tracker, or pixel beacons are embedded.
- PDF extraction runs locally inside an in-memory blob worker.
- Fonts and icons (`Material Symbols Outlined`) are loaded with offline fallbacks.
- Web browser sandboxing enforces that financial records cannot escape the client filesystem without explicit user initiation (Export CSV/MD or File System Access API grant).

---

## 2. Data Models, Type System & Storage Engine

The type system is declared in `src/types/finance.ts`. All financial amounts are normalized to positive floating-point numbers, with operational polarity governed by the `type` discriminant.

### 2.1 Core Types (`src/types/finance.ts`)

```typescript
export type TransactionType = 'income' | 'expense' | 'savings';
export type CategoryKey = string;

export interface CategoryConfig {
  key: CategoryKey;
  label: string;
  color: string;
  icon: string;
  type: TransactionType;
  keywords: string[];
  tags?: string[];
}

export interface Transaction {
  id: string;                       // Unique internal key: "tx-{timestamp}" or "csv-{timestamp}-{index}"
  date: string;                     // ISO-8601 Date: "YYYY-MM-DD"
  title: string;                    // Normalized merchant or transaction narrative
  description?: string;             // Raw bank narration
  amount: number;                   // Absolute positive number (e.g., 42.50)
  type: TransactionType;            // 'income' | 'expense' | 'savings'
  category: CategoryKey;            // Key referencing CategoryConfig
  isRecurring?: boolean;            // Flagged by algorithmic recurring detector
  note?: string;                    // User memo or ingestion source annotation
  source?: string;                  // Ingestion origin (e.g., "DBS Statement.pdf", "Quick Entry")
  tags?: string[];                  // Arbitrary categorization tags (e.g., ["#tax", "#edu-loan"])
  loanAllocations?: Record<string, number>; // Maps Loan.id -> dedicated payment portion
}

export interface Loan {
  id: string;                       // Unique ID
  name: string;                     // e.g. "DBS Study Loan"
  initialPrincipal: number;         // Opening balance (e.g., 25000)
  interestRate: number;             // Annual APR percentage (e.g., 4.75)
  startDate: string;                // "YYYY-MM-DD"
  termMonths: number;               // Total repayment tenure (e.g., 60)
  linkedTag: string;                // Tag string matching transaction tags (e.g., "study-loan")
  fixedMonthlyPayment?: number;     // Contractual monthly installment (optional)
}

export interface FinanceSummary {
  initialBalance: number;
  totalIncome: number;
  totalExpenses: number;
  totalSavings: number;
  totalBalance: number;
  overallMonthlyBurn: number;
  overallRunwayMonths: number;
  safeWeeklySpend: number;
  categoryRunways: CategoryRunway[];
  hasMinimumDataForRunway: boolean;
  daysRecorded: number;
}
```

### 2.2 Storage Engine & Schema

BudgetLens utilizes an IndexedDB database named `BudgetLensStorage` (Database Version: 2):

| Object Store | Key | Value Content | Purpose |
| :--- | :--- | :--- | :--- |
| `appData` | `budgetlens_transactions` | `Transaction[]` | Master financial ledger |
| `appData` | `budgetlens_loans` | `Loan[]` | Active liability accounts & loan profiles |
| `appData` | `budgetlens_initial_balance`| `number` | Opening bank balance benchmark |
| `appData` | `budgetlens_category_configs`| `Record<string, CategoryConfig>`| Dynamic category taxonomy & custom colors |
| `fileHandles` | `rawFileHandle` | `FileSystemFileHandle` | OS file handle for real-time background disk mirror |
| `localStorage`| `budgetlens_welcome_done` | `'true'` / `'false'` | First-run onboarding dismissal flag |
| `localStorage`| `budgetlens_currency` | Currency Code (e.g., `'SGD'`) | Active currency standard |
| `localStorage`| `BudgetLens_pin_hash` | SHA-256 Hex Digest | 4-digit PIN authentication security hash |

#### Automated Schema Migration & Self-Healing:
Upon application boot (`App.tsx`), BudgetLens performs auto-migration:
1. **Legacy Key Migration:** Inspects previous `BudgetLens_*` keys in IndexedDB. If found, transparently migrates data into standard `budgetlens_*` stores.
2. **Category Healing:** Checks if existing transactions were erroneously tagged with fallback "General". Re-evaluates merchant names using `detectCategoryFromTitle()` to categorize them.
3. **Retroactive Recurring Detection:** Automatically executes `upgradeExistingTransactionsWithRecurring()` across existing records to backfill recurring flags.

---

## 3. Mathematical & Algorithmic Formulations

### 3.1 Cash Runway & Burn Rate (`src/utils/financeCalculator.ts`)

#### Total Net Balance:
$$\text{Total Balance} = \text{Initial Balance} + \sum \text{Income} - \sum \text{Expenses}$$
*Note: Transactions marked as `'savings'` are retained within the net cash balance; they represent cash allocation into reserves rather than cash depletion.*

#### Date Horizon & Normalization:
$$\Delta_{\text{days}} = \max(\text{Dates}) - \min(\text{Dates}) + 1$$
$$\text{Months Span} = \max\left(1, \frac{\Delta_{\text{days}}}{30.4167}\right)$$
The system enforces a **30-Day Minimum Baseline Threshold** (`hasMinimumDataForRunway = \Delta_{\text{days}} \ge 30`). If fewer than 30 days are logged, runway estimates are marked with a cautionary tag.

#### Category & Overall Monthly Burn:
$$\text{Monthly Burn}_{\text{cat}} = \frac{\sum \text{Expense}_{\text{cat}}}{\text{Months Span}}$$
$$\text{Overall Monthly Burn} = \sum_{\text{cat} \in \text{Expenses}} \text{Monthly Burn}_{\text{cat}}$$

#### Runway Longevity (in Months):
$$\text{Runway (Months)} = \begin{cases} \frac{\text{Total Balance}}{\text{Overall Monthly Burn}} & \text{if } \text{Total Balance} > 0 \text{ and } \text{Burn} > 0 \\ 999 & \text{if } \text{Total Balance} > 0 \text{ and } \text{Burn} = 0 \\ 0 & \text{if } \text{Total Balance} \le 0 \end{cases}$$

#### Safe Weekly Spending Allowance:
$$\text{Safe Weekly Spend} = \begin{cases} \text{round}\left(\frac{\text{Overall Monthly Burn}}{4.333}\right) & \text{if } \text{Monthly Burn} > 0 \\ \text{round}(\text{Total Balance} \times 0.05) & \text{otherwise} \end{cases}$$

---

### 3.2 Predictive Runway Simulation (What-If Scenarios)

The **Predictive Runway Widget** allows dynamic sensitivity testing using an interactive tri-state model:

```
[ Frugal Pace (-15%) ] <------- [ Current Baseline (100%) ] -------> [ High Outflow (+25%) ]
     Multiplier: 0.85                   Multiplier: 1.00                     Multiplier: 1.25
```

$$\text{Burn}_{\text{simulated}} = \text{round}(\text{Overall Monthly Burn} \times \text{Multiplier})$$
$$\text{Runway}_{\text{simulated}} = \frac{\text{Total Balance}}{\text{Burn}_{\text{simulated}}}$$
$$\Delta_{\text{runway}} = \text{Runway}_{\text{simulated}} - \text{Runway}_{\text{baseline}}$$

- **Frugal Pace (0.85x):** Simulates a 15% reduction in discretionary expenses (dining out, entertainment, shopping).
- **High Outflow (1.25x):** Simulates a 25% inflation shock, unexpected medical emergency, or unplanned vehicle repairs.

---

### 3.3 Debt Amortization & Proportional Payment Engine (`LoanCard.tsx`)

When tracking loans (mortgages, personal loans, vehicle loans, education debt), BudgetLens uses standard banking formulas to split payments into **interest** and **principal reduction**.

#### Standard Monthly Amortization Formula:
Given principal $P$, annual rate $r$, monthly rate $i = \frac{r}{12}$, and term in months $n$:
$$M = \frac{P \times i \times (1 + i)^n}{(1 + i)^n - 1}$$

#### Transaction-to-Loan Payment Attribution:
1. **Explicit Allocation (Highest Priority):** If a transaction contains `tx.loanAllocations[loan.id]`, that exact dollar value is assigned to the loan.
2. **Tag-Based Proportional Sharing (Fallback):** If multiple loans share the same `#tag`, payments are apportioned according to their contractual monthly installments:
$$\text{Share Ratio}_k = \frac{M_k}{\sum_{j} M_j}$$
$$\text{Payment Allocated}_k = \text{Tx Amount} \times \text{Share Ratio}_k$$

#### Realized Interest vs. Principal Burndown:
$$\text{Monthly Interest} = \text{Current Principal} \times \frac{\text{APR}}{12}$$
$$\text{Principal Reduction} = \max(0, \text{Payment Allocated} - \text{Monthly Interest})$$
$$\text{Remaining Balance} = \max(0, \text{Principal} - \sum \text{Principal Reductions})$$
$$\text{Months to Debt-Free} = \left\lceil \frac{\text{Remaining Balance}}{M} \right\rceil$$

---

### 3.4 Smart Recurring Cadence Detection Engine (`recurringDetector.ts`)

Transactions are analyzed by a multi-stage heuristics engine to detect repeating bills, subscriptions, and payroll without requiring manual tagging:

```
Raw Transaction
      |
      v
[ Title Normalization ] ---> Strips bank prefixes ("DBS-", "FAST-", "NETS"), entity suffixes ("PTE LTD"), ref numbers
      |
      v
[ Keyword Regex Match ] ---> Evaluates known subscriptions (Netflix, Spotify, SP Services, Singtel, Rent, GIRO...)
      | (If matched -> Flagged Recurring)
      v
[ Temporal Cadence ] ------> Groups transactions by normalized merchant (minimum 3 occurrences)
      |
      v
[ Delta & Amount Check ] --> 1. Amount variance <= 5% or <= $1.00
                             2. Day intervals:
                                - Monthly: 25–35 days, 55–65 days (bimonthly), 85–95 days (quarterly)
                                - Weekly: 6–8 days, 13–15 days (biweekly)
      | (If matched -> Flagged Recurring)
      v
Transaction Tagged: isRecurring = true
```

---

## 4. Multi-Format Ingestion Engine

BudgetLens features a unified dropzone (`CSVImportZone.tsx`) capable of parsing four distinct data formats offline:

### 4.1 Bank CSV Parsing Engine (`csvParser.ts`)
- **Intelligent Header Mapping:** Maps any column naming standard (`Date`, `Posting Date`, `Value Date`, `Debit`, `Credit`, `Amount`, `Narrative`, `Particulars`, `Category`, `Tags`).
- **Debit/Credit Sign Resolution:** Automatically detects split debit/credit columns, positive/negative single amount columns, and CR/DR indicators.
- **Batch Anomaly Inversion:** If more than 40% of known expense merchants (e.g., FairPrice, Grab, Starbucks) are ingested with positive inflow polarity, the parser recognizes that the bank exports debits as positive numbers and inverts the batch polarity.

### 4.2 Offline PDF Bank Statement Parser (`pdfParser.ts`)
- **Zero-Network Architecture:** Uses `pdfjs-dist` executed with an internal inline worker blob.
- **2D Spatial Text Assembly:** Extracts textual tokens using physical XY-coordinates ($x, y, w, h$) to rebuild table rows across multi-page PDF statements.
- **Transaction Line Reconstruction:** Joins multi-line merchant descriptions (e.g., foreign transaction fee line items) into unified records.

### 4.3 Markdown Expense Table Parser (`mdParser.ts`)
- Supports GitHub Flavored Markdown (GFM) pipe-delimited tables (`| Date | Title | Amount |`).
- Supports **Matrix Grid Formats**: Evaluates tables where dates are rows and categories are separate columns.
- **Embedded Math Evaluator:** Computes arithmetic expressions inside Markdown cells (e.g., `$12.50 + 4.20 + 8.00` is parsed to `$24.70`).

### 4.4 Natural Language Freeform Parser (`freeformParser.ts`)
Parses unformatted casual notes, trip logs, or scratchpad tallies:
```
June 12 2026 - 300 , transport
Dinner with friends $45.50 on 15/05/2026
17th march- 10000-5000=5000 (salary bonus)
Grab car to airport 26.50
```
- **Fuzzy Tokenizer:** Extracts dates across month-first, day-first, and ISO formats.
- **Equation Solver:** Resolves arithmetic sequences (e.g., `10000-5000=5000` assigns 5,000 as net amount).
- **Sentiment Inference:** Distinguishes deposits from expenses using natural keywords.

---

## 5. Comprehensive User Manual & Operations Guide

### 5.1 Dashboard Layout & Visual Anchor Map

```
+----------------------------------------------------------------------------------------------------+
| [BudgetLens Logo]   [Currency: SGD $ v]   [?] Tour   [Refresh] Reset Workspace   [Gear] Settings   |
+----------------------------------------------------------------------------------------------------+
| HERO SECTION                                                                                       |
|   +--------------------------+  +--------------------------+  +---------------------------------+  |
|   | NET CASH BALANCE         |  | TOTAL INFLOW (INCOME)    |  | TOTAL OUTFLOW (EXPENSES)        |  |
|   | S$ 24,850.00             |  | +S$ 8,400.00             |  | -S$ 3,150.00                    |  |
|   +--------------------------+  +--------------------------+  +---------------------------------+  |
|   [ + Import Statements (CSV/PDF/MD) ]                                                             |
+----------------------------------------------------------------------------------------------------+
| QUICK ENTRY BAR                                                                                    |
|   [ Title: "Coffee" ] [ Amount: 6.50 ] [ Category: Food v ] [ Type: Expense v ] [ + Add Record ]   |
+----------------------------------------------------------------------------------------------------+
| CASHFLOW TREND ANALYSIS CHART (Stacked Bar Matrix)                                                 |
|   Timeframes: [ 1M (Daily) ]  [ 3M (Weekly) ]  [ 1Y (Monthly) ]  [ ALL (Yearly) ]                  |
|   [ Bar chart displaying green inflows vs color-coded categorized outflow stacks ]                |
+----------------------------------------------------------------------------------------------------+
| TWO-COLUMN WORKSPACE GRID                                                                          |
| LEFT COLUMN (Col-Span-8):                           | RIGHT COLUMN (Col-Span-4):                   |
| 1. Outflow Composition Donut                        | 1. Quick Log Outflows                        |
|    - Visual slice breakdown by Category             |    - 1-Click buttons: Groceries, Coffee,     |
|    - Center metric: Total Monthly Burn              |      Transit, Dining, Utilities              |
| 2. Transaction Activity Ledger                      | 2. Debt & Liabilities Hub                    |
|    - Search & Filter: All / In / Out / Recurring    |    - Active Loan cards with burndown charts  |
|    - Tag pills (#tax, #vacation)                    |    - Debt-free projected payoff dates        |
|    - Pagination, Inline Edit, Receipt Modal         | 3. Predictive Runway Widget                  |
| 3. Runway & Longevity Matrix                        |    - Sensitivity slider (-15% / 100% / +25%)|
|    - Overall cash survival in months                |    - Safe weekly spending allowance          |
|    - Category-by-category burn & months left        |    - Vulnerability warning badges            |
+----------------------------------------------------------------------------------------------------+
```

---

### 5.2 Step-by-Step User Workflows

#### Workflow A: Initial Workspace Setup
1. Open BudgetLens in your browser.
2. Click **⚙️ Settings** in the top navigation bar.
3. Enter your current **Opening Cash Balance** (e.g., current total across bank accounts and cash in hand).
4. Select your primary currency (default is `SGD - Singapore Dollar`).
5. (Optional) Customize Category names, assign distinct colors, or add custom keywords.
6. Click **Save Changes**.

#### Workflow B: Batch Ingesting Bank Statements (CSV or PDF)
1. Click the **📥 Import Statements** button in the Hero Section or drag and drop your file into the import zone.
2. The verification modal appears showing:
   - File name and total detected records.
   - Identified income vs. expense totals.
   - Duplicate detection warnings against previously recorded transactions.
   - Smart recurring badges for detected subscriptions.
3. Review entries in the interactive table. Edit any title, category, or amount inline.
4. Click **Import Verified Transactions**.

#### Workflow C: Managing Debts & Loans
1. Scroll to the **Debt & Liabilities Hub** on the right side of the dashboard.
2. Click **+ Add Loan**.
3. Fill in loan parameters:
   - **Loan Name:** e.g., "DBS Education Loan"
   - **Principal Amount:** e.g., `30,000`
   - **Interest Rate (APR %):** e.g., `4.5`
   - **Start Date & Tenure:** e.g., `2025-01-01`, `60 months`
   - **Linked Tag:** e.g., `edu-loan`
4. When logging monthly loan repayments in the ledger or Quick Entry Bar, include the tag `#edu-loan`.
5. The Debt Hub will automatically amortize the payment, recalculate your remaining balance, and update the debt-free projected date.

#### Workflow D: Setting Up Optional PIN Protection
1. BudgetLens includes an optional 4-digit PIN security lock.
2. Open the PIN Lock screen.
3. Enter a 4-digit PIN. The hash is computed using `SHA-256` via Web Crypto API and saved to local storage.
4. Subsequent dashboard visits will require PIN verification before the workspace unlocks.

#### Workflow E: Safe Reset & Backup Archival
1. Click **🔄 Reset** in the top header.
2. BudgetLens enforces an **Export-Before-Reset** workflow:
   - Select **Export as CSV** or **Export as Markdown (.md)**.
   - The backup file downloads automatically to your browser's `Downloads/` directory.
   - The dashboard clears local session data and re-initializes cleanly to `$0.00`.

---

## 6. Concrete Real-World Persona Case Studies

### Case Study 1: The Tech Freelancer with Variable Inflow

* **Profile:** Sarah, independent UX consultant in Singapore. Irregular invoice payments ($3,000 to $9,000) every 4–8 weeks.
* **Challenge:** High anxiety regarding cash buffer; unsure how many months she can survive between contracts.
* **BudgetLens Application:**
  1. Sarah imports her DBS multi-currency CSV. The parser assigns incoming wire transfers to `Salary/Income` and living costs to respective categories.
  2. The **Runway Section** detects an overall monthly burn rate of `S$ 3,450`. With her current cash balance of `S$ 27,600`, her cash runway is calculated as:
     $$\text{Runway} = \frac{27,600}{3,450} = 8.0 \text{ months}$$
  3. Sarah uses the **Predictive Runway Widget** and selects **High Outflow (+25%)** to simulate an emergency tax bill or equipment replacement:
     $$\text{Simulated Burn} = 3,450 \times 1.25 = \text{S\$} 4,312.50$$
     $$\text{Simulated Runway} = \frac{27,600}{4,312.50} = 6.4 \text{ months}$$
  4. She gains clarity: even under heavy unexpected expenses, she has a 6.4-month safety window to secure new clients.

---

### Case Study 2: The Salaried Professional Managing an Education Loan

* **Profile:** Marcus, software engineer with an outstanding university study loan of S$ 24,000 at 4.2% APR.
* **Challenge:** Wants to know when he will be completely debt-free and how extra repayments reduce his interest.
* **BudgetLens Application:**
  1. Marcus creates a Loan record: Principal `24,000`, APR `4.2%`, Term `48 months`, Linked Tag `study-loan`.
  2. Every month, his auto-GIRO deduction of `S$ 544.15` is ingested. BudgetLens identifies `#study-loan`.
  3. The Loan Card calculates:
     $$\text{Monthly Interest} = 24,000 \times \frac{0.042}{12} = \text{S\$} 84.00$$
     $$\text{Principal Reduction} = 544.15 - 84.00 = \text{S\$} 460.15$$
  4. In December, Marcus receives a bonus and logs an extra manual payment of `S$ 2,500` tagged `#study-loan`.
  5. The Debt Hub recalculates instantly: his projected debt-free date advances by 6 months, visually confirmed on the burndown area chart.

---

### Case Study 3: The Group Vacation & Travel Budgeter

* **Profile:** Elena, coordinating a 10-day trip to Japan with friends.
* **Challenge:** Tracking shared taxi rides, group dinners, and bullet train tickets recorded informally in Apple Notes.
* **BudgetLens Application:**
  1. Elena pastes her informal notes into the **Freeform Import Tab**:
     ```
     2026-04-10 Tokyo Shinkansen tickets - 28000 transport
     2026-04-11 Shinjuku Omakase Dinner 32000 food
     2026-04-12 Shibuya shopping 14500 general
     ```
  2. The natural-language parser tokenizes the dates, amounts, and categories.
  3. Elena reviews the detected items in the verification table, attaches the tag `#japan-trip`, and confirms the import.
  4. In the Ledger, she filters by `#japan-trip` to immediately see the total expenditure tally for the trip.

---

## 7. Edge Cases, Resilience & Troubleshooting Guide

| Scenario / Edge Case | System Behavior & Mitigation |
| :--- | :--- |
| **Inverted Debit/Credit Columns in CSV** | The parser runs holistic batch sentiment detection. If over 40% of transactions with expense keywords are marked as income, the parser automatically inverts the sign across the batch. |
| **PDF Statements with Multi-line Descriptions** | PDF.js measures line heights and Y-coordinate offsets. Consecutive text fragments sharing horizontal bounds are merged into a single merchant record. |
| **Date Ambiguity (`03/04/2026`)** | The parser validates whether numbers exceed 12 to detect day vs. month ordering. Standard ISO (`YYYY-MM-DD`) is prioritized. |
| **Zero Expense History / Fresh Account** | If no expenses have been recorded yet, burn rate defaults to 0 and runway displays `999` (infinite/safe) until spend records are introduced. |
| **Less Than 30 Days of History** | A warning badge (`<30 Days Recorded`) appears over the runway metrics, alerting the user that the monthly burn rate is based on an extrapolation. |
| **Multiple Loans Sharing a Tag** | If multiple loans share the same tag and a payment lacks an explicit loan allocation, BudgetLens apportions the payment proportionally based on each loan's scheduled monthly payment. |
| **Browser Storage Eviction** | In low-disk conditions, aggressive browsers may clear IndexedDB. **Mitigation:** BudgetLens provides the File System Access API to auto-sync every record directly to a physical `.md` or `.csv` file on your hard drive. |
| **Port 5173 Collision (`EADDRINUSE`)** | If running locally and another process occupies port 5173, launch with `npm run dev -- --port 5174` or edit `package.json`. |
| **Unsupported Browser File API (Firefox)** | Firefox does not support the File System Access API. BudgetLens detects this gracefully and falls back to standard file download dialogs. |
| **Leap Year Calculations** | All calendar operations use standard UTC/ISO timestamps and normalized 30.4167-day month spans, preventing 28/29 day February drift. |

---

## 8. Legal, Regulatory & Privacy Disclosures

### 8.1 Zero-Custody & Privacy Guarantee
BudgetLens is engineered from the ground up as a **Zero-Knowledge, Zero-Custody Client Application**.
- **No Data Transmission:** BudgetLens does not possess servers, telemetry endpoints, or analytics services. All financial data (including balances, transaction history, loan amounts, and merchant names) remains within the browser's local sandbox storage (`IndexedDB` / `localStorage`).
- **No Third-Party Access:** At no point is financial data transmitted to the developers, advertisers, or third-party cloud infrastructure.
- **Data Subject Rights (GDPR / CCPA / PDPA):** Because no data is collected, stored, or processed on external infrastructure, users retain absolute ownership and control of their data. Deleting data is accomplished instantly by clicking **Reset Workspace** or clearing browser storage.

---

### 8.2 Non-Fiduciary & Financial Disclaimer
> **IMPORTANT NOTICE: READ BEFORE USE**
> 
> BudgetLens is provided solely as an informational, organizational, and personal budgeting software tool. 
> 
> 1. **Not Financial Advice:** BudgetLens, its contributors, and developers are not registered investment advisers, broker-dealers, certified financial planners, or legal/tax advisors. Nothing contained within this software, its runway projections, or its debt burndown simulations constitutes financial, investment, legal, or tax advice.
> 2. **No Warranties on Accuracy:** While BudgetLens employs rigorous mathematical formulas, financial projections and cash runways are estimates based on historical inputs. Actual future expenditures, inflation, interest rate adjustments, bank fees, and currency exchange fluctuations may vary.
> 3. **User Responsibility:** You are solely responsible for verifying the accuracy of transaction categorization, debt schedules, and balances. Always consult a qualified, licensed financial professional before making significant life, loan, or investment decisions.

---

### 8.3 Software License & Limitation of Liability
BudgetLens is provided on an **"AS IS"** and **"AS AVAILABLE"** basis, without warranties of any kind, either express or implied, including but not limited to warranties of merchantability, fitness for a particular purpose, or non-infringement.

Under no circumstances shall the authors, copyright holders, or contributors be liable for any direct, indirect, incidental, special, exemplary, or consequential damages (including loss of data, financial loss, overdraft fees, or business interruption) arising in any way out of the use of or inability to use this software.

---

## 9. Appendix: Supported Currencies & File Schemas

### 9.1 Supported Currencies (`currencyConfig.ts`)

| Code | Symbol | Currency Name | Formatted Example | Flag |
| :--- | :--- | :--- | :--- | :--- |
| **SGD** | S$ | Singapore Dollar | `S$ 1,250.00` | 🇸🇬 |
| **USD** | $ | US Dollar | `$ 1,250.00` | 🇺🇸 |
| **INR** | ₹ | Indian Rupee | `₹ 1,250.00` | 🇮🇳 |
| **EUR** | € | Euro | `€ 1,250.00` | 🇪🇺 |
| **GBP** | £ | British Pound | `£ 1,250.00` | 🇬🇧 |
| **JPY** | ¥ | Japanese Yen (0 Decimals) | `¥ 1,250` | 🇯🇵 |
| **AUD** | A$ | Australian Dollar | `A$ 1,250.00` | 🇦🇺 |
| **CAD** | C$ | Canadian Dollar | `C$ 1,250.00` | 🇨🇦 |
| **CNY** | ¥ | Chinese Yuan | `¥ 1,250.00` | 🇨🇳 |
| **MYR** | RM | Malaysian Ringgit | `RM 1,250.00` | 🇲🇾 |
| **CHF** | CHF | Swiss Franc | `CHF 1,250.00` | 🇨🇭 |
| **AED** | AED | UAE Dirham | `AED 1,250.00` | 🇦🇪 |

---

### 9.2 Standard CSV Export Schema Reference
When exporting via **Export to CSV**, the resulting file conforms to the following schema:

```csv
Date,Title,Amount,Type,Category,Source,Note,Recurring,Tags
2026-09-12,DBS Direct Salary Tech Corp,6200.00,income,Salary,DBS Multi-Currency,Bi-weekly Salary,Yes,salary;payroll
2026-09-10,Monthly Rental Transfer Landlord,1850.00,expense,Rent,UOB Auto Giro,Monthly Fixed,Yes,rent;housing
2026-09-09,FairPrice Supermarket Orchard,164.20,expense,General,DBS Debit Card,Weekly Grocery Haul,No,groceries
2026-09-08,Grab Car Trip to Marina Bay,26.50,expense,Transport,GrabPay,Commute,No,transport;taxi
2026-09-07,SP Services Electricity Bill,178.40,expense,Bills,SP Services,Utilities,Yes,utilities;power
```

---

*BudgetLens Product Documentation • Confidential & Proprietary Reference • 2026*
