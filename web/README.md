# OpenFinance Web Frontend

A modern personal finance management application built with React, TypeScript, and Tailwind CSS. This is the frontend companion to the OpenFinance Rails GraphQL API.

## Features

- **Dashboard**: Net worth tracking, spending insights, recent transactions
- **Transactions**: Comprehensive transaction management with filtering and categorization
- **Accounts**: Multi-account support with manual and bank connections (Plaid ready)
- **Budget**: Monthly budgeting with progress tracking and overspend alerts
- **Categories**: Flexible category system with custom colors and subcategories
- **Responsive Design**: Mobile-first design that works on all devices

## Tech Stack

- **Framework**: React 18 with TypeScript
- **Build Tool**: Vite
- **Styling**: Tailwind CSS v3
- **GraphQL**: Apollo Client
- **Charts**: Recharts
- **UI Components**: Headless UI
- **Icons**: Heroicons
- **Date Handling**: date-fns
- **Routing**: React Router v6

## Getting Started

### Prerequisites

- Node.js 18+ 
- npm or yarn
- OpenFinance Rails API running on `localhost:3001`

### Installation

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

### Preview Production Build

```bash
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # Reusable UI components
│   └── ProtectedRoute.tsx
├── hooks/               # Custom React hooks
├── graphql/             # GraphQL queries and mutations
├── layouts/             # Layout components
├── pages/               # Page components
├── types/               # TypeScript type definitions
├── App.tsx
├── main.tsx
└── index.css
```

## Key Features

### Authentication
- JWT-based authentication with automatic token refresh
- Protected routes with automatic redirects
- User registration and login

### Data Management
- Apollo Client for GraphQL data fetching
- Optimistic updates for better UX
- Automatic cache management
- Real-time data synchronization

### UI/UX
- Clean, modern design inspired by Monarch Money
- Dark sidebar with intuitive navigation
- Responsive grid layouts
- Loading states and error handling
- Toast notifications for user feedback

### Financial Features
- Multi-currency support
- Real-time balance calculations
- Transaction categorization
- Budget tracking with visual progress
- Spending insights and charts

## Configuration

### Environment Variables

Create a `.env` file in the root directory:

```env
VITE_GRAPHQL_URL=http://localhost:3001/graphql
```

### Tailwind Configuration

The project uses a custom Tailwind configuration with:
- Extended color palette for financial data
- Custom component styles
- Responsive breakpoints optimized for financial dashboards

## GraphQL Integration

The app connects to a Rails GraphQL API with queries for:
- User authentication and management
- Account and transaction data
- Category and budget management
- Dashboard summary data

## Development

### Code Style
- TypeScript strict mode enabled
- ESLint configuration for code quality
- Prettier for code formatting

### Component Guidelines
- All components use Tailwind CSS (no separate CSS files)
- TypeScript interfaces for all props
- Consistent naming conventions
- Reusable component library in `src/components/ui/`

### State Management
- Apollo Client for server state
- React hooks for local state
- Custom hooks for business logic
- Context providers for global state (auth, toasts)

## Deployment

### Docker
A Nginx configuration is included for containerized deployment:

```bash
docker build -t openfinance-web .
docker run -p 3000:3000 openfinance-web
```

### Production Considerations
- Environment-specific GraphQL endpoints
- Asset optimization and caching
- Error monitoring integration
- Analytics tracking

## API Integration

The frontend expects a GraphQL API with the following schema:

- `User` and `Household` types for authentication
- `Account` types for financial accounts
- `Transaction` types with categorization
- `Category` and `Tag` types for organization
- `BudgetItem` types for budgeting
- Dashboard summary queries

## Contributing

1. Follow the existing code style and structure
2. Add TypeScript types for all new features
3. Use the established component patterns
4. Test responsive design on multiple screen sizes
5. Ensure accessibility standards are met

## License

Private - OpenFinance Personal Finance Application