import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import {
  ArrowUpTrayIcon,
  DocumentTextIcon,
  CheckCircleIcon,
  ExclamationTriangleIcon,
  BanknotesIcon,
  TableCellsIcon,
} from '@heroicons/react/24/outline';
import { IMPORT_CSV, IMPORT_OFX, PREVIEW_OFX } from '@/graphql/mutations';
import { useAccounts } from '@/hooks/useAccounts';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

type ImportFormat = 'csv' | 'ofx';

interface CsvPreview {
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
}

interface OfxPreview {
  transactions: Array<{
    date: string;
    amount: number;
    name: string;
    memo?: string;
    type?: string;
  }>;
  totalCount: number;
  account: { bank_id?: string; account_id?: string; type?: string } | null;
  balance: { amount?: number; as_of?: string } | null;
  dateRange: { start?: string; end?: string } | null;
  isCreditCard: boolean;
}

interface ImportResult {
  imported: number;
  skipped: number;
  errors: string[];
  accountInfo?: Record<string, string> | null;
  balance?: { amount?: number; as_of?: string } | null;
  dateRange?: { start?: string; end?: string } | null;
}

const FORMAT_TABS: { id: ImportFormat; label: string; icon: React.ElementType; accept: string; description: string }[] = [
  { id: 'csv', label: 'CSV', icon: TableCellsIcon, accept: '.csv', description: 'Comma-separated values from Mint, banks, or spreadsheets' },
  { id: 'ofx', label: 'OFX / QFX', icon: BanknotesIcon, accept: '.ofx,.qfx', description: 'Bank statement files (OFX v1/v2, Quicken QFX)' },
];

const ImportPage: React.FC = () => {
  const { accounts } = useAccounts();
  const [format, setFormat] = useState<ImportFormat>('csv');
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [fileContent, setFileContent] = useState('');
  const [updateBalance, setUpdateBalance] = useState(false);

  // CSV state
  const [csvPreview, setCsvPreview] = useState<CsvPreview | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});

  // OFX state
  const [ofxPreview, setOfxPreview] = useState<OfxPreview | null>(null);
  const [ofxPreviewError, setOfxPreviewError] = useState<string | null>(null);

  const [result, setResult] = useState<ImportResult | null>(null);

  const [importCsv, { loading: csvLoading }] = useMutation(IMPORT_CSV);
  const [importOfx, { loading: ofxLoading }] = useMutation(IMPORT_OFX);
  const [previewOfx, { loading: previewLoading }] = useMutation(PREVIEW_OFX);

  const loading = csvLoading || ofxLoading;

  const accountOptions = [
    { value: '', label: 'Select account...' },
    ...accounts.map(a => ({ value: a.id, label: a.name })),
  ];

  const fieldOptions = [
    { value: '', label: 'Skip' },
    { value: 'date', label: 'Date' },
    { value: 'name', label: 'Description' },
    { value: 'amount', label: 'Amount' },
    { value: 'merchant_name', label: 'Merchant' },
    { value: 'category_name', label: 'Category' },
    { value: 'notes', label: 'Notes' },
    { value: 'transaction_type', label: 'Type (debit/credit)' },
  ];

  const resetState = useCallback(() => {
    setFile(null);
    setFileContent('');
    setCsvPreview(null);
    setColumnMapping({});
    setOfxPreview(null);
    setOfxPreviewError(null);
    setResult(null);
    setUpdateBalance(false);
  }, []);

  const handleFormatChange = useCallback((newFormat: ImportFormat) => {
    setFormat(newFormat);
    resetState();
  }, [resetState]);

  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    for (const char of line) {
      if (char === '"') { inQuotes = !inQuotes; }
      else if (char === ',' && !inQuotes) { result.push(current.trim()); current = ''; }
      else { current += char; }
    }
    result.push(current.trim());
    return result;
  };

  const handleCsvFile = useCallback((text: string) => {
    const lines = text.split('\n').filter(l => l.trim());
    if (lines.length < 2) return;
    const headers = parseCSVLine(lines[0]);
    const rows = lines.slice(1, 6).map(line => {
      const vals = parseCSVLine(line);
      const row: Record<string, string> = {};
      headers.forEach((h, i) => { row[h] = vals[i] || ''; });
      return row;
    });

    const mapping: Record<string, string> = {};
    headers.forEach(h => {
      const lower = h.toLowerCase();
      if (lower.match(/date/)) mapping[h] = 'date';
      else if (lower.match(/desc|memo|payee|name/)) mapping[h] = 'name';
      else if (lower.match(/amount|debit|credit/)) mapping[h] = 'amount';
      else if (lower.match(/merchant/)) mapping[h] = 'merchant_name';
      else if (lower.match(/categ/)) mapping[h] = 'category_name';
      else if (lower.match(/note/)) mapping[h] = 'notes';
      else if (lower === 'original description') mapping[h] = 'merchant_name';
      else if (lower === 'transaction type') mapping[h] = 'transaction_type';
    });

    setColumnMapping(mapping);
    setCsvPreview({ headers, rows, mapping });
  }, []);

  const handleOfxFile = useCallback(async (text: string) => {
    try {
      const { data } = await previewOfx({ variables: { fileContent: text } });
      const p = data.previewOfx;
      if (p.error) {
        setOfxPreviewError(p.error);
        setOfxPreview(null);
      } else {
        setOfxPreview(p);
        setOfxPreviewError(null);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Failed to parse file';
      setOfxPreviewError(message);
      setOfxPreview(null);
    }
  }, [previewOfx]);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);
    setOfxPreview(null);
    setOfxPreviewError(null);
    setCsvPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileContent(text);

      if (format === 'csv') {
        handleCsvFile(text);
      } else {
        handleOfxFile(text);
      }
    };
    reader.readAsText(f);
  }, [format, handleCsvFile, handleOfxFile]);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files?.[0];
    if (!f) return;

    // Auto-detect format from extension
    const ext = f.name.toLowerCase().split('.').pop();
    if (ext === 'ofx' || ext === 'qfx') {
      setFormat('ofx');
    } else if (ext === 'csv') {
      setFormat('csv');
    }

    setFile(f);
    setResult(null);
    setOfxPreview(null);
    setOfxPreviewError(null);
    setCsvPreview(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setFileContent(text);

      const detectedFormat = (ext === 'ofx' || ext === 'qfx') ? 'ofx' : 'csv';
      if (detectedFormat === 'csv') {
        handleCsvFile(text);
      } else {
        handleOfxFile(text);
      }
    };
    reader.readAsText(f);
  }, [handleCsvFile, handleOfxFile]);

  const handleImport = async () => {
    if (!accountId || !fileContent) return;

    try {
      if (format === 'csv') {
        const { data } = await importCsv({
          variables: {
            accountId,
            csvContent: fileContent,
            filename: file?.name || 'import.csv',
            columnMapping: Object.keys(columnMapping).length > 0 ? columnMapping : null,
          },
        });
        setResult(data.importCsv);
      } else {
        const { data } = await importOfx({
          variables: {
            accountId,
            fileContent,
            filename: file?.name || 'import.ofx',
            updateBalance,
          },
        });
        setResult(data.importOfx);
      }
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : 'Import failed';
      setResult({ imported: 0, skipped: 0, errors: [message] });
    }
  };

  const activeFormat = FORMAT_TABS.find(f => f.id === format)!;

  const formatAmount = (amount: number) => {
    return new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD' }).format(amount);
  };

  return (
    <div className="space-y-6">
      <PageHeader
        title="Import Transactions"
        subtitle="Upload bank statements or CSV files to import transactions"
      />

      {/* Format selector tabs */}
      <div className="flex gap-2">
        {FORMAT_TABS.map(tab => {
          const Icon = tab.icon;
          const isActive = format === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => handleFormatChange(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 ${
                isActive
                  ? 'bg-brand-500 text-white shadow-sm'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <Card>
        <div className="p-6 space-y-6">
          {/* Account selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Import to Account
            </label>
            <Select value={accountId} onChange={(e) => setAccountId(e.target.value)} options={accountOptions} />
          </div>

          {/* File upload */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              {activeFormat.label} File
            </label>
            <label
              className="flex flex-col items-center justify-center w-full h-40 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-xl cursor-pointer hover:border-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/10 transition-all duration-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <DocumentTextIcon className="h-8 w-8 text-brand-500 mb-1" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                    <span className="text-xs text-gray-500 dark:text-gray-400">{(file.size / 1024).toFixed(1)} KB</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      Drop file here or click to upload
                    </span>
                    <span className="text-xs text-gray-400 mt-1">{activeFormat.description}</span>
                  </>
                )}
              </div>
              <input
                type="file"
                accept={activeFormat.accept}
                className="hidden"
                onChange={handleFileChange}
              />
            </label>
          </div>

          {/* OFX Preview error */}
          {ofxPreviewError && (
            <div className="p-4 rounded-lg bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800">
              <div className="flex items-center gap-2">
                <ExclamationTriangleIcon className="h-5 w-5 text-red-500" />
                <span className="text-sm font-medium text-red-700 dark:text-red-400">
                  {ofxPreviewError}
                </span>
              </div>
            </div>
          )}

          {/* OFX Preview */}
          {ofxPreview && (
            <div className="space-y-4">
              {/* Statement info cards */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {ofxPreview.account?.type && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Account Type</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {ofxPreview.isCreditCard ? 'Credit Card' : ofxPreview.account.type}
                    </div>
                  </div>
                )}
                {ofxPreview.account?.account_id && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Account #</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      ···{ofxPreview.account.account_id.slice(-4)}
                    </div>
                  </div>
                )}
                {ofxPreview.balance?.amount != null && (
                  <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                    <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Statement Balance</div>
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                      {formatAmount(ofxPreview.balance.amount)}
                    </div>
                  </div>
                )}
                <div className="p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-200 dark:border-gray-700">
                  <div className="text-xs text-gray-500 dark:text-gray-400 mb-0.5">Transactions</div>
                  <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                    {ofxPreview.totalCount}
                  </div>
                </div>
              </div>

              {/* Date range */}
              {ofxPreview.dateRange?.start && ofxPreview.dateRange?.end && (
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  Statement period: {ofxPreview.dateRange.start} to {ofxPreview.dateRange.end}
                </p>
              )}

              {/* Transaction preview table */}
              <div>
                <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Preview ({Math.min(ofxPreview.transactions.length, 10)} of {ofxPreview.totalCount} transactions)
                </h3>
                <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                  <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                    <thead className="bg-gray-50 dark:bg-gray-800/50">
                      <tr>
                        <th className="text-left px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Date</th>
                        <th className="text-left px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Description</th>
                        <th className="text-left px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Type</th>
                        <th className="text-right px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">Amount</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                      {ofxPreview.transactions.map((txn, i) => (
                        <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {txn.date}
                          </td>
                          <td className="px-4 py-2.5 text-gray-900 dark:text-gray-100">
                            <div>{txn.name}</div>
                            {txn.memo && txn.memo !== txn.name && (
                              <div className="text-xs text-gray-500 dark:text-gray-400">{txn.memo}</div>
                            )}
                          </td>
                          <td className="px-4 py-2.5 text-gray-500 dark:text-gray-400 whitespace-nowrap text-xs">
                            {txn.type || '—'}
                          </td>
                          <td className={`px-4 py-2.5 text-right whitespace-nowrap font-medium ${
                            txn.amount >= 0 ? 'text-green-600 dark:text-green-400' : 'text-red-600 dark:text-red-400'
                          }`}>
                            {formatAmount(txn.amount)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Update balance option */}
              {ofxPreview.balance?.amount != null && (
                <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={updateBalance}
                    onChange={(e) => setUpdateBalance(e.target.checked)}
                    className="rounded border-gray-300 dark:border-gray-600 text-brand-500 focus:ring-brand-500"
                  />
                  Update account balance to {formatAmount(ofxPreview.balance.amount)} from statement
                </label>
              )}
            </div>
          )}

          {/* CSV Column mapping preview */}
          {format === 'csv' && csvPreview && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Column Mapping</h3>
              <div className="overflow-x-auto rounded-xl border border-gray-200 dark:border-gray-700">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700 text-sm">
                  <thead className="bg-gray-50 dark:bg-gray-800/50">
                    <tr>
                      {csvPreview.headers.map(h => (
                        <th key={h} className="text-left px-4 py-3 font-medium text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          <div className="mb-1.5 normal-case text-xs tracking-normal">{h}</div>
                          <Select
                            value={columnMapping[h] || ''}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [h]: e.target.value })}
                            options={fieldOptions}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700 bg-white dark:bg-gray-800">
                    {csvPreview.rows.map((row, i) => (
                      <tr key={i} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        {csvPreview.headers.map(h => (
                          <td key={h} className="px-4 py-2.5 text-gray-900 dark:text-gray-100 truncate max-w-[150px]">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Showing first {csvPreview.rows.length} rows. Total rows in file: {fileContent.split('\n').filter(l => l.trim()).length - 1}
              </p>
            </div>
          )}

          {/* Loading preview */}
          {previewLoading && (
            <div className="flex items-center justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand-500" />
              <span className="ml-3 text-sm text-gray-500 dark:text-gray-400">Parsing statement file...</span>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.imported > 0 ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800' : 'bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.imported > 0 ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {result.imported} imported, {result.skipped} skipped
                </span>
              </div>
              {result.balance?.amount != null && updateBalance && (
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Account balance updated to {formatAmount(result.balance.amount)}
                </p>
              )}
              {result.errors && result.errors.length > 0 && (
                <ul className="text-sm text-red-600 dark:text-red-400 space-y-1">
                  {result.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>• {err}</li>
                  ))}
                  {result.errors.length > 10 && (
                    <li>...and {result.errors.length - 10} more errors</li>
                  )}
                </ul>
              )}
            </div>
          )}

          {/* Import button */}
          <div className="flex justify-end">
            <Button
              onClick={handleImport}
              loading={loading}
              disabled={!accountId || !fileContent || loading || (format === 'ofx' && !!ofxPreviewError)}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Import {format === 'ofx' ? (ofxPreview ? `${ofxPreview.totalCount} Transactions` : 'Transactions') : 'Transactions'}
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportPage;
