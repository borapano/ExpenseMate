# Request/Response Data Schemas

## Create Expense (POST /expenses)
**Request Body:**
```json
{
  "group_id": "uuid",
  "description": "Pizza Night",
  "amount": "45.50",
  "category": "Food",
  "expense_date": "2026-03-28",
  "participants": [
    {"user_id": "uuid", "share_amount": "15.17"},
    {"user_id": "uuid", "share_amount": "15.17"},
    {"user_id": "uuid", "share_amount": "15.16"}
  ]
}