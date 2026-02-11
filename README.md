# OpenFinance

A privacy-first, open-source personal finance application built with Rails 8 and React. Track expenses, manage budgets, and gain financial insights - all while maintaining complete control over your data.

## Features

- 🏦 **Account Aggregation** - Connect bank accounts via Plaid or add manually
- 💰 **Transaction Management** - Automatic categorization with custom rules
- 📊 **Budgeting** - Category-based budgeting with spending insights
- 📈 **Dashboard** - Net worth tracking and spending analysis
- 👥 **Household Sharing** - Multi-user support for families
- 🔒 **Privacy-First** - Self-hosted, your data stays with you
- 📱 **Responsive** - Works on desktop and mobile devices

## Tech Stack

### Backend (Rails API)
- **Rails 8** (API mode) with PostgreSQL
- **GraphQL** API with graphql-ruby
- **Authentication** via Devise + JWT tokens
- **Background Jobs** with Sidekiq
- **Plaid Integration** for bank connectivity

### Frontend (React)
- **React 18** with TypeScript and Vite
- **Apollo Client** for GraphQL
- **TailwindCSS** for styling
- **Recharts** for data visualization

### Infrastructure
- **Docker** containers for easy deployment
- **PostgreSQL 16** database
- **Redis** for caching and job queues

## Quick Start

### Prerequisites
- Docker and Docker Compose
- Plaid developer account (optional, for bank connectivity)

### Setup

1. **Clone and configure**
   ```bash
   git clone <repository-url>
   cd openfinance
   cp .env.example .env
   ```

2. **Configure environment** (edit `.env`):
   ```bash
   # Database
   DATABASE_URL=postgres://openfinance:password@db:5432/openfinance_production
   
   # Rails
   RAILS_MASTER_KEY=your_master_key_here
   
   # JWT
   JWT_SECRET_KEY=your_jwt_secret_here
   
   # Plaid (Optional - for bank connectivity)
   PLAID_CLIENT_ID=your_plaid_client_id
   PLAID_SECRET=your_plaid_secret
   PLAID_ENVIRONMENT=sandbox  # or development/production
   ```

3. **Start the application**
   ```bash
   docker-compose up -d
   ```

4. **Initialize the database**
   ```bash
   docker-compose exec api rails db:create db:migrate db:seed
   ```

5. **Access the application**
   - Frontend: http://localhost:3000
   - GraphQL Playground: http://localhost:3001/graphiql

## Development

### Local Development Setup

1. **Backend (Rails API)**
   ```bash
   cd api
   bundle install
   rails db:create db:migrate db:seed
   rails server -p 3001
   ```

2. **Frontend (React)**
   ```bash
   cd web
   npm install
   npm run dev
   ```

3. **Background Jobs**
   ```bash
   cd api
   bundle exec sidekiq
   ```

### Running Tests
```bash
# Rails API tests
cd api && bundle exec rspec

# React frontend tests
cd web && npm test
```

### Database Schema

The application uses a comprehensive schema designed for financial data:

- **Users & Households** - Multi-user support with role-based access
- **Account Connections** - Secure integration with financial institutions
- **Accounts** - Bank accounts, credit cards, investments, manual accounts
- **Transactions** - All financial transactions with categorization
- **Categories** - System and user-defined expense categories
- **Tags** - Flexible tagging system for transactions
- **Budgets** - Category-based budgeting with tracking

## Configuration

### Plaid Integration

OpenFinance supports Plaid for automatic bank connectivity:

1. Sign up for a [Plaid developer account](https://dashboard.plaid.com/)
2. Get your `client_id` and `secret`
3. Add them to your `.env` file
4. Restart the application

The app works perfectly without Plaid using manual account entry.

### Email Configuration

Configure SMTP for email notifications:

```env
SMTP_ADDRESS=your.smtp.server.com
SMTP_PORT=587
SMTP_USERNAME=your_username
SMTP_PASSWORD=your_password
SMTP_DOMAIN=yourdomain.com
```

## Security

- **JWT Authentication** with secure token rotation
- **Data Encryption** for sensitive information
- **Read-only** bank access via Plaid
- **HTTPS** enforced in production
- **Regular security updates** with dependabot

## Contributing

We welcome contributions! Please see [CONTRIBUTING.md](CONTRIBUTING.md) for guidelines.

## License

This project is licensed under the MIT License - see [LICENSE](LICENSE) for details.

## Support

- **Documentation**: [docs.openfinance.dev](https://docs.openfinance.dev)
- **Issues**: [GitHub Issues](https://github.com/openfinance/openfinance/issues)
- **Discussions**: [GitHub Discussions](https://github.com/openfinance/openfinance/discussions)

---

**Built with ❤️ by the OpenFinance community**