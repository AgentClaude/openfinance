import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ADJUST_BALANCE } from '@/graphql/mutations';
import { GET_ACCOUNTS } from '@/graphql/queries';
import Modal from '@/components/ui/Modal';
import Input from '@/components/ui/Input';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';
import { format } from 'date-fns';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  accountId: string;
  accountName: string;
  currentBalance: number;
}

const AdjustBalanceModal: React.FC<Props> = ({ isOpen, onClose, accountId, accountName, currentBalance }) => {
  const [amount, setAmount] = useState('');
  const [notes, setNotes] = useState('');
  const [adjustedAt, setAdjustedAt] = useState(format(new Date(), 'yyyy-MM-dd'));
  const { showToast } = useToast();

  const [adjustBalance, { loading }] = useMutation(ADJUST_BALANCE, {
    refetchQueries: [{ query: GET_ACCOUNTS }],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const parsedAmount = parseFloat(amount);
    if (isNaN(parsedAmount)) return;

    try {
      const { data } = await adjustBalance({
        variables: { accountId, amount: parsedAmount, adjustedAt, notes: notes || undefined },
      });
      if (data.adjustBalance.errors?.length > 0) {
        showToast(data.adjustBalance.errors[0], 'error');
      } else {
        showToast('Balance adjusted successfully', 'success');
        setAmount('');
        setNotes('');
        onClose();
      }
    } catch (err: any) {
      showToast(err.message, 'error');
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Adjust Balance — ${accountName}`}>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="text-sm text-gray-500 dark:text-gray-400">
          Current balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentBalance)}
        </div>

        <Input
          label="Adjustment Amount"
          type="number"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
          placeholder="e.g. 50.00 or -25.00"
          required
        />

        <Input
          label="Date"
          type="date"
          value={adjustedAt}
          onChange={(e) => setAdjustedAt(e.target.value)}
          required
        />

        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            className="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-brand-500"
            placeholder="Reason for adjustment..."
          />
        </div>

        {amount && !isNaN(parseFloat(amount)) && (
          <div className="text-sm font-medium text-gray-700 dark:text-gray-300">
            New balance: {new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(currentBalance + parseFloat(amount))}
          </div>
        )}

        <div className="flex justify-end space-x-3 pt-4">
          <Button type="button" variant="secondary" onClick={onClose}>Cancel</Button>
          <Button type="submit" loading={loading} disabled={!amount || isNaN(parseFloat(amount))}>
            Adjust Balance
          </Button>
        </div>
      </form>
    </Modal>
  );
};

export default AdjustBalanceModal;
