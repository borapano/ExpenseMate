# Project Brief: ExpenseMate

## 1. Purpose of the Document
This document serves as the primary "Source of Truth" for the ExpenseMate platform. It defines the high-level vision, technical constraints, and functional requirements to ensure consistency across backend and frontend development when handled by AI agents or human developers.

## 2. Project Summary
**ExpenseMate** is a specialized FinTech application designed to simplify group financial dynamics. It allows users to create social groups, log shared expenses, and automatically calculate net debts (balances). Unlike simple calculators, ExpenseMate focuses on historical tracking, categorized spending reports, and audit transparency.

## 3. Main Goal
To eliminate the social friction and mathematical complexity of sharing costs by providing a real-time, transparent "Settle Up" engine that requires minimal user input while providing maximum financial insight.

## 4. Target Users
* **Roommates:** Managing monthly rent, utilities, and shared household supplies.
* **Travelers:** Tracking group spending during trips across different categories (Food, Transport, Lodging).
* **Event Organizers:** Splitting costs for parties, dinners, or group gifts.

## 5. Core Product Functionalities
* **User Management:** Secure JWT-based authentication and profile customization.
* **Group Dynamics:** Group creation via unique invitation codes for easy onboarding.
* **Expense Engine:** Multi-participant expense logging with support for unequal splits.
* **Category Tagging:** Every expense is assigned a category (e.g., Food, Transport) for reporting.
* **Balance Tracking:** A dedicated ledger system that calculates "Who owes Whom" within a group.
* **Reporting:** Visual analytics showing spending habits by category and time.

## 6. Product Principles
* **Data Integrity First:** Financial records must be immutable and accurate. Use relational database constraints strictly.
* **Mobile-First UX:** Expense entry must be fast (less than 10 seconds to log a receipt).
* **Transparency:** Every transaction shows a "Created Date" (system) vs. "Expense Date" (user) to prevent disputes.
* **Minimalist Logic:** Favor simplified debt paths (e.g., A pays C instead of A pays B and B pays C).

## 7. Scope of the First Version (MVP)
* User Registration/Login (JWT).
* Group creation and "Join by Code" functionality.
* Single-payer expense logging with equal/unequal split logic.
* Basic Dashboard showing total "Owed" and "To Receive."
* Group-specific expense list with a "Settle Up" summary.

## 8. Expected Project Flow (User Use-Case)
1.  **Onboarding:** A user registers and creates a group. The system generates a unique **Group Code** and sets the user as the creator.
2.  **Invitation:** The creator shares the code with others. Others enter the code to join the group, appearing in the **Group_Member** list.
3.  **Transaction:** A user pays for something on a Monday but logs it on Wednesday. They enter the **Expense Date** (Monday), select a **Category** (Food), and pick the participants.
4.  **Distribution:** The system creates the **Expense** record and maps the debt to each participant via the **Expense_Participant** junction table.
5.  **Reconciliation:** The **Balance** table automatically updates, reflecting that the payer is "To Receive" $40 and two others "Owe" $20 each.
6.  **Analysis:** Users visit the **Reports** page to see a pie chart showing that 60% of their group spending this month went to "Food."
7.  **Settlement:** A participant pays the creator back. The creator logs a "Settle Up" transaction, clearing the rows in the **Balance** table.