# Authentication & Security Protocol (JWT)

## 1. Overview
ExpenseMate uses **Stateless JWT (JSON Web Token)** authentication. The server does not store sessions; instead, the client must provide a valid Bearer Token in the HTTP header for all protected routes.

## 2. The Handshake Flow
1. **Credentials Submission:** User sends `email` and `password` to `/auth/token`.
2. **Verification:** Backend verifies the email exists and the Bcrypt hash matches.
3. **Token Issuance:** Backend returns a JSON object containing:
   - `access_token`: The JWT string.
   - `token_type`: "bearer".
4. **Client Storage:** The React frontend stores the `access_token` in `localStorage`.
5. **Authenticated Requests:** For every subsequent API call (e.g., `/groups`), the client adds the header:
   `Authorization: Bearer <access_token>`



## 3. Token Configuration
* **Algorithm:** HS256
* **Expiration (`exp`):** 24 hours. 
* **Payload (Claims):**
  - `sub`: User UUID
  - `email`: User Email
  - `exp`: Expiration Timestamp

## 4. Protected vs. Public Routes
* **Public (No Token):**
  - `POST /auth/register`
  - `POST /auth/token`
* **Protected (Valid Token Required):**
  - All `/groups/**` endpoints.
  - All `/expenses/**` endpoints.
  - All `/users/me` endpoints.

## 5. Security Constraints
* **Password Hashing:** Use `passlib` with the `bcrypt` algorithm.
* **Error Handling:** If a token is expired or invalid, the API must return a **401 Unauthorized** status code.
* **CORS:** The FastAPI backend must be configured to allow requests from the specific React frontend origin (e.g., `localhost:5173` or your production domain).

## 6. Frontend Log-Out Logic
To log out, the React client simply deletes the `access_token` from `localStorage` and redirects the user to the Login page. No backend call is required.
