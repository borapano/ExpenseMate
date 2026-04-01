# Page Specifications: ExpenseMate (Data-Driven)

## 1. Login & Authentication Page
**Schema Context:** Maps to `USER` table.
* **Layout:** Centered card on a `bg-slate-50` background.
* **Components:**
    * **Identity:** Email (`USER.email`) and Password inputs.
    * **User Profile:** Include placeholder for `USER.avatar` post-login.
    * **Action:** Primary Blue Button: "Log In".

## 2. Dashboard (Main Overview)
**Schema Context:** Aggregates `BALANCE` for the logged-in `USER`.
* **Layout:** Sidebar navigation + Main content grid.
* **Components:**
    * **Global Balance Card:** Shows the net sum of `amount_to_receive` minus `amount_owed` from all `BALANCE` records linked to the user's `uuid`.
    * **Group Grid:** Fetches `GROUP` names via the `GROUP_MEMBER` junction.
        * **Card Content:** Displays `GROUP.name` and the specific `BALANCE` for that group.
    * **Action:** "Join Group" input using the `GROUP.code` unique key.

## 3. Create Group Page
**Schema Context:** Populates the `GROUP` table.
* **Layout:** Single-column focused form.
* **Components:**
    * **Inputs:** `GROUP.name` and `GROUP.description`.
    * **System Fields:** Auto-assign `creator_id` to current user's UUID and `created_date` to current timestamp.
    * **Output:** Highlight the generated `GROUP.code` (UK) for sharing.

## 4. Group Detail Page
**Schema Context:** Joins `GROUP` with `EXPENSE` and `GROUP_MEMBER`.
* **Layout:** Header + Tabbed view (Feed / Members).
* **Components:**
    * **Expense Feed:** Maps to the `EXPENSE` table. Each row displays:
        * `EXPENSE.description` (Main Title)
        * `EXPENSE.category` (Tag/Icon)
        * `EXPENSE.amount` (Total decimal)
        * `USER.name` (The `payer_id` display name)
        * `EXPENSE.expense_date` (User-inputted date)
    * **Action:** "Add Expense" button redirects to the form.

## 5. Add Expense Page/Modal
**Schema Context:** Populates `EXPENSE` and `EXPENSE_PARTICIPANT`.
* **Layout:** Vertical multi-step form.
* **Components:**
    * **Main Amount:** `EXPENSE.amount` (Decimal input).
    * **Metadata:** `EXPENSE.category` dropdown, `EXPENSE.description` text, and `EXPENSE.expense_date` picker.
    * **Image Upload:** File picker for `EXPENSE.receipt_image`.
    * **Split Logic:** Displays all `USER` records linked to this `group_id` via `GROUP_MEMBER`.
        * For each participant, calculate and save `EXPENSE_PARTICIPANT.share_amount`.
    * **Validation:** Sum of `share_amount` must equal `EXPENSE.amount`.

## 6. Settlement (Settle Up) Page
**Schema Context:** Adjusts/Resets the `BALANCE` table.
* **Layout:** Comparison view for Debt vs. Credit.
* **Components:**
    * **Direct Debt Map:** Shows current user's `BALANCE.amount_owed` to other group members.
    * **Action:** "Confirm Settlement" button.
    * **Logic Note:** On click, this triggers a backend calculation to decrement the `amount_owed` and `amount_to_receive` for the two involved users.