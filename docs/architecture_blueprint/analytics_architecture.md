# Analytics Architecture — ExpenseMate (Phase 5)

## 1. Overview
The Analytics module provides category-based and member-based spending breakdowns for each group. It is a **read-only, on-the-fly aggregation layer** — no new database tables are required.

## 2. Data Source
All analytics are derived from existing tables via SQL aggregation:

```
EXPENSE (category, amount, payer_id, expense_date)
  └── joined via group_id to GROUP
  └── joined via payer_id to USER (for display names)
```

## 3. Aggregation Strategy
Analytics are computed **on-the-fly** using SQL `GROUP BY` queries against the `EXPENSE` table. No pre-computed or cached analytics tables are used in v1.

### By Category
```sql
SELECT category, SUM(amount) AS total
FROM expense
WHERE group_id = :group_id
  AND expense_date BETWEEN :start_date AND :end_date
GROUP BY category
ORDER BY total DESC;
```

### By Member (Total Paid)
```sql
SELECT u.id AS user_id, u.name AS user_name, SUM(e.amount) AS total_paid
FROM expense e
JOIN "user" u ON e.payer_id = u.id
WHERE e.group_id = :group_id
  AND e.expense_date BETWEEN :start_date AND :end_date
GROUP BY u.id, u.name
ORDER BY total_paid DESC;
```

## 4. API Contract
- **Endpoint:** `GET /analytics/spending`
- **Query Params:** `group_id` (required), `start_date` (optional), `end_date` (optional)
- **Auth:** Required (JWT Bearer)
- **Full schema:** See `api/request_response_schemas.md §5`

## 5. Frontend Integration
- **Chart.js** renders `by_category` data as a **Pie chart** and a **Bar chart**.
- `by_member` data is rendered as a ranked list or horizontal bar chart.
- Date range filtering is handled via a date picker that updates query params.

## 6. Performance Considerations
- For v1 (MVP), on-the-fly aggregation is acceptable given the expected data volume.
- If query performance degrades beyond 200ms (per `product_scope.md §7`), introduce a materialized view or a cached `analytics_summary` table as a future optimization.
