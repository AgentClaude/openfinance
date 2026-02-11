import { describe, it, expect } from 'vitest';
import { cleanFilters } from '../useTransactions';

describe('cleanFilters', () => {
  it('removes empty string values', () => {
    const result = cleanFilters({ search: '', accountId: '', page: 1 });
    expect(result).toEqual({ page: 1 });
  });

  it('removes undefined values', () => {
    const result = cleanFilters({ search: undefined, categoryId: undefined, limit: 20 });
    expect(result).toEqual({ limit: 20 });
  });

  it('removes null values', () => {
    const result = cleanFilters({ search: null as any, page: 1 });
    expect(result).toEqual({ page: 1 });
  });

  it('keeps valid filter values', () => {
    const filters = {
      search: 'grocery',
      accountId: 'abc-123',
      page: 1,
      limit: 20,
      needsReview: true,
      minAmount: 0,
    };
    // Note: 0 is falsy but not empty string/null/undefined, so it should be kept
    expect(cleanFilters(filters)).toEqual(filters);
  });

  it('keeps boolean false values', () => {
    const result = cleanFilters({ needsReview: false, page: 1 });
    expect(result).toEqual({ needsReview: false, page: 1 });
  });

  it('keeps numeric zero', () => {
    const result = cleanFilters({ minAmount: 0, page: 1 });
    expect(result).toEqual({ minAmount: 0, page: 1 });
  });

  it('returns empty object for all-empty input', () => {
    const result = cleanFilters({ search: '', accountId: '', categoryId: '' });
    expect(result).toEqual({});
  });

  it('handles mixed valid and invalid values', () => {
    const result = cleanFilters({
      search: 'test',
      accountId: '',
      categoryId: undefined,
      page: 1,
      limit: 20,
    });
    expect(result).toEqual({ search: 'test', page: 1, limit: 20 });
  });
});
