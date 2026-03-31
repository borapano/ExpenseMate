# API Endpoint Specifications

## 1. Authentication & Profile
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| POST | `/auth/register` | Create a new `USER` | No |
| POST | `/auth/token` | Login & receive JWT | No |
| GET | `/users/me` | Get current user profile | Yes |
| PUT | `/users/me` | Update current user profile | Yes |

## 2. Groups
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/groups` | List all groups user belongs to | Yes |
| POST | `/groups` | Create a new `GROUP` | Yes |
| POST | `/groups/join` | Join group via `code` | Yes |
| GET | `/groups/{id}/members` | List all `USER`s in a group | Yes |

## 3. Expenses
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/groups/{id}/expenses` | Fetch all `EXPENSE` records | Yes |
| POST | `/expenses` | Create `EXPENSE` & `PARTICIPANTS` | Yes |
| PATCH | `/expenses/{id}` | Edit an existing `EXPENSE` & recalculate balances | Yes |
| DELETE | `/expenses/{id}` | Remove expense & revert balances | Yes |

## 4. Balances & Settlement
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/groups/{id}/balances` | Get `amount_owed` map for group | Yes |
| POST | `/settle` | Record payment between two users | Yes |

## 5. Analytics
| Method | Endpoint | Description | Auth Required |
| :--- | :--- | :--- | :--- |
| GET | `/analytics/spending` | Spending breakdown by category & member | Yes |