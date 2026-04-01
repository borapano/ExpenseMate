# Request/Response Data Schemas

## 1. Authentication

### POST /auth/register
**Request Body:**
```json
{
  "name": "Jane Doe",
  "email": "jane@example.com",
  "password": "securepassword123"
}
```
**Response (201 Created):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```
> **Note:** The backend hashes the `password` field using Bcrypt and stores it as `password_hash` in the `USER` table. The plaintext password is never stored.

---

### POST /auth/token
**Request Body (OAuth2 Form):**
```json
{
  "username": "jane@example.com",
  "password": "securepassword123"
}
```
**Response (200 OK):**
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIs...",
  "token_type": "bearer"
}
```

---

### GET /users/me
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "role": "member",
  "phone_number": "+1234567890",
  "avatar": "https://storage.example.com/avatars/uuid.png"
}
```

---

### PUT /users/me
**Request Body (partial updates allowed):**
```json
{
  "name": "Jane Smith",
  "phone_number": "+0987654321",
  "avatar": "https://storage.example.com/avatars/uuid.png"
}
```
**Response (200 OK):**
```json
{
  "id": "uuid",
  "name": "Jane Smith",
  "email": "jane@example.com",
  "role": "member",
  "phone_number": "+0987654321",
  "avatar": "https://storage.example.com/avatars/uuid.png"
}
```

---

## 2. Groups

### POST /groups
**Request Body:**
```json
{
  "name": "Apartment 4B",
  "description": "Monthly shared expenses"
}
```
> **Note:** `creator_id` is auto-assigned from the JWT token. `code` and `created_date` are system-generated.

**Response (201 Created):**
```json
{
  "id": "uuid",
  "name": "Apartment 4B",
  "code": "A1B2C3",
  "creator_id": "uuid",
  "description": "Monthly shared expenses",
  "created_date": "2026-03-28T12:00:00Z"
}
```

---

### POST /groups/join
**Request Body:**
```json
{
  "code": "A1B2C3"
}
```
**Response (200 OK):**
```json
{
  "group_id": "uuid",
  "group_name": "Apartment 4B",
  "message": "Successfully joined group"
}
```

---

### GET /groups
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "name": "Apartment 4B",
    "code": "A1B2C3",
    "description": "Monthly shared expenses",
    "created_date": "2026-03-28T12:00:00Z",
    "member_count": 4
  }
]
```

---

### GET /groups/{id}/members
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
[
  {
    "user_id": "uuid",
    "name": "Jane Doe",
    "email": "jane@example.com",
    "avatar": "https://storage.example.com/avatars/uuid.png"
  }
]
```

---

## 3. Expenses

### POST /expenses
**Request Body:**
```json
{
  "group_id": "uuid",
  "description": "Pizza Night",
  "amount": 45.50,
  "category": "food",
  "payer_id": "uuid",
  "expense_date": "2026-03-28",
  "receipt_image": "https://storage.example.com/receipts/receipt_uuid_1711612800.png",
  "participants": [
    {"user_id": "uuid", "share_amount": 15.17},
    {"user_id": "uuid", "share_amount": 15.17},
    {"user_id": "uuid", "share_amount": 15.16}
  ]
}
```
> **Note:** `payer_id` identifies who paid. If omitted, defaults to the authenticated user. `receipt_image` is optional; see `data_preprocessing.md §7` for image upload constraints. `category` must be lowercase. Monetary values are JSON numbers parsed to `Decimal(12,2)` on the backend.

**Response (201 Created):**
```json
{
  "id": "uuid",
  "group_id": "uuid",
  "payer_id": "uuid",
  "amount": 45.50,
  "description": "Pizza Night",
  "category": "food",
  "expense_date": "2026-03-28",
  "created_date": "2026-03-31T14:30:00Z",
  "receipt_image": "https://storage.example.com/receipts/receipt_uuid_1711612800.png",
  "participants": [
    {"user_id": "uuid", "share_amount": 15.17},
    {"user_id": "uuid", "share_amount": 15.17},
    {"user_id": "uuid", "share_amount": 15.16}
  ]
}
```

---

### GET /groups/{id}/expenses
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
[
  {
    "id": "uuid",
    "group_id": "uuid",
    "payer_id": "uuid",
    "payer_name": "Jane Doe",
    "amount": 45.50,
    "description": "Pizza Night",
    "category": "food",
    "expense_date": "2026-03-28",
    "created_date": "2026-03-31T14:30:00Z",
    "receipt_image": "https://storage.example.com/receipts/receipt_uuid_1711612800.png",
    "participant_count": 3
  }
]
```

---

### PATCH /expenses/{id}
**Request Body (partial — only changed fields required):**
```json
{
  "description": "Pizza + Drinks Night",
  "amount": 60.00,
  "category": "food",
  "expense_date": "2026-03-28",
  "participants": [
    {"user_id": "uuid", "share_amount": 20.00},
    {"user_id": "uuid", "share_amount": 20.00},
    {"user_id": "uuid", "share_amount": 20.00}
  ]
}
```
> **Note:** Only the expense creator can edit. Balance recalculation is triggered automatically on update.

**Response (200 OK):** Returns the full updated expense object (same shape as `POST /expenses` response).

---

### DELETE /expenses/{id}
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
{
  "message": "Expense deleted and balances reverted"
}
```
> **Note:** Deletes the `EXPENSE` row and all linked `EXPENSE_PARTICIPANT` rows. Triggers balance recalculation.

---

## 4. Balances & Settlement

### GET /groups/{id}/balances
**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
[
  {
    "user_id": "uuid",
    "user_name": "Jane Doe",
    "amount_owed": 25.00,
    "amount_to_receive": 45.50,
    "net_balance": 20.50
  }
]
```

---

### POST /settle
**Request Body:**
```json
{
  "group_id": "uuid",
  "to_user_id": "uuid",
  "amount": 25.00
}
```
> **Note:** `from_user_id` is inferred from the JWT token. The backend decrements `amount_owed` for the sender and `amount_to_receive` for the receiver.

**Response (200 OK):**
```json
{
  "message": "Settlement recorded",
  "from_user_id": "uuid",
  "to_user_id": "uuid",
  "amount": 25.00,
  "group_id": "uuid"
}
```

---

## 5. Analytics

### GET /analytics/spending
**Query Parameters:** `group_id` (required), `start_date` (optional, YYYY-MM-DD), `end_date` (optional, YYYY-MM-DD).

**Request:** No body. Requires `Authorization: Bearer <token>` header.

**Response (200 OK):**
```json
{
  "group_id": "uuid",
  "period": {
    "start_date": "2026-03-01",
    "end_date": "2026-03-31"
  },
  "total_spending": 350.00,
  "by_category": [
    {"category": "food", "total": 180.00, "percentage": 51.4},
    {"category": "transport", "total": 90.00, "percentage": 25.7},
    {"category": "utilities", "total": 80.00, "percentage": 22.9}
  ],
  "by_member": [
    {"user_id": "uuid", "user_name": "Jane Doe", "total_paid": 150.00},
    {"user_id": "uuid", "user_name": "John Doe", "total_paid": 200.00}
  ]
}
```