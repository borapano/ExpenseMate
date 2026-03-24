# Microservices Architecture – ExpenseMate

- **Authentication Service**: Manages user registration, login, and session handling.  
- **Group Management Service**: Handles creation of groups, joining with group codes, and managing group members.  
- **Expense Management Service**: Allows adding, editing, and deleting expenses within a group.  
- **Balance Calculation Service**: Automatically computes who owes whom and provides summaries of debts.  
- **Reporting Service**: Generates summaries and overviews of group expenses and balances.  
- **API Gateway**: Central entry point for all frontend requests, routing them to the correct microservice.  
- **Databases**: Each service has its own dedicated database for data isolation and scalability.