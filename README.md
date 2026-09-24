# BudgetLens - Cash Flow in Focus

BudgetLens is a private personal finance dashboard that helps you track your income, expenses, and cash runway.

All data stays on your own computer or device. There is no cloud storage, no user account, and no data tracking.

---

## Features

- Private and Local: All data is stored directly in your browser. Nothing is sent to external servers.
- Cash Runway: See how many months your money will last based on your current spending.
- Easy Import: Import bank statements from CSV and PDF files, or add transactions manually.
- Smart Detection: Automatically detects recurring monthly bills and cleans up merchant names.
- Loan and Debt Tracking: Track loan balances, interest, and payoff schedules.
- Multi-Currency: Supports major global currencies, selectable in settings.
- Offline Ready: Works completely offline after your first visit.

---

## Accessing BudgetLens

You can access BudgetLens directly in your web browser by opening your Netlify link.

No software installation, account creation, or code compilation is needed for end users. Simply open the link in any web browser to start managing your finances.

---

## Installation and Browser Compatibility

### Installing as a Desktop or Mobile App (Google Chrome)

If you use Google Chrome (or Microsoft Edge), you can install BudgetLens as a standalone app:

1. Open your Netlify link in Google Chrome.
2. Click the Install icon on the right side of the address bar.
3. Select "Install BudgetLens".
4. A shortcut is created on your desktop or home screen, allowing BudgetLens to launch in its own window like a native application.

### Other Browsers (Firefox, Safari)

If you use Firefox, Safari, or another web browser:
- Open your Netlify link directly in your browser.
- The app runs in browser view without installing to your desktop.
- Offline support remains fully active. Once loaded, BudgetLens continues to work even when you have no internet connection.

---

## Data Privacy and Storage

- Where data lives: All data is saved inside your browser storage (IndexedDB).
- Privacy: BudgetLens does not collect, send, or sell your information. No analytics or tracking scripts are used.
- Backups: Use the Export button inside the app at any time to save your data as a CSV or Markdown file.
- Moving to a new device: Export your CSV file from your old device, then import it on your new device.
- Resetting data: Use the Reset button in the dashboard settings if you want to clear all data and start fresh.

---

## Hosting and Netlify Deployment

BudgetLens is deployed automatically via Netlify:
- Production Branch: `main`
- Automatic Deployment: Whenever changes are merged into the `main` branch, Netlify automatically builds and updates the live site.
- Build Command: `npm run build`
- Publish Directory: `dist`

---

## Financial and Legal Disclaimer

BudgetLens is provided for informational and personal budgeting purposes only.

1. Not Financial Advice: The authors and contributors are not licensed financial advisors, investment managers, tax consultants, or attorneys. Nothing in this software should be considered financial, investment, legal, tax, or accounting advice.
2. Estimates Only: Calculations, cash runways, interest projections, and recurring detections are estimates based on your inputs and past records. Future financial conditions, bank fees, interest rates, and currency values may differ.
3. User Responsibility: You are responsible for reviewing and confirming all entries, balances, and calculations. Always consult a qualified professional before making financial, investment, or legal decisions.

---

## License

BudgetLens is open source software licensed under the MIT License. See the [LICENSE](LICENSE) file for the full text.
