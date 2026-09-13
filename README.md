# BudgetLens — Cash Flow in Focus

> Your personal finance dashboard. Track income, expenses, and cash runway — all local, no cloud, no account needed.

---

## ⚡ Quick Start (2 steps)

### Step 1 — Install Node.js (one-time, if you don't have it)
Download and install from: **https://nodejs.org** — pick the **LTS** version.

### Step 2 — Launch BudgetLens

**Windows:**
Double-click **`START BudgetLens.bat`**

**Mac / Linux:**
Open Terminal in this folder and run:
```bash
chmod +x start-budgetlens.sh
./start-budgetlens.sh
```

BudgetLens will open in your browser at `http://localhost:5173`.

---

## 📲 Install as a Desktop App (Recommended)

Once BudgetLens is open in Chrome or Edge:

1. Look for the **⊕ install icon** in the address bar (right side)
2. Click it → **"Install BudgetLens"**
3. A desktop shortcut is created — it runs in its own window like a native app

**iOS Safari:** Tap Share → "Add to Home Screen"
**macOS Safari:** File → "Add to Dock"
**Firefox:** Bookmark it (Firefox doesn't support PWA install)

> After installing, you can close the terminal. Launch BudgetLens from your desktop shortcut directly.

---

## 🗃️ Your Data

- All your financial data is stored **locally in your browser** (IndexedDB)
- Nothing is uploaded anywhere — it's 100% private
- To back up: use the **Export** button inside the app (saves as `.md` or `.csv`)
- To move data to another device: export on old device → import CSV on new device

---

## 🧭 First Use Guide

The app will walk you through a 4-step intro on first launch. After that:

| Step | What to do |
|------|-----------|
| 1 | Click **⚙️ Settings** → set your opening cash balance |
| 2 | Click **+ Add** or drag in a bank CSV to import transactions |
| 3 | Watch the **Runway** section update — see how long your cash lasts |
| 4 | Use **Export** anytime to save your data as a file |

---

## 🌐 Browser Compatibility

| Browser | Works | Install to Desktop | Offline |
|---------|-------|-------------------|---------|
| Chrome | ✅ | ✅ Best experience | ✅ |
| Edge | ✅ | ✅ | ✅ |
| Firefox | ✅ | ❌ (bookmark instead) | ✅ |
| Safari (iOS) | ✅ | ✅ Add to Home Screen | ✅ |
| Safari (macOS) | ✅ | ✅ Add to Dock | ✅ |

---

## ℹ️ Troubleshooting

**"Port 5173 already in use"** — Another app is using that port. Edit `package.json` and change `5173` to `5174` in the `dev` script.

**Data not saving** — Make sure you're using the same browser you always use. Data is browser-specific.

**Want to clear everything and start fresh?** — Use the **🔄 Reset** button in the top-right corner of the dashboard.

---

*BudgetLens • Looking Ahead: How far your cash takes you*
