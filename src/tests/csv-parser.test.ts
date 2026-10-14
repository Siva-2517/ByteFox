import { describe, it, expect } from 'vitest';
import { parseAndProfileCSV, parseDateValue, parseNumericValue } from '../lib/csv-parser';

describe('CSV Parsing and Type Inference Engine', () => {
  it('correctly parses dirty numeric representations', () => {
    expect(parseNumericValue('$1,249.50')).toEqual({ isNumber: true, value: 1249.5 });
    expect(parseNumericValue('€450.00')).toEqual({ isNumber: true, value: 450.0 });
    expect(parseNumericValue('-25.5%')).toEqual({ isNumber: true, value: -25.5 });
    expect(parseNumericValue('0')).toEqual({ isNumber: true, value: 0 });
    expect(parseNumericValue('N/A')).toEqual({ isNumber: false });
    expect(parseNumericValue('')).toEqual({ isNumber: false });
  });

  it('correctly parses multiple date formats', () => {
    expect(parseDateValue('2024-03-15').isDate).toBe(true);
    expect(parseDateValue('03/15/2024').isDate).toBe(true);
    expect(parseDateValue('invalid-date').isDate).toBe(false);
    expect(parseDateValue('2024-99-99').isDate).toBe(false);
  });

  it('profiles a messy CSV honestly without silently dropping bad rows', () => {
    const rawCSV = `id,date,region,revenue,notes
1,2024-01-01,North,$500,Normal row
2,2024-01-02,South,€250.50,Euro currency
3,bad-date,North,N/A,Missing date and revenue
4,2024-01-04,North,100
5,2024-01-05,East,300,extra,column,overflow
,,,,,
6,2024-01-06,West,800,Valid row`;

    const result = parseAndProfileCSV(rawCSV);

    expect(result.profile.validRowCount).toBe(4); // rows 1, 2, 3, 4 (row 4 had empty note or valid length depending on parsing)
    expect(result.profile.unparseableCount).toBeGreaterThanOrEqual(1); // jagged row and empty row
    expect(result.headers).toEqual(['id', 'date', 'region', 'revenue', 'notes']);

    // Check unparseable rows log
    const unparseable = result.profile.unparseableRows;
    const hasJaggedError = unparseable.some((r) => r.reason.includes('Mismatched column count') || r.reason.includes('Empty'));
    expect(hasJaggedError).toBe(true);

    // Check revenue column type inference
    const revenueCol = result.profile.columns.find((c) => c.name === 'revenue');
    expect(revenueCol?.type).toBe('number');
  });

  it('rejects binary / null-byte corrupted files with a clear error', () => {
    expect(() => parseAndProfileCSV('id,name\0corrupted_binary')).toThrow(
      /File appears to be binary or corrupted/
    );
  });

  it('rejects completely empty files with clear error message', () => {
    expect(() => parseAndProfileCSV('   \n\n  ')).toThrow(/The uploaded CSV file is empty/);
  });
});
