# Project Documentation - ExpenseMate

## Purpose
To provide a transparent, high-performance platform for groups to manage shared expenses, automate debt calculations, and eliminate the social friction of "who owes what" through real-time financial reporting.

## Users
* **Roommates:** Track monthly rent, utilities, and shared household supplies.
* **Travelers:** Split group costs for flights, accommodation, and dining during trips.
* **Event Organizers:** Manage budgets and contributions for parties or weddings.
* **Friend Circles:** Settle up casual tabs for dinners or movies without manual math.

## Core Screens
* **Global Dashboard:** A high-level view showing "Total to Receive" vs. "Total Owed" aggregated across all joined groups.
* **Group Workspace:** A dedicated feed for a specific group showing transaction history and the "Settle Up" summary.
* **Expense Entry Form:** A dynamic interface for total amount, description, category, payer selection, and participant multi-select split-logic.
* **Analytics Hub:** Visual charts (Pie/Bar) pulling from junction tables to show spending trends by category and time.

## Actions
* **Group Management:** Create a group, generate a unique `Group Code`, and join existing groups via the code.
* **Expense Logging:** Create an expense and automatically distribute shares to `Expense_Participant` records.
* **Debt Simplification:** View a calculated summary that reduces the number of payments needed to settle a group (e.g., Alice pays Charlie instead of Bob).
* **Financial Filtering:** Filter history by category (Food, Fun, Rent) or by specific member contributions.