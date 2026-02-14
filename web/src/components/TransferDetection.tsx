import React, { useState } from 'react';
import { useMutation } from '@apollo/client';
import { ArrowsRightLeftIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import { DETECT_TRANSFERS, LINK_TRANSFER } from '@/graphql/mutations';
import { TransferCandidate } from '@/types';
import Card from '@/components/ui/Card';
import Button from '@/components/ui/Button';
import AmountDisplay from '@/components/ui/AmountDisplay';
import { format } from 'date-fns';

interface TransferDetectionProps {
  onLinked?: () => void;
}

const TransferDetection: React.FC<TransferDetectionProps> = ({ onLinked }) => {
  const [candidates, setCandidates] = useState<TransferCandidate[]>([]);
  const [detected, setDetected] = useState(false);
  const [linkedPairs, setLinkedPairs] = useState<Set<string>>(new Set());

  const [detectTransfers, { loading: detecting }] = useMutation(DETECT_TRANSFERS, {
    onCompleted: (data) => {
      setCandidates(data.detectTransfers.candidates);
      setDetected(true);
    },
  });

  const [linkTransfer, { loading: linking }] = useMutation(LINK_TRANSFER);

  const handleLink = async (candidate: TransferCandidate) => {
    try {
      const { data } = await linkTransfer({
        variables: {
          transactionAId: candidate.outflowId,
          transactionBId: candidate.inflowId,
        },
      });
      if (!data?.linkTransfer?.errors?.length) {
        const key = `${candidate.outflowId}-${candidate.inflowId}`;
        setLinkedPairs(prev => new Set(prev).add(key));
        onLinked?.();
      }
    } catch (e) {
      console.error('Failed to link transfer:', e);
    }
  };

  const pairKey = (c: TransferCandidate) => `${c.outflowId}-${c.inflowId}`;

  return (
    <Card className="mb-6">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <ArrowsRightLeftIcon className="h-5 w-5 text-indigo-600" />
          <h3 className="text-sm font-semibold text-gray-900">Possible Transfers</h3>
        </div>
        <Button
          variant="secondary"
          size="sm"
          onClick={() => detectTransfers()}
          loading={detecting}
        >
          {detected ? 'Refresh' : 'Detect Transfers'}
        </Button>
      </div>

      {detected && candidates.length === 0 && (
        <p className="text-sm text-gray-500">No transfer candidates found.</p>
      )}

      {candidates.length > 0 && (
        <div className="space-y-2">
          {candidates.map((c) => {
            const isLinked = linkedPairs.has(pairKey(c));
            return (
              <div
                key={pairKey(c)}
                className={`flex items-center justify-between p-3 rounded-lg border ${
                  isLinked ? 'bg-green-50 border-green-200' : 'bg-gray-50 border-gray-200'
                }`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 text-sm">
                    <span className="font-medium text-gray-900">{c.outflowAccount}</span>
                    <span className="text-gray-400">→</span>
                    <span className="font-medium text-gray-900">{c.inflowAccount}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-1 text-xs text-gray-500">
                    <AmountDisplay amount={c.amount} size="sm" />
                    <span>{format(new Date(c.outflowDate), 'MMM d')} → {format(new Date(c.inflowDate), 'MMM d')}</span>
                    {c.description && <span className="truncate">{c.description}</span>}
                  </div>
                </div>
                {isLinked ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-600 flex-shrink-0" />
                ) : (
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => handleLink(c)}
                    loading={linking}
                  >
                    Link
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      )}
    </Card>
  );
};

export default TransferDetection;
