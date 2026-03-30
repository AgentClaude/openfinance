import { useQuery, gql } from '@apollo/client';

export const GET_TAX_SUMMARY = gql`
  query GetTaxSummary($year: Int, $filingStatus: String) {
    taxSummary(year: $year, filingStatus: $filingStatus) {
      year
      filingStatus
      incomeSummary {
        total
        buckets {
          type
          label
          amount
          transactionCount
          percentage
          topSources { name amount count }
        }
      }
      deductionSummary {
        standardDeduction
        itemizedTotal
        shouldItemize
        recommendedDeduction
        buckets {
          type
          label
          amount
          transactionCount
          topItems { name amount count }
        }
      }
      taxEstimate {
        grossIncome
        adjustments
        agi
        deductionAmount
        deductionType
        taxableIncome
        federalTax
        selfEmploymentTax
        totalEstimatedTax
        effectiveRate
        marginalRate
        bracketBreakdown {
          rate
          rangeMin
          rangeMax
          taxableAmount
          tax
        }
      }
      quarterlyBreakdown {
        quarter
        startDate
        endDate
        estimatedPaymentDue
        income
        deductibleExpenses
        transactionCount
      }
      categoryDetails {
        categoryId
        categoryName
        categoryIcon
        groupName
        isIncome
        taxClassification
        incomeAmount
        expenseAmount
        transactionCount
      }
      tips {
        type
        title
        message
      }
    }
  }
`;

export interface TaxTopSource {
  name: string;
  amount: number;
  count: number;
}

export interface TaxIncomeBucket {
  type: string;
  label: string;
  amount: number;
  transactionCount: number;
  percentage: number;
  topSources: TaxTopSource[];
}

export interface TaxIncomeSummary {
  total: number;
  buckets: TaxIncomeBucket[];
}

export interface TaxDeductionBucket {
  type: string;
  label: string;
  amount: number;
  transactionCount: number;
  topItems: TaxTopSource[];
}

export interface TaxDeductionSummary {
  standardDeduction: number;
  itemizedTotal: number;
  shouldItemize: boolean;
  recommendedDeduction: number;
  buckets: TaxDeductionBucket[];
}

export interface TaxBracket {
  rate: number;
  rangeMin: number;
  rangeMax: number | null;
  taxableAmount: number;
  tax: number;
}

export interface TaxEstimate {
  grossIncome: number;
  adjustments: number;
  agi: number;
  deductionAmount: number;
  deductionType: string;
  taxableIncome: number;
  federalTax: number;
  selfEmploymentTax: number;
  totalEstimatedTax: number;
  effectiveRate: number;
  marginalRate: number;
  bracketBreakdown: TaxBracket[];
}

export interface TaxQuarter {
  quarter: string;
  startDate: string;
  endDate: string;
  estimatedPaymentDue: string;
  income: number;
  deductibleExpenses: number;
  transactionCount: number;
}

export interface TaxCategoryDetail {
  categoryId: string | null;
  categoryName: string;
  categoryIcon: string | null;
  groupName: string | null;
  isIncome: boolean;
  taxClassification: string;
  incomeAmount: number;
  expenseAmount: number;
  transactionCount: number;
}

export interface TaxTip {
  type: string;
  title: string;
  message: string;
}

export interface TaxSummary {
  year: number;
  filingStatus: string;
  incomeSummary: TaxIncomeSummary;
  deductionSummary: TaxDeductionSummary;
  taxEstimate: TaxEstimate;
  quarterlyBreakdown: TaxQuarter[];
  categoryDetails: TaxCategoryDetail[];
  tips: TaxTip[];
}

export function useTaxSummary(year?: number, filingStatus?: string) {
  const { data, loading, error, refetch } = useQuery<{ taxSummary: TaxSummary }>(GET_TAX_SUMMARY, {
    variables: { year, filingStatus },
    fetchPolicy: 'network-only',
  });

  return {
    taxSummary: data?.taxSummary ?? null,
    loading,
    error,
    refetch,
  };
}
