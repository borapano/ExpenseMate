# 💸 ExpenseMate: Smart Group Expense Splitter

ExpenseMate is a full-stack FinTech application designed to simplify shared finances. Whether it's a house share, a trip with friends, or a dinner out, ExpenseMate tracks who paid, who owes, and automates the settlement process with mathematical precision.

## 🚀 The 5-Week Sprint
This project was developed using an **AI-Accelerated Workflow**. By utilizing a comprehensive "Concept Folder" (Architecture, Logic, and UI Specs), the development cycle was compressed from a standard 3-month roadmap into a high-intensity 5-week launch.

---

## ✨ Key Features
* **Group Dynamics:** Create or join groups via unique 6-digit invite codes.
* **Smart Splitting:** Support for Equal and Exact amount splitting with "Payer-Absorbs-Remainder" logic to ensure zero rounding errors.
* **Real-time Balances:** A centralized "Balance Cache" that instantly updates "Who owes Who" across the entire group.
* **Receipt Tracking:** Upload and store digital receipts for every transaction.
* **Visual Analytics:** Spending breakdowns by category and monthly trends.

---

## 🛠️ Tech Stack
| Layer | Technology |
| :--- | :--- |
| **Frontend** | React 18, Tailwind CSS, Axios, React Router |
| **Backend** | FastAPI (Python 3.10+), Pydantic v2 |
| **Database** | PostgreSQL, SQLAlchemy ORM |
| **Security** | JWT (JSON Web Tokens), Bcrypt Hashing |
| **DevOps** | Docker, GitHub Actions (CI/CD) |

---

## 📁 Project Structure
```text
├── api_specs/           # API Endpoints, JSON Schemas, & Auth Flow
├── concept/             # Architecture, Logic, UI Style Guide, & Page Specs
├── workflow/            # AI Configs, Prompt Logs, & Baseline Metrics
├── backend/             # FastAPI Source Code
├── frontend/            # React Source Code
└── docker-compose.yml   # Local Environment Orchestration