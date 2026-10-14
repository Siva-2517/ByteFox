import { describe, it, expect } from 'vitest';
import { calculateAggregation, executeAndAuditBlock } from '../lib/audit-engine';

describe('Aggregation and Math Engine', () => {
  it('correctly calculates basic aggregations on standard numbers', () => {
    const numbers = [10, 20, 30, 40, 50];

    expect(calculateAggregation(numbers, 'SUM')).toBe(150);
    expect(calculateAggregation(numbers, 'AVG')).toBe(30);
    expect(calculateAggregation(numbers, 'COUNT')).toBe(5);
    expect(calculateAggregation(numbers, 'MIN')).toBe(10);
    expect(calculateAggregation(numbers, 'MAX')).toBe(50);
    expect(calculateAggregation(numbers, 'MEDIAN')).toBe(30);
  });

  it('handles even-count median correctly', () => {
    const numbers = [10, 20, 30, 40];
    expect(calculateAggregation(numbers, 'MEDIAN')).toBe(25);
  });

  it('handles negative numbers, decimals, and zeros without floating point drift', () => {
    const numbers = [-15.5, 0, 25.25, -9.75];
    // sum: -15.5 + 0 + 25.25 - 9.75 = 0.00
    expect(calculateAggregation(numbers, 'SUM')).toBe(0);
    expect(calculateAggregation(numbers, 'MIN')).toBe(-15.5);
    expect(calculateAggregation(numbers, 'MAX')).toBe(25.25);
    expect(calculateAggregation(numbers, 'AVG')).toBe(0);
  });

  it('returns 0 for empty array', () => {
    expect(calculateAggregation([], 'SUM')).toBe(0);
    expect(calculateAggregation([], 'AVG')).toBe(0);
    expect(calculateAggregation([], 'COUNT')).toBe(0);
  });
});

describe('Audit and Show-Your-Work Engine with Filters', () => {
  const sampleRows = [
    { rowNumber: 2, data: { date: '2024-01-15', region: 'North', amount: '100' } },
    { rowNumber: 3, data: { date: '2024-02-20', region: 'North', amount: '200' } },
    { rowNumber: 4, data: { date: '2024-03-10', region: 'South', amount: '300' } },
    { rowNumber: 5, data: { date: '2024-05-15', region: 'North', amount: 'N/A' } }, // invalid amount
    { rowNumber: 6, data: { date: '2024-08-01', region: 'North', amount: '400' } }, // outside date range
    { rowNumber: 7, data: { date: 'bad-date', region: 'North', amount: '500' } },   // bad date
  ];

  it('accurately accounts for included and excluded rows with global filters', () => {
    const audit = executeAndAuditBlock({
      blockType: 'METRIC',
      config: { column: 'amount', aggregation: 'SUM' },
      title: 'North Q1 Total',
      rows: sampleRows,
      totalDatasetRows: 8, // includes 1 unparseable row
      unparseableCount: 1,
      globalFilters: {
        dateRange: { column: 'date', start: '2024-01-01', end: '2024-03-31' },
        categoryFilters: { region: ['North'] },
      },
    });

    // Valid candidate rows matching date range [2024-01-01 to 2024-03-31] AND region 'North':
    // Row 2: 2024-01-15 North 100 -> INCLUDED
    // Row 3: 2024-02-20 North 200 -> INCLUDED
    // Row 4: 2024-03-10 South -> EXCLUDED by category
    // Row 5: 2024-05-15 -> EXCLUDED by date
    // Row 6: 2024-08-01 -> EXCLUDED by date
    // Row 7: bad-date -> EXCLUDED by date
    expect(audit.computedValue).toBe(300);
    expect(audit.rowsIncluded).toBe(2);
    expect(audit.rowsExcluded).toBe(6);
    expect(audit.exclusionBreakdown.filteredByCategory).toBe(1);
    expect(audit.exclusionBreakdown.unparseableSourceRows).toBe(1);
    expect(audit.plainEnglishExplanation).toContain('Calculated SUM of \'amount\'');
    expect(audit.exactQuery).toContain('SELECT SUM("amount") AS result');
  });

  it('supports category split in METRIC block', () => {
    const audit = executeAndAuditBlock({
      blockType: 'METRIC',
      config: { column: 'amount', aggregation: 'SUM', splitByCategory: 'region' },
      rows: sampleRows.slice(0, 3), // rows 2, 3, 4
      totalDatasetRows: 3,
      unparseableCount: 0,
    });

    expect(audit.computedValue.total).toBe(600);
    expect(audit.computedValue.breakdown).toEqual([
      { category: 'North', value: 300, count: 2 },
      { category: 'South', value: 300, count: 1 },
    ]);
  });
});
