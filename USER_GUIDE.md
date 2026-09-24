# BudgetLens - User Guide and Beginner Tutorial

Welcome to BudgetLens. This guide explains how to use every feature in the application, from entering your first transaction to customizing your category colors.

---

## 1. Getting Started and Interactive Tour

When you open BudgetLens for the first time, an interactive tour will guide you through the main sections of the dashboard. 

If you ever want to replay the tour:
1. Look at the top navigation bar.
2. Click the **Tour** button to start the step-by-step introduction again.

---

## 2. Adding Transactions

There are three easy ways to log your income and expenses:

### Quick Add Bar
1. Located directly below the main header.
2. Enter the transaction title (for example, `Coffee` or `Salary`).
3. Enter the amount.
4. Select the type: **Income**, **Expense**, or **Savings**.
5. Click **Add Transaction** or press Enter.

### Quick Outflow Chips
1. Below the Quick Add bar, you will see predefined category shortcut chips (such as Groceries, Food, Transport, Bills).
2. Click any chip to quickly prefill the transaction form with that category.

### Detailed Transaction Entry
1. Click the **+ Add Transaction** button.
2. Fill in optional fields including Date, Category, Payment Source, Notes, and Tags.
3. Check **Recurring Transaction** if this item repeats monthly (such as rent or subscriptions).

---

## 3. Importing and Exporting Data

BudgetLens supports offline file imports and complete data backups.

### Importing Statements (CSV, PDF, Markdown)
1. Drag and drop your bank statement file into the **Import Zone** area on the dashboard, or click **Browse Files**.
2. Supported formats:
   - **CSV**: Standard bank export files.
   - **PDF**: Electronic bank statements parsed directly in your browser.
   - **Markdown**: Expense tables formatted in Markdown text.
3. Review the parsed transactions in the import modal before confirming.

### Exporting Your Data
1. Scroll to the bottom of the dashboard or open **Settings**.
2. Click **Export to CSV** to download a spreadsheet of all your records.
3. Click **Export to Markdown** to save a human-readable text document.

---

## 4. Reading Dashboard Metrics and Runway

The hero section displays four key metrics:

- **Cash In Hand**: Your current safe-to-spend cash balance.
- **Cash Runway**: The estimated number of months your money will last based on your current spending rate.
- **Total Inflow**: The sum of all income logged for the selected period.
- **Total Outflow**: The sum of all expenses logged for the selected period.

---

## 5. Reading Charts and Graphs

BudgetLens includes interactive charts to visualize your finances.

### Cash Flow Trend Bar Chart
- Displays your monthly or weekly income versus expenses side-by-side.
- **Timeframe Selector**: Toggle between **1M** (1 Month), **3M** (3 Months), **1Y** (1 Year), or **ALL**.
- **Hover Action**: Hover your mouse over any bar to view exact numeric breakdowns in the popup tooltip.

### Expenditure Donut Chart (Pie Chart)
- Shows how your expenses are divided among categories.
- **Hover Action**: Hover over any color slice or legend item to highlight that category and see its exact dollar amount and percentage.

---

## 6. Using Tags and Filtering

Tags help you organize and find specific expenses:

- **Adding Tags**: When entering a transaction, type tags separated by commas or semicolons (for example, `vacation, hotel`).
- **Filtering by Tag**: In the Activity Ledger, click on any tag pill to immediately filter the table to show only matching items.

---

## 7. Managing the Activity Ledger

The Activity Ledger displays all your recorded transactions in a searchable table.

### Searching and Filtering
- Use the **Search Bar** to search by title, note, or merchant name.
- Filter by transaction type (**All**, **Income**, **Expense**, **Savings**).

### Editing a Transaction
1. Find the transaction in the ledger list.
2. Click the **Edit** (pencil) button.
3. Update any field in the pop-up editor.
4. Click **Save Changes**.

### Deleting a Transaction
1. Click the **Delete** (trash) button next to the transaction.
2. Confirm the deletion when prompted.

---

## 8. Debt and Loan Hub

The Debt Hub helps you manage loans, credit cards, or mortgages:

1. Click **+ Add Loan** in the Debt section.
2. Enter the lender name, total balance, interest rate, and monthly payment.
3. BudgetLens automatically calculates the payoff schedule and links matching payment transactions.

---

## 9. App Settings and Customization

Click the **Settings** button in the top navigation bar to open the configuration panel. Settings is divided into two tabs:

### Tab 1: Preferences and Balances
- **Opening Cash Balance**: Set your starting bank account balance.
- **Currency Configuration**: Select your primary currency symbol (USD, EUR, GBP, SGD, INR, JPY, and more).
- **Security Lock**: Enable a 4-digit PIN code to lock the dashboard using local SHA-256 encryption.

### Tab 2: Category Manager and Colors
- **Customize Categories**: View all expense and income categories.
- **Change Category Colors**: Click the color picker next to any category to choose a custom color for your donut chart and labels.
- **Add Custom Category**: Create new categories with custom labels and icons.

---

## 10. Security and Resetting Workspace

- **Data Privacy**: All data is stored locally in your browser storage (IndexedDB). No data is sent to external servers.
- **Workspace Reset**: If you want to start fresh, click the **Reset** button in the top right corner. You will be prompted to download a backup file before clearing the workspace.
