#!/bin/bash
# BudgetLens — macOS/Linux Launcher

echo ""
echo " ============================================="
echo "  BudgetLens | Cash Flow in Focus"
echo " ============================================="
echo ""

# Check Node.js
if ! command -v node &> /dev/null; then
    echo " [ERROR] Node.js is not installed."
    echo ""
    echo " Install it from: https://nodejs.org (LTS version)"
    echo " Then run this script again."
    echo ""
    open "https://nodejs.org" 2>/dev/null || xdg-open "https://nodejs.org" 2>/dev/null
    exit 1
fi

# Install deps if missing
if [ ! -d "node_modules" ]; then
    echo " Installing dependencies (first time only, ~30 seconds)..."
    npm install --silent
    echo " Done!"
    echo ""
fi

echo " Starting BudgetLens at http://localhost:5173"
echo ""
echo " TIP: In Chrome or Edge, click Install (⊕) in the address bar"
echo "      to add BudgetLens as a desktop app."
echo ""
echo " Keep this window open while using BudgetLens."
echo ""

# Open browser after delay
(sleep 2 && open "http://localhost:5173" 2>/dev/null || xdg-open "http://localhost:5173" 2>/dev/null) &

npm run dev
