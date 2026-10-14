import Papa from 'papaparse';
import { ColumnProfile, ColumnType, DatasetProfile, UnparseableRow } from '@/types';

export interface ParseResult {
  profile: DatasetProfile;
  validRows: { rowNumber: number; data: Record<string, any> }[];
  headers: string[];
}

const CURRENCY_OR_NUMBER_REGEX = /^[\s$€£₹¥%]*([-+]?[0-9]{1,3}(?:,[0-9]{3})*(?:\.[0-9]+)?|[-+]?[0-9]+(?:\.[0-9]+)?)(?:[\s$€£₹¥%]*)$/;
const DATE_FORMAT_REGEX = /^(\d{4}[-/.]\d{1,2}[-/.]\d{1,2}|\d{1,2}[-/.]\d{1,2}[-/.]\d{4})(?:[T\s]\d{1,2}:\d{2}(?::\d{2})?(?:\.\d+)?(?:Z|[+-]\d{2}:?\d{2})?)?$/;

/**
 * Checks if a string can be parsed as a valid numeric value.
 */
export function parseNumericValue(val: any): { isNumber: boolean; value?: number } {
  if (val === null || val === undefined || val === '') {
    return { isNumber: false };
  }
  if (typeof val === 'number') {
    return isNaN(val) ? { isNumber: false } : { isNumber: true, value: val };
  }
  const str = String(val).trim();
  if (str === '') return { isNumber: false };

  // Quick exclusion of common non-numeric strings
  if (['n/a', 'na', 'null', 'none', 'unknown', '-', '--'].includes(str.toLowerCase())) {
    return { isNumber: false };
  }

  const match = str.match(CURRENCY_OR_NUMBER_REGEX);
  if (match) {
    const cleaned = match[1].replace(/,/g, '');
    const num = parseFloat(cleaned);
    if (!isNaN(num) && isFinite(num)) {
      return { isNumber: true, value: num };
    }
  }

  return { isNumber: false };
}

/**
 * Checks if a string can be parsed as a valid calendar date.
 */
export function parseDateValue(val: any): { isDate: boolean; isoDate?: string } {
  if (val === null || val === undefined || val === '') {
    return { isDate: false };
  }
  const str = String(val).trim();
  if (str.length < 6 || str.length > 35) return { isDate: false };
  if (!DATE_FORMAT_REGEX.test(str)) return { isDate: false };

  const parsed = Date.parse(str);
  if (isNaN(parsed)) return { isDate: false };

  const d = new Date(parsed);
  const year = d.getFullYear();
  // Sanity check year bounds
  if (year < 1920 || year > 2100) return { isDate: false };

  return { isDate: true, isoDate: d.toISOString().split('T')[0] };
}

/**
 * Parses raw CSV string, extracts column headers, records unparseable rows,
 * infers types honestly, and compiles full profile without silent drops.
 */
export function parseAndProfileCSV(csvContent: string): ParseResult {
  // Check for binary or corrupted non-text files
  if (csvContent.includes('\0')) {
    throw new Error('File appears to be binary or corrupted; CSV text files must not contain null bytes.');
  }

  const trimmed = csvContent.trim();
  if (!trimmed) {
    throw new Error('The uploaded CSV file is empty.');
  }

  // First pass: Parse without header to inspect raw row lengths and syntax errors
  const rawParse = Papa.parse<string[]>(csvContent, {
    skipEmptyLines: false,
    header: false,
  });

  if (rawParse.errors.length > 0) {
    const criticalError = rawParse.errors.find(
      (e) => e.type === 'Quotes' || e.code === 'UndetectableDelimiter'
    );
    if (criticalError) {
      throw new Error(`CSV syntax error on row ${criticalError.row ?? 'unknown'}: ${criticalError.message}`);
    }
  }

  const rawRows = rawParse.data;
  if (!rawRows || rawRows.length === 0) {
    throw new Error('No data rows found in CSV.');
  }

  // Header detection: First non-empty row
  let headerIndex = -1;
  let headers: string[] = [];
  for (let i = 0; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (row && row.some((cell) => cell.trim().length > 0)) {
      headerIndex = i;
      headers = row.map((h, idx) => {
        const cleaned = h.trim();
        return cleaned || `column_${idx + 1}`;
      });
      break;
    }
  }

  if (headerIndex === -1 || headers.length === 0) {
    throw new Error('Could not identify a valid header row in the CSV file.');
  }

  const unparseableRows: UnparseableRow[] = [];
  const validRows: { rowNumber: number; data: Record<string, any> }[] = [];

  // Parse errors from PapaParse indexed by row
  const errorsByRow = new Map<number, string>();
  for (const err of rawParse.errors) {
    if (typeof err.row === 'number') {
      errorsByRow.set(err.row, err.message);
    }
  }

  // Process data rows
  for (let i = headerIndex + 1; i < rawRows.length; i++) {
    const rowNumber = i + 1; // 1-based line number in source file
    const rawRow = rawRows[i];

    // Check if entire row is whitespace/empty
    const isCompletelyEmpty = rawRow.every((c) => !c || c.trim().length === 0);
    if (isCompletelyEmpty) {
      // Empty line in source file
      unparseableRows.push({
        line: rowNumber,
        raw: rawRow.join(','),
        reason: 'Empty line in CSV file.',
      });
      continue;
    }

    if (errorsByRow.has(i)) {
      unparseableRows.push({
        line: rowNumber,
        raw: rawRow.join(','),
        reason: errorsByRow.get(i) || 'Malformed CSV line syntax.',
      });
      continue;
    }

    if (rawRow.length !== headers.length) {
      unparseableRows.push({
        line: rowNumber,
        raw: rawRow.join(','),
        reason: `Mismatched column count: expected ${headers.length} columns but found ${rawRow.length}.`,
      });
      continue;
    }

    // Row is structurally valid
    const rowData: Record<string, any> = {};
    for (let c = 0; c < headers.length; c++) {
      const colName = headers[c];
      const rawVal = rawRow[c] !== undefined ? rawRow[c].trim() : '';
      rowData[colName] = rawVal;
    }

    validRows.push({
      rowNumber,
      data: rowData,
    });
  }

  // Second step: Heuristic Type Profiling per Column
  const columnProfiles: ColumnProfile[] = [];

  for (const colName of headers) {
    let nullOrEmptyCount = 0;
    let numericSuccessCount = 0;
    let dateSuccessCount = 0;
    const distinctValuesSet = new Set<string>();
    const numericValues: number[] = [];
    const dateValues: string[] = [];

    for (const item of validRows) {
      const val = item.data[colName];
      if (val === null || val === undefined || val === '') {
        nullOrEmptyCount++;
        continue;
      }

      const strVal = String(val).trim();
      distinctValuesSet.add(strVal);

      // Check numeric
      const numCheck = parseNumericValue(strVal);
      if (numCheck.isNumber && numCheck.value !== undefined) {
        numericSuccessCount++;
        numericValues.push(numCheck.value);
      }

      // Check date
      const dateCheck = parseDateValue(strVal);
      if (dateCheck.isDate && dateCheck.isoDate) {
        dateSuccessCount++;
        dateValues.push(dateCheck.isoDate);
      }
    }

    const nonNullCount = validRows.length - nullOrEmptyCount;
    let inferredType: ColumnType = 'text';

    if (nonNullCount > 0) {
      const numericRatio = numericSuccessCount / nonNullCount;
      const dateRatio = dateSuccessCount / nonNullCount;

      if (numericRatio >= 0.75) {
        inferredType = 'number';
      } else if (dateRatio >= 0.75) {
        inferredType = 'date';
      } else if (
        distinctValuesSet.size <= 30 ||
        (validRows.length >= 20 && distinctValuesSet.size / validRows.length < 0.2)
      ) {
        inferredType = 'category';
      } else {
        inferredType = 'text';
      }
    }

    // Compute column stats
    let minVal: number | string | undefined;
    let maxVal: number | string | undefined;
    let meanVal: number | undefined;

    if (inferredType === 'number' && numericValues.length > 0) {
      minVal = Math.min(...numericValues);
      maxVal = Math.max(...numericValues);
      const sum = numericValues.reduce((acc, curr) => acc + curr, 0);
      meanVal = Number((sum / numericValues.length).toFixed(2));
    } else if (inferredType === 'date' && dateValues.length > 0) {
      dateValues.sort();
      minVal = dateValues[0];
      maxVal = dateValues[dateValues.length - 1];
    }

    const sampleArr = Array.from(distinctValuesSet).slice(0, 5);

    columnProfiles.push({
      name: colName,
      type: inferredType,
      totalCount: validRows.length,
      nullCount: nullOrEmptyCount,
      emptyCount: nullOrEmptyCount,
      validCount: nonNullCount,
      distinctCount: distinctValuesSet.size,
      sampleValues: sampleArr,
      min: minVal,
      max: maxVal,
      mean: meanVal,
    });
  }

  return {
    profile: {
      rowCount: validRows.length + unparseableRows.length,
      validRowCount: validRows.length,
      unparseableCount: unparseableRows.length,
      columns: columnProfiles,
      unparseableRows,
    },
    validRows,
    headers,
  };
}
