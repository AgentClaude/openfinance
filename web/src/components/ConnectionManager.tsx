import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { usePlaidLink } from 'react-plaid-link';
import {
  ArrowPathIcon,
  ExclamationTriangleIcon,
  CheckCircleIcon,
  XCircleIcon,
  LinkIcon,
  TrashIcon,
  ClockIcon,
} from '@heroicons/react/24/outline';
import { GET_ACCOUNT_CONNECTIONS } from '@/graphql/queries';
import {
  DISCONNECT_CONNECTION,
  RETRY_CONNECTION_SYNC,
  CREATE_UPDATE_LINK_TOKEN,
  SYNC_PLAID_CONNECTION,
} from '@/graphql/mutations';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import Badge from '@/components/ui/Badge';
import Modal from '@/components/ui/Modal';
import { useToast } from '@/components/ui/Toast';
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

const statusConfig: Record<string, { color: string; icon: React.ElementType; label: string }> = {
  active: { color: 'text-green-600', icon: CheckCircleIcon, label: 'Connected' },
  error: { color: 'text-red-600', icon: XCircleIcon, label: 'Error' },
  disconnected: { color: 'text-gray-400', icon: LinkIcon, label: 'Disconnected' },
  expired: { color: 'text-yellow-600', icon: ExclamationTriangleIcon, label: 'Expired' },
};

const ConnectionManager: React.FC = () => {
  const { data, loading, refetch } = useQuery(GET_ACCOUNT_CONNECTIONS);
  const [disconnectConnection] = useMutation(DISCONNECT_CONNECTION);
  const [retrySync] = useMutation(RETRY_CONNECTION_SYNC);
  const [createUpdateLinkToken] = useMutation(CREATE_UPDATE_LINK_TOKEN);
  const { addToast } = useToast();

  const [syncPlaidConnection] = useMutation(SYNC_PLAID_CONNECTION);
  const [confirmDisconnect, setConfirmDisconnect] = useState<string | null>(null);
  const [updateLinkToken, setUpdateLinkToken] = useState<string | null>(null);
  const [updatingConnectionId, setUpdatingConnectionId] = useState<string | null>(null);
  const [syncingConnectionId, setSyncingConnectionId] = useState<string | null>(null);

  // Plaid Link for update mode
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
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to reconnect' });
      setUpdatingConnectionId(null);
    }
  };

  const handleRetrySync = async (connectionId: string, provider: string) => {
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
    } catch (err: any) {
      addToast({ type: 'error', title: 'Error', message: err.message || 'Failed to disconnect' });
    }
  };

  const connections: AccountConnection[] = data?.accountConnections || [];

  if (loading || connections.length === 0) return null;

  const hasIssues = connections.some(c => c.status !== 'active' || c.consentExpiresSoon);

  return (
    <div className="mb-8">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Bank Connections
        </h2>
        {hasIssues && (
          <Badge variant="warning" size="sm">
            <ExclamationTriangleIcon className="h-3.5 w-3.5 mr-1" />
            Needs attention
          </Badge>
        )}
      </div>

      <div className="space-y-3">
        {connections.map(conn => {
          const config = statusConfig[conn.status] || statusConfig.error;
          const StatusIcon = config.icon;

          return (
            <Card key={conn.id} className={clsx(
              'transition-all',
              conn.needsReauth && 'ring-2 ring-red-200 dark:ring-red-800',
              conn.consentExpiresSoon && !conn.needsReauth && 'ring-2 ring-yellow-200 dark:ring-yellow-800'
            )}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  {/* Institution logo */}
                  {conn.institutionLogoUrl ? (
                    <img
                      src={conn.institutionLogoUrl}
                      alt={conn.institutionName}
                      className="h-10 w-10 rounded-lg object-contain bg-gray-50 dark:bg-gray-800 p-1"
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-lg bg-gray-100 dark:bg-gray-800 flex items-center justify-center">
                      <LinkIcon className="h-5 w-5 text-gray-400" />
                    </div>
                  )}

                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-medium text-gray-900 dark:text-gray-100">
                        {conn.institutionName}
                      </h3>
                      <StatusIcon className={clsx('h-4 w-4', config.color)} />
                    </div>

                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400">
                      <span>{conn.accountCount} account{conn.accountCount !== 1 ? 's' : ''}</span>
                      {conn.lastSyncedAt && (
                        <span className="flex items-center gap-1">
                          <ClockIcon className="h-3.5 w-3.5" />
                          Synced {formatDistanceToNow(new Date(conn.lastSyncedAt), { addSuffix: true })}
                        </span>
                      )}
                      {conn.syncInProgress && (
                        <span className="flex items-center gap-1 text-brand-600">
                          <ArrowPathIcon className="h-3.5 w-3.5 animate-spin" />
                          Syncing...
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {/* Error/warning banner */}
                  {conn.needsReauth && (
                    <Button size="sm" variant="danger" onClick={() => handleReconnect(conn.id)}
                      disabled={updatingConnectionId === conn.id}>
                      {updatingConnectionId === conn.id ? 'Connecting...' : 'Reconnect'}
                    </Button>
                  )}

                  {conn.consentExpiresSoon && !conn.needsReauth && (
                    <Button size="sm" variant="secondary" onClick={() => handleReconnect(conn.id)}
                      disabled={updatingConnectionId === conn.id}>
                      Renew
                    </Button>
                  )}

                  {conn.status === 'active' && !conn.syncInProgress && syncingConnectionId !== conn.id && (
                    <button
                      onClick={() => handleRetrySync(conn.id, conn.provider)}
                      className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-400 hover:text-gray-600"
                      title="Sync now"
                    >
                      <ArrowPathIcon className="h-4 w-4" />
                    </button>
                  )}

                  {syncingConnectionId === conn.id && (
                    <span className="flex items-center gap-1.5 text-sm text-brand-600">
                      <ArrowPathIcon className="h-4 w-4 animate-spin" />
                      Syncing...
                    </span>
                  )}

                  {conn.status === 'error' && !conn.needsReauth && (
                    <Button size="sm" variant="secondary" onClick={() => handleRetrySync(conn.id, conn.provider)}
                      disabled={syncingConnectionId === conn.id}>
                      <ArrowPathIcon className="h-3.5 w-3.5 mr-1" />
                      Retry
                    </Button>
                  )}

                  <button
                    onClick={() => setConfirmDisconnect(conn.id)}
                    className="p-1.5 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500"
                    title="Disconnect"
                  >
                    <TrashIcon className="h-4 w-4" />
                  </button>
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

export default ConnectionManager;
