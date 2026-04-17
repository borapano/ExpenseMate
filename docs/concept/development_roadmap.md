# 🚀 DEVELOPMENT ROADMAP: EXPENSEMATE

> **SYSTEM INSTRUCTION FOR AGENTS:** Execute one phase at a time. Do not proceed to the next phase until the "Definition of Done" for the current phase is verified. Always cross-reference `data_preprocessing.md` for naming conventions.

---

## 🏗️ PHASE 1: THE SECURE FOUNDATION (IDENTITY)
**Focus:** Authentication, Database Connectivity, and User State.

### [1.1] Backend Tasks
- [ ] **DB Setup:** Initialize SQLAlchemy engine with PostgreSQL.
- [ ] **User Model:** Create `User` table with Bcrypt password hashing.
- [ ] **Auth Logic:** Implement JWT token generation (HS256) and `OAuth2PasswordBearer`.
- [ ] **Endpoints:**
    - `POST /auth/register` (Validate email uniqueness)
    - `POST /auth/token` (Return access_token)
    - `GET /users/me` (Protected route for auth verification)
    - `PUT /users/me` (Update user profile: name, phone_number, avatar)

### [1.2] Frontend Tasks
- [ ] **Boilerplate:** React (Vite) + Tailwind CSS + Axios.
- [ ] **State Management:** Implement `AuthContext` to persist JWT in `localStorage`.
- [ ] **UI:** Create `LoginPage.jsx` and `RegisterPage.jsx`.


🧩 Sprint 1.A: The Data Bedrock (Days 1–2)
Goal: Connect to PostgreSQL and define the User Identity.

Backend: * Setup database.py (SQLAlchemy engine & SessionLocal).

Create models.py defining the User table (ID, Name, Email, Password_Hash, Role, Phone, Avatar).

Create schemas.py using Pydantic for User Registration and User Display.

Definition of Done: You can run a script that successfully creates the users table in your Postgres database.

🧩 Sprint 1.B: The Security Engine (Day 3)
Goal: Issue and verify JWTs.

Backend:

Implement security.py for Bcrypt hashing.

Implement JWT utility functions (Create/Decode access tokens).

Setup OAuth2PasswordBearer dependency to protect routes.

Endpoints: Build POST /auth/register and POST /auth/token.

Definition of Done: Using Postman/Swagger, you can register a user and receive a valid token back.

🧩 Sprint 1.C: Frontend Shell & Auth Context (Day 4)
Goal: Prepare the React environment to handle the token.

Frontend:

Initialize Vite + Tailwind.

Setup api/axios.js (Include an interceptor to automatically attach the Bearer token to requests).

Create AuthContext.jsx to manage user state and localStorage persistence.

Definition of Done: The React app can store a dummy token and "remember" it after a page refresh.

🧩 Sprint 1.D: Identity UI & Profile (Day 5)
Goal: Connect the UI to the API.

Frontend: Build LoginPage.jsx and RegisterPage.jsx using Tailwind styles from ui_style_guide.md.

Backend: Build GET /users/me and PUT /users/me.

Integration: Successful login redirects the user to a (currently empty) Dashboard.

Definition of Done: A user can sign up, log in, and see their own name fetched from the /users/me endpoint.

---

## 👥 PHASE 2: SOCIAL ARCHITECTURE (GROUPS)
**Focus:** Creating the "Containers" for expenses.
**Dependency:** Successful completion of Phase 1.

### [2.1] Backend Tasks
- [ ] **Models:** Create `Group` table and `Group_Member` junction table.
- [ ] **Invite Logic:** Function to generate a unique 6-character alphanumeric `code`.
- [ ] **Endpoints:**
    - `POST /groups` (Auto-assign `creator_id` from JWT)
    - `POST /groups/join` (Body: `{ "code": "..." }`)
    - `GET /groups` (List all groups the user belongs to)
    - `GET /groups/{id}/members` (List all users in a group)

### [2.2] Frontend Tasks
- [ ] **Views:** `GroupList.jsx` (Sidebar) and `CreateGroupModal.jsx`.
- [ ] **Routing:** Protected route `/groups/:group_id`.

🧩 Sprint 2.A: The Social Schema (Day 1)

Goal: Create the Group structure in the database.

Backend:
	•	Update models.py: Create the Group table (id, name, description, invite_code, creator_id)
	•	Create the GroupMember table (junction table) for the Many-to-Many relationship between Users and Groups

Schemas:
	•	Define GroupCreate and GroupOut using Pydantic

Estimated time: 1 – 1.5 hours

Definition of Done:
	•	The database in Neon.tech reflects the new tables
	•	You can manually create a group via a script

⸻

🧩 Sprint 2.B: The Invitation Logic (Day 2)

Goal: Enable group creation and joining via unique invite codes.

Backend Endpoints:
	•	POST /groups: Creates a group and automatically adds the creator as the first member (Admin)
	•	Implement invite code generator (6 characters, e.g. AX72RT)
	•	POST /groups/join: Endpoint that takes a code and adds the logged-in user to that group

Estimated time: 2 hours

Definition of Done:
	•	Using Swagger (/docs), you can create a group
	•	Another user can join using the invite code

⸻

🧩 Sprint 2.C: Group Navigation UI (Day 3)

Goal: Display groups in the frontend and allow visual creation.

Frontend:
	•	Views: Create Sidebar.jsx to list the groups the user belongs to
	•	Modals: CreateGroupModal.jsx (simple form for name and description)
	•	API: GET /groups to populate the sidebar list

Estimated time: 2.5 hours

Definition of Done:
	•	The user sees their groups on the left side of the dashboard
	•	The user can open a modal to create a new group

⸻

🧩 Sprint 2.D: Dynamic Group Views (Day 4)

Goal: Create dedicated pages for each group.

Frontend:
	•	Routing: Configure dynamic route /groups/:groupId in App.jsx
	•	Components: GroupDetail.jsx (page where members and later expenses will be displayed)
	•	Logic: Fetch group members from backend (GET /groups/{id}/members)

Backend:
	•	Endpoint to list members of a specific group

Estimated time: 2 hours

Definition of Done:
	•	Clicking a group in the sidebar navigates to its page
	•	You can see the list of members in that group

---

## 💸 PHASE 3: TRANSACTIONAL CORE (EXPENSES)
**Focus:** The "Splitting Engine" and record keeping.
**Dependency:** `Group_Member` relationships from Phase 2.

### [3.1] Backend Tasks
- [ ] **Models:** Create `Expense` and `Expense_Participant` junction table.
- [ ] **Logic:** Implement "Equal Split" validator (verify sum of participants == total).
- [ ] **Fields:** Ensure `expense_date` (User-set) and `created_date` (System-set).
- [ ] **Endpoints:**
    - `POST /expenses` (Input: total, category, date, payer_id, receipt_image, participants[])
    - `GET /groups/{id}/expenses` (Paginated list)
    - `PATCH /expenses/{id}` (Edit expense & recalculate balances)
    - `DELETE /expenses/{id}` (Remove expense & revert balances)

### [3.2] Frontend Tasks
- [ ] **Form:** `ExpenseForm.jsx` with multi-select for group members.
- [ ] **Feed:** `ExpenseList.jsx` showing "Payer" vs "Date".


🗓️ Sprint 1: Data Architecture & Integrity
Focus: Database schema and the "Source of Truth."

Day 1: Database Modeling

Create Expense model (ID, GroupID, PayerID, Amount, Category, Date, Description).

Create ExpenseParticipant junction table (ExpenseID, UserID, ShareAmount, IsSettled).

Why: You need a separate table for participants to handle unequal splits in the future.

Day 2: The Validation Logic

Write a utility function/validator to ensure sum(participants.share) == expense.total.

Implement created_at (server-side timestamp) vs expense_date (user-input).

🗓️ Sprint 2: The CRUD API (Backend)
Focus: Enabling the flow of data between your server and database.

Day 3: Creation & Retrieval

POST /expenses: Handle the complex logic of saving an expense and its participants in a single transaction.

GET /groups/{id}/expenses: Implement basic pagination (e.g., 20 expenses per page) to keep the Dashboard fast.

Day 4: Modifications & Cleanup

PATCH /expenses/{id}: Logic to recalculate participant shares if the total amount changes.

DELETE /expenses/{id}: Soft or hard delete that reverts the group's "Total Expenses" counter.

🗓️ Sprint 3: User Experience (Frontend)
Focus: Making complex financial data easy to input and read.

Day 5: The Expense Entry Form

Build ExpenseForm.jsx: A modal or page where users select a category, amount, and the payer.

Multi-select logic: Allow users to "check" which group members are part of the expense.

Tip: Default to "Split Equally" to save the user time.

Day 6: The Activity Feed

Build ExpenseList.jsx: Transform the raw JSON from the API into a clean list.

UI Detail: Show "You paid $X" in green or "You owe $X" in red for each item.

Day 7: Testing & Edge Cases

Test what happens if a user tries to delete an expense they didn't create.

Verify that balances update instantly on the Dashboard after adding a new expense.
---

## 🧠 PHASE 4: INTELLIGENCE LAYER (BALANCES)
**Focus:** Automated accounting and debt simplification.

### [4.1] Backend Tasks
- [ ] **Model:** Create `Balance` table (The Cache).
- [ ] **Background Service:** Create a function to recalculate group balances upon `Expense` creation/deletion.
- [ ] **Endpoint:** `GET /groups/{id}/balances` (Return net debt map).

### [4.2] Frontend Tasks
- [ ] **UI:** "Settle Up" card showing "You are owed $X" or "You owe $Y".

---

## 📊 PHASE 5: VISUAL INSIGHTS (ANALYTICS)
**Focus:** Data visualization.

### [5.1] Backend & Frontend
- [ ] **Aggregation:** `GET /analytics/spending` (Group by category and member; see `analytics_architecture.md`).
- [ ] **Visuals:** Implement `Chart.js` Pie and Bar charts for spending trends.
- [ ] **Date Filtering:** Add date range picker for filtering analytics by period.

---

## ✅ COMPLETION CHECKLIST & "DEFINITION OF DONE"
1. **Security:** No endpoint (except Login/Register) allows access without a valid Bearer Token.
2. **Naming:** All DB fields match the `data_preprocessing.md` exactly.
3. **Accuracy:** Split math handles remainders by assigning the extra cent to the payer.
4. **Errors:** API returns clear `detail` messages for 400/401/404/422 status codes.

## 📝 AGENT CONSTRAINTS
- **Atomic Commits:** Do not write code for two phases in one response.
- **Strict Typing:** Use Pydantic schemas for all request/response bodies.
- **Statelessness:** No session cookies; strictly use Header-based Authorization.