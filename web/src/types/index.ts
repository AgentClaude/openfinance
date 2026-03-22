export interface User {
  id: string;
  email: string;
  name: string;
  householdId: string;
  household?: Household;
  role?: string;
}

export interface Household {
  id: string;
  name: string;
  currency: string;
  timezone?: string;
  preferences?: Record<string, unknown>;
}

export interface Account {
  id: string;
  name: string;
  type: AccountType;
  subtype?: string;
  balance: number;
  balanceDate: string;
  mask?: string;
  officialName?: string;
  isActive: boolean;
  plaidAccountId?: string;
  householdId: string;
  currency?: string;
  createdAt?: string;
}

export enum AccountType {
  DEPOSITORY = 'DEPOSITORY',
  CREDIT = 'CREDIT',
  LOAN = 'LOAN',
  INVESTMENT = 'INVESTMENT',
  OTHER = 'OTHER'
}

export interface Transaction {
  id: string;
  amount: number;
  description: string;
  date: string;
  pending: boolean;
  needsReview: boolean;
  accountId: string;
  categoryId?: string;
  subcategoryId?: string;
  merchantName?: string;
  plaidTransactionId?: string;
  isSplit: boolean;
  isTransfer: boolean;
  excluded: boolean;
  parentTransactionId?: string;
  transferPairId?: string;
  hasReceipt?: boolean;
  receiptUrl?: string;
  notes?: string;
  account: Account;
  category?: Category;
  subcategory?: Category;
  tags: Tag[];
}

export interface TransferCandidate {
  outflowId: string;
  inflowId: string;
  amount: number;
  outflowAccount: string;
  inflowAccount: string;
  outflowDate: string;
  inflowDate: string;
  description?: string;
}

export interface Category {
  id: string;
  name: string;
  icon?: string;
  color?: string;
  groupName: string;
  isSystem: boolean;
  isHidden: boolean;
  displayOrder: number;
  householdId: string;
  parentId?: string;
  children?: Category[];
  transactionCount?: number;
}

export interface Tag {
  id: string;
  name: string;
  color?: string;
  colorHex?: string;
  isActive?: boolean;
  householdId: string;
  transactionsCount?: number;
}

export interface NotificationPreference {
  id: string;
  notificationType: string;
  channel: string;
  enabled: boolean;
}

export interface BudgetItem {
  id: string;
  categoryId: string;
  budgeted: number;
  spent: number;
  rollover: number;
  available: number;
  percentUsed: number;
  month: string;
  category: Category;
}

export interface BudgetCategoryGroup {
  name: string;
  budgeted: number;
  spent: number;
  items: BudgetItem[];
}

export interface BudgetSummary {
  month: string;
  totalBudgeted: number;
  totalSpent: number;
  totalIncome: number;
  incomeActual: number;
  leftToBudget: number;
  categoryGroups: BudgetCategoryGroup[];
  budgetMode: 'per_category' | 'flex';
  spendingTarget: number;
}

export interface BudgetSettings {
  budgetMode: 'per_category' | 'flex';
  spendingTarget: number;
}

export interface DashboardSummary {
  netWorth: number;
  netWorthChange: number;
  monthlyIncome: number;
  monthlyExpenses: number;
  cashFlow: number;
  spendingByCategory: CategorySpending[];
  recentTransactions: Transaction[];
  accountBalances: AccountBalance[];
  needsReviewCount: number;
}

export interface CategorySpending {
  categoryId: string;
  categoryName: string;
  amount: number;
  percentage: number;
  color?: string;
}

export interface AccountBalance {
  accountId: string;
  accountName: string;
  accountType: AccountType;
  balance: number;
}

export interface TransactionFilters {
  search?: string;
  categoryId?: string;
  accountId?: string;
  minAmount?: number;
  maxAmount?: number;
  dateFrom?: string;
  dateTo?: string;
  needsReview?: boolean;
  page?: number;
  limit?: number;
}

export interface PaginatedTransactions {
  transactions: Transaction[];
  totalCount: number;
  hasMore: boolean;
}

export interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface ToastType {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface ButtonProps {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  disabled?: boolean;
  type?: 'button' | 'submit' | 'reset';
  className?: string;
  children: React.ReactNode;
  onClick?: () => void;
}

export interface ColumnConfig<T> {
  key: string;
  label: string;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  width?: string;
  /** Column text alignment */
  align?: 'left' | 'center' | 'right';
  /** Additional CSS class for td cells */
  cellClassName?: string;
}
export interface Security {
  id: string;
  symbol: string;
  name: string;
  securityType?: string;
  currentPrice?: number;
}

export interface Holding {
  id: string;
  security: Security;
  quantity: number;
  currentPrice?: number;
  marketValue?: number;
  costBasis?: number;
  costBasisTotal: number;
  currentValue: number;
  unrealizedGainLoss: number;
  unrealizedGainLossPercentage: number;
  weightInAccount: number;
  asOfDate: string;
  currency: string;
}

export interface PortfolioAllocation {
  securityName: string;
  symbol: string;
  securityType?: string;
  value: number;
  percentage: number;
}

export interface PortfolioSummary {
  totalValue: number;
  totalCostBasis: number;
  totalGainLoss: number;
  totalGainLossPercentage: number;
  totalHoldingsCount: number;
  allocations: PortfolioAllocation[];
}

export interface InvestmentTransaction {
  id: string;
  accountId: string;
  security: Security;
  transactionType: string;
  amount: number;
  quantity?: number;
  price?: number;
  date: string;
  description?: string;
  currency: string;
}

export interface DividendBySecurity {
  symbol: string;
  name: string;
  amount: number;
}

export interface DividendByMonth {
  month: string;
  amount: number;
}

export interface DividendSummary {
  totalDividends: number;
  bySecurity: DividendBySecurity[];
  byMonth: DividendByMonth[];
  transactionCount: number;
}

export interface InvestmentIncomeSummary {
  totalIncome: number;
  dividends: number;
  interest: number;
  capitalGains: number;
}

export interface BalanceAdjustment {
  id: string;
  accountId: string;
  amount: number;
  currency: string;
  adjustedAt: string;
  notes?: string;
  createdByName?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  notificationType: string;
  priority: string;
  isRead: boolean;
  readAt?: string;
  data?: Record<string, unknown>;
  createdAt: string;
}

export interface HealthComponent {
  name: string;
  label: string;
  rawScore: number;
  weight: number;
  weightedScore: number;
  status: string;
  details: Record<string, number | string>;
}

export interface HealthRecommendation {
  type: string;
  category?: string;
  message: string;
}

export interface FinancialHealth {
  score: number;
  grade: string;
  components: HealthComponent[];
  recommendations: HealthRecommendation[];
}
