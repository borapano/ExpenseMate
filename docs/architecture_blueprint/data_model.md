# Data Model
- **User**: id, name, email, password_hash, role, phone_number, avatar
- **Group**: id, name, code, creator_id, description, created_date
- **Group_Member**: user_id, group_id
- **Expense**: id, group_id, amount, description, category, payer_id, expense_date, created_date, receipt_image
- **Expense_Participant**: expense_id, user_id, share_amount
- **Balance**: id, user_id, group_id, amount_owed, amount_to_receive