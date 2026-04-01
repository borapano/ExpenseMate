# UI Style Guide: ExpenseMate 

## 1. Purpose
This document defines the visual language, color palette, typography, and core component styles for the ExpenseMate web application. Its purpose is to ensure that the AI agent generates consistent, professional React components using Tailwind CSS utilities that align with the approved mockups.

## 2. Overall Design Philosophy
* **Style:** Clean, professional, FinTech-oriented, and minimalist.
* **Layout:** Card-based architecture with ample whitespace to enhance readability of financial data.
* **Interactions:** Clear visual feedback on interactive elements (hover states on buttons/cards).

## 3. Color Palette (Tailwind Standard Colors)
The application uses a minimalist color palette to focus attention on financial data and call-to-action elements.

| Role | Tailwind Class Example | Visual Description |
| :--- | :--- | :--- |
| **Primary/Action** | `bg-blue-600`, `text-blue-600` | Used for main buttons ("Log In", "Add Expense", "Create Group"), active navigation state, and hyperlinks. |
| **Secondary/Background**| `bg-slate-50`, `bg-white` | The main application background uses a very light gray (`slate-50`). Main content areas and cards use pure white (`white`) to pop against the background. |
| **Borders/Dividers** | `border-slate-200` | Subtly separates elements without cluttering the view (e.g., card borders, input fields). |
| **Text - Primary** | `text-slate-900` | Used for headers and main balance numbers (High contrast). |
| **Text - Secondary** | `text-slate-600` | Used for labels, descriptions, and timestamps (Lower contrast). |
| **Status - Success** | `text-emerald-600` | Green. Used for "Owes You" amounts and positive summaries. |
| **Status - Warning** | `text-red-600` | Red. Used for "You Owe" amounts and negative summaries. |

## 4. Typography
* **Font Family:** A clean, modern Sans-Serif stack (e.g., Inter, System-UI).
* **Weights:** Use Standard (`font-normal`), Medium (`font-medium`) for subheaders, and Bold (`font-bold`) strictly for main balances and page titles.
* **Sizing hierarchy:** * **Page Titles:** `text-3xl font-bold text-slate-900`
    * **Card Section Headers:** `text-lg font-medium text-slate-800`
    * **Main Balances:** `text-4xl font-bold`
    * **Body Text/Labels:** `text-base text-slate-700`
    * **Metadata (Dates):** `text-sm text-slate-500`

## 5. Global Navigation (Navbar)
* **Position:** Fixed to the top of the viewport.
* **Style:** Pure white background (`bg-white`) with a subtle bottom border (`border-b border-slate-100`).
* **Content:** * **Left:** Bold logo (ExpenseMate) with a small chart icon.
    * **Right:** Secondary links (About, FAQ) and a prominent, blue "Log In" or "Dashboard" button.
    * **Active State:** The current page link should have blue text (`text-blue-600`).

## 6. Component Styling Specifications

### A. Buttons
* **Primary (Contained):** `bg-blue-600 text-white rounded-md px-4 py-2 hover:bg-blue-700 transition`
* **Secondary (Outlined):** `border border-slate-300 text-slate-700 rounded-md px-4 py-2 hover:bg-slate-50 transition`

### B. Cards
All main content blocks (Group summaries, Balance displays, Expense lists) must use a consistent card style:
* **Style:** `bg-white rounded-lg border border-slate-100 p-6 shadow-sm`

### C. Forms & Inputs
* **Inputs:** `border border-slate-300 rounded-md p-2 w-full focus:ring-2 focus:ring-blue-200 focus:border-blue-500`
* **Labels:** `text-sm font-medium text-slate-700 mb-1 block`

### D. Data Display (Balances)
* **Positive (Emerald):** Indicate money coming in.
* **Negative (Red):** Indicate money owed.