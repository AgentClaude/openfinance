import React, { useState, useCallback } from 'react';
import { useMutation } from '@apollo/client';
import { ArrowUpTrayIcon, DocumentTextIcon, CheckCircleIcon, ExclamationTriangleIcon } from '@heroicons/react/24/outline';
import { IMPORT_CSV } from '@/graphql/mutations';
import { useAccounts } from '@/hooks/useAccounts';
import PageHeader from '@/components/ui/PageHeader';
import Button from '@/components/ui/Button';
import Select from '@/components/ui/Select';
import Card from '@/components/ui/Card';

interface PreviewData {
  headers: string[];
  rows: Record<string, string>[];
  mapping: Record<string, string>;
}

const ImportPage: React.FC = () => {
  const { accounts } = useAccounts();
  const [accountId, setAccountId] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [csvContent, setCsvContent] = useState('');
  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [columnMapping, setColumnMapping] = useState<Record<string, string>>({});
  const [result, setResult] = useState<{ imported: number; skipped: number; errors: string[] } | null>(null);

  const [importCsv, { loading }] = useMutation(IMPORT_CSV);

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

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setFile(f);
    setResult(null);

    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setCsvContent(text);

      // Parse preview
      const lines = text.split('\n').filter(l => l.trim());
      if (lines.length < 2) return;
      const headers = parseCSVLine(lines[0]);
      const rows = lines.slice(1, 6).map(line => {
        const vals = parseCSVLine(line);
        const row: Record<string, string> = {};
        headers.forEach((h, i) => { row[h] = vals[i] || ''; });
        return row;
      });

      // Auto-detect mapping
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
      setPreview({ headers, rows, mapping });
    };
    reader.readAsText(f);
  }, []);

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

  const handleImport = async () => {
    if (!accountId || !csvContent) return;
    try {
      const { data } = await importCsv({
        variables: {
          accountId,
          csvContent,
          filename: file?.name || 'import.csv',
          columnMapping: Object.keys(columnMapping).length > 0 ? columnMapping : null,
        },
      });
      setResult(data.importCsv);
    } catch (e: any) {
      setResult({ imported: 0, skipped: 0, errors: [e.message] });
    }
  };

  return (
    <div className="space-y-6">
      <PageHeader title="Import Transactions" subtitle="Upload a CSV file to import transactions" />

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
              CSV File
            </label>
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg cursor-pointer hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-900/20 transition-colors">
              <div className="flex flex-col items-center">
                {file ? (
                  <>
                    <DocumentTextIcon className="h-8 w-8 text-indigo-500 mb-1" />
                    <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{file.name}</span>
                    <span className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</span>
                  </>
                ) : (
                  <>
                    <ArrowUpTrayIcon className="h-8 w-8 text-gray-400 mb-1" />
                    <span className="text-sm text-gray-500">Click to upload CSV</span>
                    <span className="text-xs text-gray-400">Supports Mint, bank exports, generic CSV</span>
                  </>
                )}
              </div>
              <input type="file" accept=".csv" className="hidden" onChange={handleFileChange} />
            </label>
          </div>

          {/* Column mapping preview */}
          {preview && (
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Column Mapping</h3>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b dark:border-gray-700">
                      {preview.headers.map(h => (
                        <th key={h} className="text-left py-2 px-2 font-medium text-gray-500 dark:text-gray-400">
                          <div className="mb-1 text-xs">{h}</div>
                          <Select
                            value={columnMapping[h] || ''}
                            onChange={(e) => setColumnMapping({ ...columnMapping, [h]: e.target.value })}
                            options={fieldOptions}
                          />
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.rows.map((row, i) => (
                      <tr key={i} className="border-b dark:border-gray-700">
                        {preview.headers.map(h => (
                          <td key={h} className="py-1.5 px-2 text-gray-600 dark:text-gray-400 truncate max-w-[150px]">
                            {row[h]}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <p className="text-xs text-gray-400 mt-2">
                Showing first {preview.rows.length} rows. Total rows in file: {csvContent.split('\n').filter(l => l.trim()).length - 1}
              </p>
            </div>
          )}

          {/* Result */}
          {result && (
            <div className={`p-4 rounded-lg ${result.imported > 0 ? 'bg-green-50 dark:bg-green-900/20' : 'bg-yellow-50 dark:bg-yellow-900/20'}`}>
              <div className="flex items-center gap-2 mb-2">
                {result.imported > 0 ? (
                  <CheckCircleIcon className="h-5 w-5 text-green-500" />
                ) : (
                  <ExclamationTriangleIcon className="h-5 w-5 text-yellow-500" />
                )}
                <span className="font-medium text-gray-900 dark:text-white">
                  {result.imported} imported, {result.skipped} skipped
                </span>
              </div>
              {result.errors.length > 0 && (
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
              disabled={!accountId || !csvContent || loading}
            >
              <ArrowUpTrayIcon className="h-4 w-4 mr-2" />
              Import Transactions
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
};

export default ImportPage;
