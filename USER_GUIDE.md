# BudgetLens - User Guide and Beginner Tutorial

Welcome to BudgetLens. This guide explains how to use every feature in the application, from entering your first transaction to customizing your category colors.

---

## 1. Getting Started and Interactive Tour

When you open BudgetLens for the first time, an interactive tour will guide you through the main sections of the dashboard. 

If you ever want to replay the tour:
1. Look at the top navigation bar.
2. Click the **Tour** button to start the step-by-step introduction again.
   <img width="256" height="68" alt="image" src="https://github.com/user-attachments/assets/f234601b-d03b-463f-91e4-c200c849e7ca" />


---

## 2. Adding Transactions

There are three easy ways to log your income and expenses:

### Quick Add Bar
1. Located directly below the main header.
2. Enter the transaction title (for example, `Coffee` or `Salary`).
3. Enter the amount.
4. Select the type: **Income**, **Expense**, or **Savings**.
5. Click **Add Transaction** or press Enter.
   <img width="1307" height="164" alt="image" src="https://github.com/user-attachments/assets/5de73e2f-5164-425d-9060-d10bf8294a60" />


### Quick Outflow Chips
1. Below the Quick Add bar, you will see predefined category shortcut chips (such as Groceries, Food, Transport, Bills).
2. Click any chip to quickly prefill the transaction form with that category.
   <img width="420" height="697" alt="image" src="https://github.com/user-attachments/assets/52b4aa13-acbf-457d-bdf5-7d67f7a38c99" />


### Detailed Transaction Entry
1. Click the **+ Bulk Upload** button.
2. Import by pasting your custom written budget logs from your notepad and click parse notes or upload your Bank e-statement.
3. Once data is parsed a data Log List will appear for user review and amendments.
4. If all logged data is valid Click "Import" button.
   <img width="861" height="552" alt="image" src="https://github.com/user-attachments/assets/dc1615b3-0c26-4322-975b-483f9f6cc03b" />

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
  <img width="857" height="563" alt="image" src="https://github.com/user-attachments/assets/013e13e7-f7ba-4904-a693-c4b7250fab4d" />

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
  <img width="1137" height="428" alt="image" src="https://github.com/user-attachments/assets/c66e2575-1e8d-4adb-b1b5-762c8a60fe6d" />


---

## 10. Security and Resetting Workspace

- **Data Privacy**: All data is stored locally in your browser storage (IndexedDB). No data is sent to external servers.
- **Workspace Reset**: If you want to start fresh, click the **Reset** button in the top right corner. You will be prompted to download a backup file before clearing the workspace.
