# Pragati

Pragati is a finance management web application built with React and Redux. It provides modules for party management, transactions, reminders, reports, and more, with a modern UI and role-based access control.

## Features

- User authentication with OTP verification
- Party master and transaction management
- Dashboard with key metrics
- Expense and income tracking (Rojmel)
- Reminders and notifications
- Configurable categories for income and expenses
- Multiple reports: Income, Expense, Renewal, Brokerage, Daily Balance, etc.
- Responsive design with modern UI components

## Project Structure

```
src
├── api
│   ├── auth.js
│   ├── parties.js
│   ├── transactions.js
│   └── reports.js
├── components
│   ├── common
│   │   ├── Header.js
│   │   ├── Footer.js
│   │   └── PrivateRoute.js
│   ├── auth
│   │   ├── Login.js
│   │   └── Register.js
│   ├── dashboard
│   │   └── Dashboard.js
│   ├── parties
│   │   ├── PartyList.js
│   │   └── PartyForm.js
│   ├── transactions
│   │   ├── TransactionList.js
│   │   └── TransactionForm.js
│   └── reports
│       ├── ReportList.js
│       └── ReportForm.js
├── context
│   ├── AuthContext.js
│   ├── PartyContext.js
│   └── TransactionContext.js
├── hooks
│   ├── useAuth.js
│   ├── useParties.js
│   └── useTransactions.js
├── pages
│   ├── HomePage.js
│   ├── LoginPage.js
│   ├── RegisterPage.js
│   ├── DashboardPage.js
│   ├── PartyPage.js
│   ├── TransactionPage.js
│   └── ReportPage.js
├── reducers
│   ├── authReducer.js
│   ├── partyReducer.js
│   └── transactionReducer.js
├── store
│   └── store.js
├── styles
│   ├── App.css
│   ├── Header.css
│   ├── Footer.css
│   ├── Login.css
│   ├── Register.css
│   ├── Dashboard.css
│   ├── Party.css
│   ├── Transaction.css
│   └── Report.css
└── utils
    ├── api.js
    ├── auth.js
    ├── parties.js
    └── transactions.js
```

## Installation and Setup

1. Clone the repository
2. Run `npm install` to install dependencies
3. Create a `.env` file and add your environment variables
4. Run `npm start` to start the development server

## Contributing

Contributions are welcome! Please read our [CONTRIBUTING.md](CONTRIBUTING.md) for more information.

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.
