import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { usePlaidLink, PlaidLinkOnSuccessMetadata } from 'react-plaid-link';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  TrashIcon,
  ClockIcon,
  PlusIcon,
  BuildingLibraryIcon,
} from '@heroicons/react/24/outline';
import { GET_ACCOUNT_CONNECTIONS } from '@/graphql/queries';
import {
  DISCONNECT_CONNECTION,
  RETRY_CONNECTION_SYNC,
  CREATE_UPDATE_LINK_TOKEN,
  SYNC_PLAID_CONNECTION,
  CREATE_PLAID_LINK_TOKEN,
  EXCHANGE_PLAID_TOKEN,
} from '@/graphql/mutations';
import PageHeader from '@/components/ui/PageHeader';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import LoadingSpinner from '@/components/ui/LoadingSpinner';
import EmptyState from '@/components/ui/EmptyState';
import { useToast } from '@/components/ui/Toast';
import { usePageTitle } from '@/hooks/usePageTitle';
import { formatDistanceToNow, format } from 'date-fns';
import clsx from 'clsx';

interface AccountConnection {
  id: string;
  provider: string;
  status: string;
  institutionName: string;
  institutionLogoUrl: string | null;
  errorCode: string | null;
  errorMessage: string | null;
  errorDisplayMessage: string | null;
  lastSyncedAt: string | null;
  consentExpiresAt: string | null;
  consentExpiresSoon: boolean;
  accountCount: number;
  totalBalance: number;
  needsReauth: boolean;
  syncInProgress: boolean;
  createdAt: string;
  accounts: Array<{
    id: string;
    name: string;
    type: string;
    balance: number;
    mask: string | null;
  }>;
}

const statusConfig: Record<string, { color: string; badgeVariant: 'success' | 'danger' | 'secondary' | 'warning'; icon: React.ElementType; label: string }> = {
  active: { color: 'text-green-600', badgeVariant: 'success', icon: CheckCircleIcon, label: 'Active' },
  error: { color: 'text-red-600', badgeVariant: 'danger', icon: XCircleIcon, label: 'Error' },
  disconnected: { color: 'text-gray-400', badgeVariant: 'secondary', icon: LinkIcon, label: 'Disconnected' },
  expired: { color: 'text-yellow-600', badgeVariant: 'warning', icon: ExclamationTriangleIcon, label: 'Expired' },
};

const ConnectionsPage: React.FC = () => {
  usePageTitle('Bank Connections');
  const { data, loading, refetch } = useQuery(GET_ACCOUNT_CONNECTIONS);
  const [disconnectConnection] = useMutation(DISCONNECT_CONNECTION);
  const [retrySync] = useMutation(RETRY_CONNECTION_SYNC);
  const [createUpdateLinkToken] = useMutation(CREATE_UPDATE_LINK_TOKEN);
  const [syncPlaidConnection] = useMutation(SYNC_PLAID_CONNECTION);
  const [createPlaidLinkToken] = useMutation(CREATE_PLAID_LINK_TOKEN);
  const [exchangePlaidToken] = useMutation(EXCHANGE_PLAID_TOKEN);
  const { addToast } = useToast();

  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [updateLinkToken, setUpdateLinkToken] = useState<string | null>(null);
  const [updatingConnectionId, setUpdatingConnectionId] = useState<string | null>(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);
  const [newLinkToken, setNewLinkToken] = useState<string | null>(null);
  const [connectLoading, setConnectLoading] = useState(false);

  // Plaid Link for update/reconnect mode
  const onUpdateSuccess = useCallback(async () => {
    addToast({ type: 'success', title: 'Reconnected', message: 'Bank connection has been restored!' });
    setUpdateLinkToken(null);
    setUpdatingConnectionId(null);
    refetch();
  }, [addToast, refetch]);

  const { open: openPlaidUpdate, ready: plaidUpdateReady } = usePlaidLink({
    token: updateLinkToken,
    onSuccess: onUpdateSuccess,
    onExit: () => {
      setUpdateLinkToken(null);
      setUpdatingConnectionId(null);
    },
  });

  React.useEffect(() => {
    if (updateLinkToken && plaidUpdateReady) {
      openPlaidUpdate();
    }
  }, [updateLinkToken, plaidUpdateReady, openPlaidUpdate]);

  // Plaid Link for new connections
  const onNewConnectionSuccess = useCallback(async (publicToken: string, metadata: PlaidLinkOnSuccessMetadata) => {
    try {
      const result = await exchangePlaidToken({ variables: { publicToken, metadata } });
      const accounts = result.data?.exchangePlaidToken;
      const count = Array.isArray(accounts) ? accounts.length : 1;
      addToast({ type: 'success', title: 'Connected!', message: `Successfully connected ${count} account${count !== 1 ? 's' : ''}` });
      setNewLinkToken(null);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to connect';
      addToast({ type: 'error', title: 'Error', message });
    }
  }, [exchangePlaidToken, addToast, refetch]);

  const { open: openNewPlaidLink, ready: newPlaidReady } = usePlaidLink({
    token: newLinkToken,
    onSuccess: onNewConnectionSuccess,
    onExit: () => setNewLinkToken(null),
  });

  React.useEffect(() => {
    if (newLinkToken && newPlaidReady) {
      openNewPlaidLink();
    }
  }, [newLinkToken, newPlaidReady, openNewPlaidLink]);

  const handleConnectNew = async () => {
    try {
      setConnectLoading(true);
      const result = await createPlaidLinkToken();
      const token = result.data?.createPlaidLinkToken?.linkToken;
      if (token) {
        setNewLinkToken(token);
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Failed to initialize bank connection' });
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to start bank connection';
      addToast({ type: 'error', title: 'Error', message });
    } finally {
      setConnectLoading(false);
    }
  };

  const handleReconnect = async (connectionId: string) => {
    try {
      setUpdatingConnectionId(connectionId);
      const result = await createUpdateLinkToken({ variables: { connectionId } });
      const token = result.data?.createUpdateLinkToken?.linkToken;
      if (token) {
        setUpdateLinkToken(token);
      } else {
        addToast({ type: 'error', title: 'Error', message: 'Failed to start reconnection' });
        setUpdatingConnectionId(null);
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to reconnect';
      addToast({ type: 'error', title: 'Error', message });
      setUpdatingConnectionId(null);
    }
  };

  const handleSync = async (connectionId: string, provider: string) => {
    try {
      if (provider === 'plaid') {
        setSyncingConnectionId(connectionId);
        const result = await syncPlaidConnection({ variables: { connectionId } });
        const syncData = result.data?.syncPlaidConnection;
        if (syncData?.success) {
          const added = syncData.addedCount || 0;
          const modified = syncData.modifiedCount || 0;
          const message = added > 0
            ? `Synced ${added} new transaction${added !== 1 ? 's' : ''}${modified > 0 ? ` and updated ${modified}` : ''}`
            : 'Sync complete — no new transactions';
          addToast({ type: 'success', title: 'Sync complete', message });
        } else {
          addToast({ type: 'error', title: 'Sync failed', message: syncData?.errorMessage || 'Failed to sync' });
        }
        setSyncingConnectionId(null);
        refetch();
      } else {
        await retrySync({ variables: { connectionId } });
        addToast({ type: 'success', title: 'Sync started', message: 'Transaction sync has been triggered.' });
        refetch();
      }
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to sync';
      addToast({ type: 'error', title: 'Error', message });
      setSyncingConnectionId(null);
    }
  };

  const handleDisconnect = async (connectionId: string) => {
    try {
      await disconnectConnection({ variables: { connectionId } });
      addToast({ type: 'info', title: 'Disconnected', message: 'Bank connection has been removed.' });
      setConfirmDisconnect(null);
      refetch();
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : 'Failed to disconnect';
      addToast({ type: 'error', title: 'Error', message });
    }
  };

  const connections: AccountConnection[] = data?.accountConnections || [];

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  const formatBalance = (amount: number) =>
    new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);

  return (
    <div>
      <PageHeader
        title="Bank Connections"
        subtitle="Manage your linked bank accounts and sync settings"
        actions={
          <Button onClick={handleConnectNew} disabled={connectLoading}>
            <PlusIcon className="h-4 w-4 mr-2" />
            {connectLoading ? 'Connecting...' : 'Connect New Bank'}
          </Button>
        }
      />

      {connections.length === 0 ? (
        <EmptyState
          icon={<BuildingLibraryIcon className="h-12 w-12" />}
          title="No bank connections"
          description="Connect your bank to automatically import accounts and sync transactions."
          actionLabel="Connect Bank"
          onAction={handleConnectNew}
        />
      ) : (
        <div className="space-y-4">
          {connections.map(conn => {
            const config = statusConfig[conn.status] || statusConfig.error;
            const StatusIcon = config.icon;
            const isSyncing = syncingConnectionId === conn.id || conn.syncInProgress;

            return (
              <Card
                key={conn.id}
                className={clsx(
                  'transition-all',
                  conn.needsReauth && 'ring-2 ring-red-200 dark:ring-red-800',
                  conn.consentExpiresSoon && !conn.needsReauth && 'ring-2 ring-yellow-200 dark:ring-yellow-800'
                )}
              >
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  {/* Left: Institution info */}
                  <div className="flex items-center gap-4">
                    {conn.institutionLogoUrl ? (
                      <img
                        src={conn.institutionLogoUrl}
                        alt={conn.institutionName}
                        className="h-12 w-12 rounded-xl object-contain bg-gray-50 dark:bg-gray-800 p-1.5"
                      />
                    ) : (
                      <div className="h-12 w-12 rounded-xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                        <BuildingLibraryIcon className="h-6 w-6 text-gray-400" />
                      </div>
                    )}

                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">
                          {conn.institutionName}
                        </h3>
                        <Badge variant={config.badgeVariant} size="sm">
                          <StatusIcon className="h-3 w-3 mr-1" />
                          {config.label}
                        </Badge>
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-gray-500 dark:text-gray-400">
                        <span>{conn.accountCount} account{conn.accountCount !== 1 ? 's' : ''}</span>
                        <span className="font-medium text-gray-700 dark:text-gray-300">
                          {formatBalance(conn.totalBalance)}
                        </span>
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          {conn.lastSyncedAt
                            ? `Synced ${formatDistanceToNow(new Date(conn.lastSyncedAt), { addSuffix: true })}`
                            : 'Never synced'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Right: Actions */}
                  <div className="flex items-center gap-2 sm:flex-shrink-0">
                    {conn.needsReauth && (
                      <Button
                        size="sm"
                        variant="danger"
                        onClick={() => handleReconnect(conn.id)}
                        disabled={updatingConnectionId === conn.id}
                      >
                        {updatingConnectionId === conn.id ? 'Connecting...' : 'Reconnect'}
                      </Button>
                    )}

                    {conn.consentExpiresSoon && !conn.needsReauth && (
                      <Button
                        size="sm"
                        variant="secondary"
                        onClick={() => handleReconnect(conn.id)}
                        disabled={updatingConnectionId === conn.id}
                      >
                        Renew
                      </Button>
                    )}

                    {isSyncing ? (
                      <span className="flex items-center gap-1.5 text-sm text-brand-600">
                        <ArrowPathIcon className="h-4 w-4 animate-spin" />
                        Syncing...
                      </span>
                    ) : (
                      <>
                        {conn.status === 'active' && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSync(conn.id, conn.provider)}
                          >
                            <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                            Sync Now
                          </Button>
                        )}
                        {conn.status === 'error' && !conn.needsReauth && (
                          <Button
                            size="sm"
                            variant="secondary"
                            onClick={() => handleSync(conn.id, conn.provider)}
                          >
                            <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                            Retry
                          </Button>
                        )}
                      </>
                    )}

                    <Button
                      size="sm"
                      variant="secondary"
                      onClick={() => setConfirmDisconnect(conn.id)}
                    >
                      <TrashIcon className="h-3.5 w-3.5 mr-1" />
                      Disconnect
                    </Button>
                  </div>
                </div>

                {/* Error message */}
                {conn.errorDisplayMessage && (
                  <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/20 rounded-lg text-sm text-red-700 dark:text-red-300 flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    {conn.errorDisplayMessage}
                  </div>
                )}

                {/* Consent expiring warning */}
                {conn.consentExpiresSoon && !conn.needsReauth && conn.consentExpiresAt && (
                  <div className="mt-3 p-3 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg text-sm text-yellow-700 dark:text-yellow-300 flex items-start gap-2">
                    <ExclamationTriangleIcon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                    Connection expires {format(new Date(conn.consentExpiresAt), 'MMM d, yyyy')}. Please renew to continue syncing.
                  </div>
                )}
              </Card>
            );
          })}
        </div>
      )}

      {/* Disconnect confirmation modal */}
      <Modal
        isOpen={!!confirmDisconnect}
        onClose={() => setConfirmDisconnect(null)}
        title="Disconnect Bank?"
        size="sm"
      >
        <p className="text-gray-600 dark:text-gray-400 mb-6">
          This will stop syncing transactions from this bank. Your existing transactions will be kept.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="secondary" onClick={() => setConfirmDisconnect(null)}>
            Cancel
          </Button>
          <Button variant="danger" onClick={() => confirmDisconnect && handleDisconnect(confirmDisconnect)}>
            Disconnect
          </Button>
        </div>
      </Modal>
    </div>
  );
};

export default ConnectionsPage;
