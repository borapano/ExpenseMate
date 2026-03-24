# Product Scope: ExpenseMate

## 1. Purpose of this Document
This document defines the boundaries of the ExpenseMate project. It explicitly states what will be built, what will be ignored for now, and the quality standards required to consider a feature "complete."

## 2. Scope Objective
To deliver a functional, secure, and mathematically accurate web application that allows small groups to track shared expenses and visualize spending habits without unnecessary feature bloat.

## 3. In Scope
* **User Accounts:** Registration, Login, and Profile Management (JWT-based).
* **Group Management:** Creation, unique invite codes, and member lists.
* **Expense Entry:** Recording total amount, payer, date, and category.
* **Splitting Logic:** Equal and unequal distribution of costs among group members.
* **Debt Tracking:** Real-time calculation of "Owed" vs. "To Receive" balances.
* **Basic Analytics:** Category-based spending breakdowns (Pie/Bar charts).
* **Audit Trail:** Storing both `expense_date` (actual) and `created_date` (system).

## 4. Out of Scope (Future Versions)
* **Direct Payments:** Integration with PayPal, Venmo, or Stripe.
* **Multi-Currency:** Support for currency conversion/exchange rates.
* **OCR Scanning:** Automatic receipt reading using AI/Vision.
* **Social Feed:** Comments, likes, or messaging within groups.
* **Budgeting:** Setting monthly spending limits or alerts.

## 5. MVP Requirements
* A user must be able to sign up and join a group via a 6-character code.
* A user must be able to log an expense and select which members are involved.
* The system must show a "Simplified Debt" summary (e.g., "User A owes User B $X").
* The dashboard must display a user's net balance across all groups.

## 6. Functional Expectations
* **Accuracy:** Calculations must be precise to two decimal places (use Decimal type, not Float).
* **Responsiveness:** The UI must be fully functional on both Desktop and Mobile browsers.
* **Data Persistence:** Expenses cannot be "lost"; every entry must have a corresponding record in the junction table.

## 7. Non-Functional Expectations
* **Security:** All private routes must require a valid JWT. Passwords must be hashed (Bcrypt).
* **Performance:** API response time for fetching group expenses should be < 200ms.
* **Usability:** Adding an expense should take no more than 4 clicks/taps from the dashboard.

## 8. Feature Prioritization (MoSCoW)
* **Must Have:** JWT Auth, Group Joining, Expense Splitting, Balance Calculation.
* **Should Have:** Category tagging, Receipt image upload, "Settle Up" logs.
* **Could Have:** Spending charts, Avatar uploads, Dark Mode.
* **Won't Have:** Real-time chat, Integrated bank transfers.

## 9. Change Rule
Any change to the Database Schema (ER Diagram) or the Core Splitting Logic must be documented in the `data_preprocessing.md` file before code implementation to ensure AI agent alignment.

## 10. Definition of Done (DoD)
A feature is considered "Done" only when:
1. The Backend API endpoint is tested and returns the correct JSON structure.
2. The Frontend UI is connected and handles both "Success" and "Error" states.
3. The Database relations are verified (no orphaned rows in junction tables).
4. The code follows the naming conventions defined in the Project Brief.