# 🚀 DEVELOPMENT ROADMAP: EXPENSEMATE

> **SYSTEM INSTRUCTION FOR AGENTS:** Execute one phase at a time. Do not proceed to the next phase until the "Definition of Done" for the current phase is verified. Always cross-reference `data_preprocessing.md` for naming conventions.

---

## 🏗️ PHASE 1: THE SECURE FOUNDATION (IDENTITY)
**Focus:** Authentication, Database Connectivity, and User State.

### [1.1] Backend Tasks
- [ ] **DB Setup:** Initialize SQLAlchemy engine with PostgreSQL.
- [ ] **User Model:** Create `User` table with Bcrypt password hashing.
- [ ] **Auth Logic:** Implement JWT token generation (HS256) and `OAuth2PasswordBearer`.
- [ ] **Endpoints:** - `POST /auth/register` (Validate email uniqueness)
    - `POST /auth/token` (Return access_token)
    - `GET /users/me` (Protected route for auth verification)

### [1.2] Frontend Tasks
- [ ] **Boilerplate:** React (Vite) + Tailwind CSS + Axios.
- [ ] **State Management:** Implement `AuthContext` to persist JWT in `localStorage`.
- [ ] **UI:** Create `LoginPage.jsx` and `RegisterPage.jsx`.

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

### [2.2] Frontend Tasks
- [ ] **Views:** `GroupList.jsx` (Sidebar) and `CreateGroupModal.jsx`.
- [ ] **Routing:** Protected route `/groups/:groupId`.

---

## 💸 PHASE 3: TRANSACTIONAL CORE (EXPENSES)
**Focus:** The "Splitting Engine" and record keeping.
**Dependency:** `Group_Member` relationships from Phase 2.

### [3.1] Backend Tasks
- [ ] **Models:** Create `Expense` and `Expense_Participant` junction table.
- [ ] **Logic:** Implement "Equal Split" validator (verify sum of participants == total).
- [ ] **Fields:** Ensure `expense_date` (User-set) and `created_date` (System-set).
- [ ] **Endpoints:**
    - `POST /expenses` (Input: total, category, date, participants[])
    - `GET /groups/{id}/expenses` (Paginated list)

### [3.2] Frontend Tasks
- [ ] **Form:** `ExpenseForm.jsx` with multi-select for group members.
- [ ] **Feed:** `ExpenseList.jsx` showing "Payer" vs "Date".

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
- [ ] **Aggregation:** `GET /analytics/spending` (Group by category).
- [ ] **Visuals:** Implement `Chart.js` Pie and Bar charts for spending trends.

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