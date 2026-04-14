# Page Specifications: ExpenseMate (Premium Data-Driven)

## 1. Login & Authentication Page
**Schema Context:** Maps to `USER` table.
* **Layout:** Centered card on a warm `#EFD2B0` (Beige) background.
* **Components:**
    * **Identity:** Email (`USER.email`) and Password inputs with `#547792` borders.
    * **Action:** Primary Deep Navy Button (`bg-[#1A3263]`) with Beige text (`text-[#EFD2B0]`): "Log In".
    * **Style:** Input focus should trigger a Gold (`#FFC570`) ring.

## 2. Dashboard (Main Overview)
**Schema Context:** Aggregates `BALANCE` for the logged-in `USER`.
* **Layout:** Sidebar navigation (`bg-[#1A3263]`) + Main content grid (`bg-[#EFD2B0]`).
* **Components:**
    * **Global Balance Card:** Uses a high-contrast white card. Net balance shown in Deep Navy (`#1A3263`).
    * **Group Grid:** Fetches `GROUP` names via `GROUP_MEMBER`.
        * **Card Content:** White cards with `#EFD2B0` borders. 
        * **Balance Display:** Positive amounts in Gold (`#FFC570`), negative in Deep Red.
    * **Action:** "Join Group" input with `#547792` (Muted Blue) outlines.

## 3. Create Group Page
**Schema Context:** Populates the `GROUP` table.
* **Layout:** Single-column focused form on a warm surface background.
* **Components:**
    * **Inputs:** `GROUP.name` and `GROUP.description`.
    * **Output:** Highlight the generated `GROUP.code` using a bold Gold (`#FFC570`) banner or box for high visibility.
    * **Action:** "Create Group" button in Deep Navy (`#1A3263`).

## 4. Group Detail Page
**Schema Context:** Joins `GROUP` with `EXPENSE` and `GROUP_MEMBER`.
* **Layout:** Header (`text-[#1A3263]`) + Tabbed view (Feed / Members).
* **Components:**
    * **Expense Feed:** White cards with shadow-sm.
        * `EXPENSE.description` (Deep Navy, Bold)
        * `EXPENSE.category` (Tag using `#547792` background with white text)
        * `EXPENSE.amount` (Large text in `#1A3263`)
        * `USER.name` (Muted Blue `#547792`)
    * **Action:** Floating Action Button (FAB) or prominent button in Gold (`#FFC570`) for "Add Expense".

## 5. Add Expense Page/Modal
**Schema Context:** Populates `EXPENSE` and `EXPENSE_PARTICIPANT`.
* **Layout:** Vertical multi-step form with Beige accents.
* **Components:**
    * **Main Amount:** Large numeric input with `#1A3263` text.
    * **Split Logic:** List of users with checkboxes. Selected users highlighted with a soft `#FFC570` glow.
    * **Validation:** Dynamic status bar showing if the sum of shares matches the total (using `#547792` for "In Progress" and `#1A3263` for "Ready").

## 6. Settlement (Settle Up) Page
**Schema Context:** Adjusts/Resets the `BALANCE` table.
* **Layout:** Clean comparison view (Debt vs. Credit).
* **Components:**
    * **Direct Debt Map:** Shows current user's debts. Amounts owed shown in a high-contrast Deep Red; amounts to receive in Gold (`#FFC570`).
    * **Action:** "Confirm Settlement" button: Large Deep Navy (`#1A3263`) button.
    * **UX:** Success animation post-settlement using the Gold and Navy theme.