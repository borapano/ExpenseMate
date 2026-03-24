# Data Preprocessing & Logic: ExpenseMate

## 1. Purpose of this Document
This document defines the rules for data transformation, mathematical calculations, and database integrity. It ensures that any AI agent generating code follows the specific financial logic required for accurate expense splitting and balance tracking.

## 2. Data Integrity & Types
* **Currency Handling:** All monetary values must be stored as **Numeric/Decimal (12, 2)**. 
    * *Rule:* Never use Floats for currency to avoid rounding errors.
* **Unique Identifiers:** All primary keys must be **UUID v4** to allow for future scalability and secure URL referencing.
* **Timestamps:** * `expense_date`: User-inputted `Date` (YYYY-MM-DD).
    * `created_date`: System-generated `DateTime` (UTC) set at the moment of row insertion.

## 3. Junction Table Logic (Many-to-Many)
The system relies on two critical junction tables to maintain relational integrity:

### A. Group_Member
* Connects `User` to `Group`.
* **Validation:** A user cannot join the same group twice (Unique Constraint on `user_id` + `group_id`).

### B. Expense_Participant
* Connects `User` to `Expense`.
* **Attributes:** Includes `share_amount` (the portion of the total expense this specific user owes).
* **Validation:** The sum of all `share_amount` entries for a specific `expense_id` **must exactly equal** the `total_amount` in the `Expense` table.

## 4. Splitting Algorithms
When a new expense is submitted, the backend must process the data based on the chosen split type:

1.  **Equal Split:** * *Calculation:* `Total Amount / Number of Participants`.
    * *Rounding:* If there is a remainder (e.g., $10 / 3 = 3.333...), the "Payer" absorbs the extra cent to ensure the total matches.
2.  **Unequal/Exact Split:** * *Validation:* The UI must send the specific amounts for each user. The Backend must verify the sum before committing to the database.

## 5. Balance Engine Logic
The `Balance` table is a **Calculated Cache**. It should be updated via "Signals" or "Hooks" whenever an Expense is created, edited, or deleted.

* **Logic:** * If User A is the **Payer**: Their `amount_to_receive` increases.
    * If User A is a **Participant**: Their `amount_owed` increases.
* **Net Debt:** `Net_Balance = amount_to_receive - amount_owed`.

## 6. Data Cleaning & Validation Rules
* **Strings:** Strip whitespace from `names`, `emails`, and `descriptions`.
* **Category Normalization:** Ensure categories (e.g., "food", "Food", "FOOD") are saved in a lowercase standardized format.
* **Empty Participants:** An expense cannot be saved if the `participants` list is empty.
* **Self-Payment:** The `payer_id` must be a member of the group associated with the expense.

## 7. Image Handling (Receipts)
* **Constraint:** Only `.jpg`, `.jpeg`, and `.png` allowed.
* **Naming Convention:** `receipt_{expense_uuid}_{timestamp}`.
* **Storage:** Images should be stored in a dedicated S3 bucket or cloud storage, with only the **URL/Path** saved in the database.

## 8. Error Handling Standards
* **422 Unprocessable Entity:** Returned if the split math does not add up to the total.
* **403 Forbidden:** Returned if a user tries to add an expense to a group they are not a member of.