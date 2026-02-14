import { useState } from 'react';
import { useMutation, gql } from '@apollo/client';
import Modal from '@/components/ui/Modal';
import Button from '@/components/ui/Button';

const SHARE_ACCOUNT = gql`
  mutation ShareAccount($accountId: ID!, $email: String!, $permissionLevel: String) {
    shareAccount(accountId: $accountId, email: $email, permissionLevel: $permissionLevel) {
      sharedAccount {
        id
        permissionLevel
        sharedWithUser { id name email }
      }
      errors
    }
  }
`;

interface ShareAccountModalProps {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
}

export default function ShareAccountModal({ isOpen, onClose, accountId, accountName }: ShareAccountModalProps) {
  const [email, setEmail] = useState('');
  const [permission, setPermission] = useState('view');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [shareAccount, { loading }] = useMutation(SHARE_ACCOUNT, {
    onCompleted: (data) => {
      if (data.shareAccount.errors.length > 0) {
        setError(data.shareAccount.errors.join(', '));
      } else {
        setSuccess(`Account shared with ${data.shareAccount.sharedAccount.sharedWithUser.email}`);
        setEmail('');
        setTimeout(() => { setSuccess(''); onClose(); }, 2000);
      }
    },
    onError: (err) => setError(err.message),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');
    shareAccount({ variables: { accountId, email, permissionLevel: permission } });
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Share "${accountName}"`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Email address
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="user@example.com"
            required
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Permission level
          </label>
          <select
            value={permission}
            onChange={(e) => setPermission(e.target.value)}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm"
          >
            <option value="view">View only</option>
            <option value="edit">Can edit</option>
            <option value="admin">Admin</option>
          </select>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        {success && <p className="text-sm text-green-500">{success}</p>}
        <div className="flex justify-end gap-2">
          <Button variant="secondary" onClick={onClose} type="button">Cancel</Button>
          <Button type="submit" disabled={loading}>
            {loading ? 'Sharing…' : 'Share'}
          </Button>
        </div>
      </form>
    </Modal>
  );
}
