import React, { useRef } from 'react';
import { useMutation } from '@apollo/client';
import { UPLOAD_RECEIPT } from '@/graphql/mutations';
import { PaperClipIcon, CheckCircleIcon } from '@heroicons/react/24/outline';
import Button from '@/components/ui/Button';
import { useToast } from '@/components/ui/Toast';

interface Props {
  transactionId: string;
  hasReceipt?: boolean;
  receiptUrl?: string;
  onUploaded?: () => void;
}

const ReceiptUploadButton: React.FC<Props> = ({ transactionId, hasReceipt, receiptUrl, onUploaded }) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const { showToast } = useToast();
  const [uploadReceipt, { loading }] = useMutation(UPLOAD_RECEIPT);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      const base64 = (reader.result as string).split(',')[1];
      try {
        const { data } = await uploadReceipt({
          variables: {
            transactionId,
            fileData: base64,
            filename: file.name,
            contentType: file.type,
          },
        });
        if (data.uploadReceipt.errors?.length > 0) {
          showToast(data.uploadReceipt.errors[0], 'error');
        } else {
          showToast('Receipt uploaded', 'success');
          onUploaded?.();
        }
      } catch (err: any) {
        showToast(err.message, 'error');
      }
    };
    reader.readAsDataURL(file);
  };

  return (
    <div className="inline-flex items-center gap-2">
      <input
        ref={fileRef}
        type="file"
        accept="image/*,application/pdf"
        className="hidden"
        onChange={handleFileChange}
      />
      {hasReceipt ? (
        <button
          onClick={() => receiptUrl && window.open(receiptUrl, '_blank')}
          className="inline-flex items-center gap-1 text-xs text-green-600 hover:text-green-700"
          title="View receipt"
        >
          <CheckCircleIcon className="h-4 w-4" />
          Receipt
        </button>
      ) : (
        <Button
          variant="secondary"
          size="sm"
          onClick={() => fileRef.current?.click()}
          loading={loading}
        >
          <PaperClipIcon className="h-3 w-3 mr-1" />
          Receipt
        </Button>
      )}
    </div>
  );
};

export default ReceiptUploadButton;
