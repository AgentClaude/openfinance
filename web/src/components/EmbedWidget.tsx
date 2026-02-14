import React, { useEffect, useState } from 'react';

interface NetWorthData {
  net_worth: number;
  assets: number;
  liabilities: number;
  updated_at: string;
}

interface SpendingData {
  month: string;
  total_spent: number;
  transaction_count: number;
  updated_at: string;
}

interface EmbedWidgetProps {
  /** Share token for public access */
  token: string;
  /** Widget type: 'net_worth' or 'spending' */
  type?: 'net_worth' | 'spending';
  /** API base URL (defaults to current origin) */
  apiUrl?: string;
  /** Theme: 'light' or 'dark' */
  theme?: 'light' | 'dark';
}

const formatCurrency = (amount: number): string =>
  new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

const EmbedWidget: React.FC<EmbedWidgetProps> = ({
  token,
  type = 'net_worth',
  apiUrl = '',
  theme = 'light',
}) => {
  const [netWorth, setNetWorth] = useState<NetWorthData | null>(null);
  const [spending, setSpending] = useState<SpendingData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const endpoint = type === 'net_worth' ? 'net_worth' : 'spending';
    fetch(`${apiUrl}/api/v1/embed/${endpoint}?token=${encodeURIComponent(token)}`)
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load widget data');
        return res.json();
      })
      .then((data) => {
        if (type === 'net_worth') setNetWorth(data);
        else setSpending(data);
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false));
  }, [token, type, apiUrl]);

  const isDark = theme === 'dark';
  const styles: Record<string, React.CSSProperties> = {
    container: {
      fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif",
      background: isDark ? '#1a1a2e' : '#ffffff',
      color: isDark ? '#e2e8f0' : '#1a1a2e',
      border: `1px solid ${isDark ? '#2d3748' : '#e2e8f0'}`,
      borderRadius: '12px',
      padding: '24px',
      maxWidth: '360px',
      boxShadow: '0 1px 3px rgba(0,0,0,0.1)',
    },
    title: {
      fontSize: '0.85rem',
      fontWeight: 600,
      textTransform: 'uppercase' as const,
      letterSpacing: '0.05em',
      color: isDark ? '#94a3b8' : '#64748b',
      marginBottom: '8px',
    },
    amount: {
      fontSize: '2rem',
      fontWeight: 700,
      marginBottom: '12px',
    },
    row: {
      display: 'flex',
      justifyContent: 'space-between',
      fontSize: '0.9rem',
      padding: '4px 0',
      color: isDark ? '#cbd5e1' : '#475569',
    },
    positive: { color: '#10b981' },
    negative: { color: '#ef4444' },
    footer: {
      marginTop: '12px',
      fontSize: '0.75rem',
      color: isDark ? '#64748b' : '#94a3b8',
    },
  };

  if (loading) return <div style={styles.container}>Loading...</div>;
  if (error) return <div style={styles.container}>Error: {error}</div>;

  if (type === 'net_worth' && netWorth) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Net Worth</div>
        <div style={styles.amount}>{formatCurrency(netWorth.net_worth)}</div>
        <div style={styles.row}>
          <span>Assets</span>
          <span style={styles.positive}>{formatCurrency(netWorth.assets)}</span>
        </div>
        <div style={styles.row}>
          <span>Liabilities</span>
          <span style={styles.negative}>{formatCurrency(netWorth.liabilities)}</span>
        </div>
        <div style={styles.footer}>
          Powered by OpenFinance
        </div>
      </div>
    );
  }

  if (type === 'spending' && spending) {
    return (
      <div style={styles.container}>
        <div style={styles.title}>Monthly Spending</div>
        <div style={styles.amount}>{formatCurrency(spending.total_spent)}</div>
        <div style={styles.row}>
          <span>Month</span>
          <span>{spending.month}</span>
        </div>
        <div style={styles.row}>
          <span>Transactions</span>
          <span>{spending.transaction_count}</span>
        </div>
        <div style={styles.footer}>
          Powered by OpenFinance
        </div>
      </div>
    );
  }

  return <div style={styles.container}>No data available</div>;
};

export default EmbedWidget;
