# BudgetLens - Cash Flow in Focus

BudgetLens is a personal finance dashboard that helps you track your income, expenses, and cash runway.

All data stays on your own computer or device. There is no cloud, no user account, and no tracking.

---

## Features

- Private and Local: All data is saved directly in your browser. Nothing is sent to external servers.
- Cash Runway: See how many months your money will last based on your current spending.
- Easy Import: Import bank statements from CSV and PDF files, or add transactions manually.
- Smart Detection: Automatically detects recurring monthly bills and cleans up merchant names.
- Loan and Debt Tracking: Track loan balances, interest, and payoff schedules.
- Multi-Currency: Supports major currencies, selectable in settings.
- Offline Ready: Works without an internet connection and can be installed as an app.

---

## Quick Start

### Requirements

- Node.js (download the LTS version from https://nodejs.org if you do not have it).

### Running BudgetLens

Windows:
- Double-click the file named `START BudgetLens.bat`.

Mac or Linux:
- Open Terminal in this project folder and run:
```bash
chmod +x start-budgetlens.sh
./start-budgetlens.sh
```

Manual setup (any operating system):
1. Open your terminal in this folder.
2. Install dependencies:
```bash
npm install
```
3. Start the application:
```bash
npm run dev
```
4. Open your browser and go to:
```
http://localhost:5173
```

---

## Install as a Desktop App

You can install BudgetLens to run in its own window like a native application:

1. Open `http://localhost:5173` in Google Chrome or Microsoft Edge.
2. Click the install icon on the right side of the address bar.
3. Click "Install BudgetLens".
4. A shortcut is created on your desktop.

Mobile and Safari:
- iPhone or iPad (Safari): Tap the Share button, then tap "Add to Home Screen".
- Mac (Safari): In the menu bar, click File, then click "Add to Dock".

---

## Your Data and Privacy

- Where data lives: All data is saved inside your browser storage (IndexedDB).
- Privacy: BudgetLens does not collect, send, or sell your information. No analytics or tracking scripts are used.
- Backups: Use the Export button inside the app at any time to save your data as a CSV or Markdown file.
- Moving to a new computer: Export your CSV file from your old computer, then import it on your new computer.
- Resetting data: Use the Reset button in the dashboard settings if you want to clear all data and start fresh.

---

## Troubleshooting

- Port in use error: If port 5173 is already used by another program, open `package.json` and change `5173` to `5174` in the `dev` script.
- Data missing after restart: Make sure you open BudgetLens in the same browser you used before. Browser data is tied to the specific browser application.

---

## Financial and Legal Disclaimer

BudgetLens is provided for informational and personal budgeting purposes only.

1. Not Financial Advice: The authors and contributors are not licensed financial advisors, investment managers, tax consultants, or attorneys. Nothing in this software should be considered financial, investment, legal, tax, or accounting advice.
2. Estimates Only: Calculations, cash runways, interest projections, and recurring detections are estimates based on your inputs and past records. Future financial conditions, bank fees, interest rates, and currency values may differ.
3. User Responsibility: You are responsible for reviewing and confirming all entries, balances, and calculations. Always consult a qualified professional before making financial, investment, or legal decisions.

---

## License

BudgetLens is open source software licensed under the MIT License. See the [LICENSE](LICENSE) file for the full text.
