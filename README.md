# Family Monthly Budget

A desktop application built with Electron for managing and tracking family income and expenses by category with monthly budget limits.

## Features

- **Monthly Budget Tracking**: Set budget limits per category for each month
- **Category Management**: Create custom spending categories with color coding
- **Visual Progress**: See spending progress with visual indicators and budget alerts
- **Transaction Logging**: Record income and expense transactions with detailed information
- **Monthly Filtering**: View transactions specific to each month
- **Budget Alerts**: Get warnings when spending exceeds category budget limits
- **Data Persistence**: All data is stored locally using Electron's userData storage

## Requirements

- Node.js 18+ (with npm)

## Setup

1. Open a terminal in the project folder
2. Run `npm install` to install dependencies
3. Run `npm start` to launch the desktop app

## Usage

1. **Add Categories**: Click "+ Add Category" to create spending categories
2. **Set Budget Limits**: Click "Set Budget" on each category to define monthly spending limits
3. **Add Transactions**: Use the form to log income or expense transactions
4. **Monitor Spending**: View progress bars showing spending vs. budget limits by category
5. **Select Month**: Use the month picker to view and manage budgets for specific months

## Packaging

Run `npm run package` to build a Windows executable in the `dist/` folder.

## License

MIT
