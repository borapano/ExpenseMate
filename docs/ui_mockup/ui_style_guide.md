# UI Style Guide: ExpenseMate (Premium Palette)

## 1. Purpose
This document defines the visual language, custom color palette, and core component styles for ExpenseMate. It ensures consistent UI generation across all React components using Tailwind CSS with specific hex-code values.

## 2. Overall Design Philosophy
* **Style:** Warm, premium, and sophisticated (A departure from standard generic fintech looks).
* **Layout:** Card-based architecture on a warm surface background to minimize eye strain.
* **Interactions:** Use of high-contrast Navy and Gold to direct user attention to actions and financial balances.

## 3. Custom Color Palette (Hex Values)
These specific hex codes replace the previous Tailwind-default colors (Blue/Slate).

| Role | Hex Code | Visual Description | Usage Example |
| :--- | :--- | :--- | :--- |
| **Primary/Action** | `#1A3263` | **Deep Navy** | Main buttons, navigation bars, and primary headings. |
| **Secondary/Links** | `#547792` | **Muted Blue** | Secondary buttons, icons, and hover states. |
| **Highlight/Gold** | `#FFC570` | **Warm Gold** | "Owes You" balances, alerts, and call-to-action highlights. |
| **Surface/BG** | `#EFD2B0` | **Warm Beige** | Main application background and input field backgrounds. |
| **Text - Primary** | `#1A3263` | **Deep Navy** | Titles, main balance numbers, and active labels. |
| **Text - Secondary** | `#547792` | **Muted Blue** | Subtitles, helper text, and timestamps. |

## 4. Typography
* **Font Family:** Clean Sans-Serif (Inter, Geist, or System-UI).
* **Hierarchy:**
    * **Page Titles:** `text-[#1A3263] font-bold text-3xl`
    * **Main Balances:** `text-[#1A3263] font-extrabold text-4xl tracking-tight`
    * **Card Headers:** `text-[#1A3263] font-semibold text-lg`
    * **Labels:** `text-[#547792] font-medium text-sm uppercase tracking-wider`

## 5. Component Styling Specifications

### A. Buttons
* **Primary (Brand):** `bg-[#1A3263] text-[#EFD2B0] rounded-md px-6 py-2 hover:bg-[#547792] transition-colors shadow-md`
* **Accent (Action):** `bg-[#FFC570] text-[#1A3263] rounded-md px-6 py-2 font-bold hover:brightness-110 transition-all`
* **Ghost:** `text-[#547792] bg-transparent hover:bg-[#EFD2B0]/50 rounded-md px-4 py-2`

### B. Cards
* **Standard Card:** `bg-white rounded-xl border border-[#EFD2B0] p-6 shadow-sm`
* **Elevated Card:** `bg-white rounded-xl border border-[#EFD2B0] p-6 shadow-lg`

### C. Forms & Inputs
* **Input Fields:** `bg-white border border-[#547792]/30 rounded-lg p-3 w-full focus:ring-2 focus:ring-[#FFC570] focus:border-[#1A3263] outline-none transition-all`
* **Field Labels:** `text-xs font-bold text-[#1A3263] mb-1 block`

### D. Financial Indicators
* **Positive Balance:** Use `#547792` or `#FFC570` for a non-traditional but premium look.
* **Negative Balance:** Use a deep burgundy/red that complements the warm beige (e.g., `#8B0000`).

## 6. Global Navigation
* **Navbar Style:** `bg-[#1A3263] text-[#EFD2B0] py-4 shadow-xl`
* **Logo:** Text should be bold white or `#FFC570`.