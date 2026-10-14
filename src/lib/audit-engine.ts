import {
  AggregationType,
  AuditResult,
  BlockType,
  ChartConfig,
  GlobalFilters,
  MetricConfig,
  SampleExcludedRow,
  TableConfig,
  TextNoteConfig,
} from '@/types';
import { parseDateValue, parseNumericValue } from './csv-parser';

export interface ExecuteBlockParams {
  blockType: BlockType;
  config: MetricConfig | ChartConfig | TableConfig | TextNoteConfig | any;
  title?: string;
  rows: { rowNumber: number; data: Record<string, any> }[];
  totalDatasetRows: number;
  unparseableCount: number;
  globalFilters?: GlobalFilters;
  segmentFilter?: { column: string; value: string }; // For drilling down into a chart bar
}

/**
 * Modular Aggregation Calculator
 * Extensible for live-coding interview additions (e.g., MEDIAN, STDDEV)
 */
export function calculateAggregation(
  values: number[],
  aggregation: AggregationType | string
): number {
  if (values.length === 0) return 0;

  switch (aggregation.toUpperCase()) {
    case 'SUM':
      return Number(values.reduce((acc, curr) => acc + curr, 0).toFixed(2));
    case 'AVG': {
      const sum = values.reduce((acc, curr) => acc + curr, 0);
      return Number((sum / values.length).toFixed(2));
    }
    case 'COUNT':
      return values.length;
    case 'MIN':
      return Math.min(...values);
    case 'MAX':
      return Math.max(...values);
    case 'MEDIAN': {
      const sorted = [...values].sort((a, b) => a - b);
      const mid = Math.floor(sorted.length / 2);
      return sorted.length % 2 !== 0
        ? sorted[mid]
        : Number(((sorted[mid - 1] + sorted[mid]) / 2).toFixed(2));
    }
    default:
      return Number(values.reduce((acc, curr) => acc + curr, 0).toFixed(2));
  }
}

/**
 * Executes a report block calculation and produces the full "Show Your Work" audit trail.
 */
export function executeAndAuditBlock({
  blockType,
  config,
  title,
  rows,
  totalDatasetRows,
  unparseableCount,
  globalFilters = {},
  segmentFilter,
}: ExecuteBlockParams): AuditResult {
  const excludedByDate: SampleExcludedRow[] = [];
  const excludedByCategory: SampleExcludedRow[] = [];
  const excludedByInvalidTarget: SampleExcludedRow[] = [];
  const excludedBySegment: SampleExcludedRow[] = [];

  const candidateRows: { rowNumber: number; data: Record<string, any> }[] = [];

  // Step 1: Apply Global Filters & Segment Filter
  for (const item of rows) {
    const row = item.data;
    let excluded = false;

    // 1A. Date Range Filter
    if (globalFilters.dateRange && globalFilters.dateRange.column) {
      const { column, start, end } = globalFilters.dateRange;
      const rawDate = row[column];
      const parsed = parseDateValue(rawDate);

      if (!parsed.isDate || !parsed.isoDate) {
        excludedByDate.push({
          rowNumber: item.rowNumber,
          data: row,
          reason: `Date column '${column}' has missing or unparseable date value: "${rawDate}"`,
        });
        excluded = true;
      } else {
        if (start && parsed.isoDate < start) {
          excludedByDate.push({
            rowNumber: item.rowNumber,
            data: row,
            reason: `Date ${parsed.isoDate} is before start boundary ${start}`,
          });
          excluded = true;
        } else if (end && parsed.isoDate > end) {
          excludedByDate.push({
            rowNumber: item.rowNumber,
            data: row,
            reason: `Date ${parsed.isoDate} is after end boundary ${end}`,
          });
          excluded = true;
        }
      }
    }
    if (excluded) continue;

    // 1B. Global Category Filters
    if (globalFilters.categoryFilters) {
      for (const [catCol, allowedVals] of Object.entries(globalFilters.categoryFilters)) {
        if (allowedVals && allowedVals.length > 0) {
          const val = String(row[catCol] ?? '').trim();
          if (!allowedVals.includes(val)) {
            excludedByCategory.push({
              rowNumber: item.rowNumber,
              data: row,
              reason: `Category '${catCol}' value "${val}" is not in selected filter [${allowedVals.join(', ')}]`,
            });
            excluded = true;
            break;
          }
        }
      }
    }
    if (excluded) continue;

    // 1C. Chart Segment drill-down filter (if clicking specific category or bar)
    if (segmentFilter && segmentFilter.column) {
      const val = String(row[segmentFilter.column] ?? '').trim();
      if (val !== segmentFilter.value) {
        excludedBySegment.push({
          rowNumber: item.rowNumber,
          data: row,
          reason: `Segment drill-down: '${segmentFilter.column}' is "${val}", expected "${segmentFilter.value}"`,
        });
        continue;
      }
    }

    candidateRows.push(item);
  }

  // Handle TEXT_NOTE block
  if (blockType === 'TEXT_NOTE') {
    const textConfig = config as TextNoteConfig;
    return {
      title: title || 'Text Note',
      blockType,
      computedValue: textConfig.content || '',
      plainEnglishExplanation: 'Static text note block rendered as markdown.',
      exactQuery: 'N/A (Static Note)',
      formula: 'Plain text',
      totalDatasetRows,
      rowsIncluded: 0,
      rowsExcluded: 0,
      exclusionBreakdown: {
        filteredByDateRange: 0,
        filteredByCategory: 0,
        missingOrNullTargetValue: 0,
        unparseableSourceRows: 0,
      },
      sampleIncludedRows: [],
      sampleExcludedRows: [],
    };
  }

  // Handle TABLE block
  if (blockType === 'TABLE') {
    const tableConfig = config as TableConfig;
    const { columns = [], sortColumn, sortDirection = 'asc', limit = 10 } = tableConfig;

    const sortedRows = [...candidateRows].sort((a, b) => {
      if (!sortColumn) return 0;
      const valA = a.data[sortColumn];
      const valB = b.data[sortColumn];

      const numA = parseNumericValue(valA);
      const numB = parseNumericValue(valB);

      if (numA.isNumber && numB.isNumber && numA.value !== undefined && numB.value !== undefined) {
        return sortDirection === 'asc' ? numA.value - numB.value : numB.value - numA.value;
      }

      const strA = String(valA ?? '');
      const strB = String(valB ?? '');
      return sortDirection === 'asc' ? strA.localeCompare(strB) : strB.localeCompare(strA);
    });

    const sliced = sortedRows.slice(0, limit);
    const tableData = sliced.map((item) => {
      const rowObj: Record<string, any> = { _rowNumber: item.rowNumber };
      for (const col of columns) {
        rowObj[col] = item.data[col] ?? '';
      }
      return rowObj;
    });

    const whereClauses: string[] = [];
    if (globalFilters.dateRange?.column) {
      whereClauses.push(
        `"${globalFilters.dateRange.column}" BETWEEN '${globalFilters.dateRange.start || 'MIN'}' AND '${globalFilters.dateRange.end || 'MAX'}'`
      );
    }
    if (globalFilters.categoryFilters) {
      for (const [col, vals] of Object.entries(globalFilters.categoryFilters)) {
        if (vals.length > 0) {
          whereClauses.push(`"${col}" IN (${vals.map((v) => `'${v}'`).join(', ')})`);
        }
      }
    }

    const whereStr = whereClauses.length > 0 ? `\nWHERE ${whereClauses.join(' AND ')}` : '';
    const orderStr = sortColumn ? `\nORDER BY "${sortColumn}" ${sortDirection.toUpperCase()}` : '';
    const query = `SELECT ${columns.length > 0 ? columns.map((c) => `"${c}"`).join(', ') : '*'} FROM "dataset_rows"${whereStr}${orderStr}\nLIMIT ${limit};`;

    const totalExcluded =
      excludedByDate.length + excludedByCategory.length + excludedBySegment.length;

    return {
      title: title || 'Data Table',
      blockType,
      computedValue: tableData,
      plainEnglishExplanation: `Selected top ${tableData.length} records${
        sortColumn ? ` ordered by '${sortColumn}' (${sortDirection.toUpperCase()})` : ''
      } out of ${candidateRows.length} matching rows.`,
      exactQuery: query,
      formula: `TOP ${limit} ROWS`,
      totalDatasetRows,
      rowsIncluded: tableData.length,
      rowsExcluded: totalDatasetRows - tableData.length,
      exclusionBreakdown: {
        filteredByDateRange: excludedByDate.length,
        filteredByCategory: excludedByCategory.length + excludedBySegment.length,
        missingOrNullTargetValue: 0,
        unparseableSourceRows: unparseableCount,
      },
      sampleIncludedRows: sliced.slice(0, 5).map((r) => r.data),
      sampleExcludedRows: [...excludedByDate, ...excludedByCategory, ...excludedBySegment].slice(0, 5),
    };
  }

  // Handle METRIC block
  if (blockType === 'METRIC') {
    const metricConfig = config as MetricConfig;
    const { column, aggregation = 'SUM', splitByCategory } = metricConfig;

    if (splitByCategory) {
      // Split by Category breakdown
      const groups: Record<string, { numbers: number[]; rows: any[] }> = {};

      for (const item of candidateRows) {
        const catVal = String(item.data[splitByCategory] || '(Unassigned)').trim();
        const numRes = parseNumericValue(item.data[column]);

        if (!numRes.isNumber || numRes.value === undefined) {
          excludedByInvalidTarget.push({
            rowNumber: item.rowNumber,
            data: item.data,
            reason: `Target numeric column '${column}' has non-numeric value: "${item.data[column]}"`,
          });
          continue;
        }

        if (!groups[catVal]) {
          groups[catVal] = { numbers: [], rows: [] };
        }
        groups[catVal].numbers.push(numRes.value);
        groups[catVal].rows.push(item.data);
      }

      const splitResults: { category: string; value: number; count: number }[] = [];
      let totalValidNumbers: number[] = [];

      for (const [cat, data] of Object.entries(groups)) {
        const agg = calculateAggregation(data.numbers, aggregation);
        splitResults.push({ category: cat, value: agg, count: data.numbers.length });
        totalValidNumbers = totalValidNumbers.concat(data.numbers);
      }

      const totalAgg = calculateAggregation(totalValidNumbers, aggregation);

      const whereClauses: string[] = [`"${column}" IS NOT NULL AND IS_NUMERIC("${column}")`];
      if (globalFilters.dateRange?.column) {
        whereClauses.push(
          `"${globalFilters.dateRange.column}" BETWEEN '${globalFilters.dateRange.start || 'MIN'}' AND '${globalFilters.dateRange.end || 'MAX'}'`
        );
      }
      if (globalFilters.categoryFilters) {
        for (const [col, vals] of Object.entries(globalFilters.categoryFilters)) {
          if (vals.length > 0) {
            whereClauses.push(`"${col}" IN (${vals.map((v) => `'${v}'`).join(', ')})`);
          }
        }
      }

      const query = `SELECT "${splitByCategory}", ${aggregation}("${column}") AS value, COUNT(*) AS count\nFROM "dataset_rows"\nWHERE ${whereClauses.join(' AND ')}\nGROUP BY "${splitByCategory}";`;

      const includedCount = totalValidNumbers.length;
      const excludedCount = totalDatasetRows - includedCount;

      return {
        title: title || `${aggregation} of ${column} by ${splitByCategory}`,
        blockType,
        computedValue: { total: totalAgg, breakdown: splitResults },
        plainEnglishExplanation: `Calculated ${aggregation} of '${column}' grouped by '${splitByCategory}'. Computed across ${includedCount} valid rows. Excluded ${excludedCount} rows (${excludedByDate.length} date filter, ${excludedByCategory.length} category filter, ${excludedByInvalidTarget.length} missing/invalid values, and ${unparseableCount} unparseable rows).`,
        exactQuery: query,
        formula: `${aggregation}(${column}) GROUP BY ${splitByCategory}`,
        totalDatasetRows,
        rowsIncluded: includedCount,
        rowsExcluded: excludedCount,
        exclusionBreakdown: {
          filteredByDateRange: excludedByDate.length,
          filteredByCategory: excludedByCategory.length,
          missingOrNullTargetValue: excludedByInvalidTarget.length,
          unparseableSourceRows: unparseableCount,
        },
        sampleIncludedRows: candidateRows.slice(0, 5).map((r) => r.data),
        sampleExcludedRows: [
          ...excludedByDate,
          ...excludedByCategory,
          ...excludedByInvalidTarget,
        ].slice(0, 5),
      };
    } else {
      // Single Metric
      const validNumbers: number[] = [];
      const includedRowSamples: Record<string, any>[] = [];

      for (const item of candidateRows) {
        const numRes = parseNumericValue(item.data[column]);
        if (!numRes.isNumber || numRes.value === undefined) {
          excludedByInvalidTarget.push({
            rowNumber: item.rowNumber,
            data: item.data,
            reason: `Target column '${column}' has non-numeric value: "${item.data[column]}"`,
          });
          continue;
        }
        validNumbers.push(numRes.value);
        if (includedRowSamples.length < 5) {
          includedRowSamples.push(item.data);
        }
      }

      const resultValue = calculateAggregation(validNumbers, aggregation);
      const includedCount = validNumbers.length;
      const excludedCount = totalDatasetRows - includedCount;

      const whereClauses: string[] = [`"${column}" IS NOT NULL AND IS_NUMERIC("${column}")`];
      if (globalFilters.dateRange?.column) {
        whereClauses.push(
          `"${globalFilters.dateRange.column}" BETWEEN '${globalFilters.dateRange.start || 'MIN'}' AND '${globalFilters.dateRange.end || 'MAX'}'`
        );
      }
      if (globalFilters.categoryFilters) {
        for (const [col, vals] of Object.entries(globalFilters.categoryFilters)) {
          if (vals.length > 0) {
            whereClauses.push(`"${col}" IN (${vals.map((v) => `'${v}'`).join(', ')})`);
          }
        }
      }

      const query = `SELECT ${aggregation}("${column}") AS result\nFROM "dataset_rows"\nWHERE ${whereClauses.join(' AND ')};`;

      return {
        title: title || `${aggregation} of ${column}`,
        blockType,
        computedValue: resultValue,
        plainEnglishExplanation: `Calculated ${aggregation} of '${column}' across ${includedCount} valid rows. Excluded ${excludedCount} rows from total dataset (${excludedByDate.length} date filter, ${excludedByCategory.length} category filter, ${excludedByInvalidTarget.length} blank/invalid numbers, and ${unparseableCount} unparseable source rows).`,
        exactQuery: query,
        formula:
          aggregation === 'AVG'
            ? `∑(${column}) / N`
            : `${aggregation}(${column})`,
        totalDatasetRows,
        rowsIncluded: includedCount,
        rowsExcluded: excludedCount,
        exclusionBreakdown: {
          filteredByDateRange: excludedByDate.length,
          filteredByCategory: excludedByCategory.length,
          missingOrNullTargetValue: excludedByInvalidTarget.length,
          unparseableSourceRows: unparseableCount,
        },
        sampleIncludedRows: includedRowSamples,
        sampleExcludedRows: [
          ...excludedByDate,
          ...excludedByCategory,
          ...excludedByInvalidTarget,
        ].slice(0, 5),
      };
    }
  }

  // Handle CHART block
  if (blockType === 'CHART') {
    const chartConfig = config as ChartConfig;
    const { chartType = 'bar', xColumn, yColumn, aggregation = 'SUM' } = chartConfig;

    const groupMap = new Map<string, { numbers: number[]; rows: any[] }>();

    for (const item of candidateRows) {
      const xVal = String(item.data[xColumn] || '(Blank)').trim();
      const numRes = parseNumericValue(item.data[yColumn]);

      if (!numRes.isNumber || numRes.value === undefined) {
        excludedByInvalidTarget.push({
          rowNumber: item.rowNumber,
          data: item.data,
          reason: `Metric column '${yColumn}' has non-numeric value: "${item.data[yColumn]}"`,
        });
        continue;
      }

      if (!groupMap.has(xVal)) {
        groupMap.set(xVal, { numbers: [], rows: [] });
      }
      const entry = groupMap.get(xVal)!;
      entry.numbers.push(numRes.value);
      entry.rows.push(item.data);
    }

    const chartData: { x: string; y: number; count: number }[] = [];
    let includedCount = 0;

    for (const [xVal, group] of groupMap.entries()) {
      const agg = calculateAggregation(group.numbers, aggregation);
      chartData.push({ x: xVal, y: agg, count: group.numbers.length });
      includedCount += group.numbers.length;
    }

    // Sort chart data chronologically if x is date, or alphabetically
    chartData.sort((a, b) => a.x.localeCompare(b.x));

    const whereClauses: string[] = [`"${yColumn}" IS NOT NULL AND IS_NUMERIC("${yColumn}")`];
    if (globalFilters.dateRange?.column) {
      whereClauses.push(
        `"${globalFilters.dateRange.column}" BETWEEN '${globalFilters.dateRange.start || 'MIN'}' AND '${globalFilters.dateRange.end || 'MAX'}'`
      );
    }
    if (globalFilters.categoryFilters) {
      for (const [col, vals] of Object.entries(globalFilters.categoryFilters)) {
        if (vals.length > 0) {
          whereClauses.push(`"${col}" IN (${vals.map((v) => `'${v}'`).join(', ')})`);
        }
      }
    }

    const query = `SELECT "${xColumn}" AS x, ${aggregation}("${yColumn}") AS y, COUNT(*) AS count\nFROM "dataset_rows"\nWHERE ${whereClauses.join(' AND ')}\nGROUP BY "${xColumn}"\nORDER BY "${xColumn}" ASC;`;

    const excludedCount = totalDatasetRows - includedCount;

    return {
      title: title || `${chartType.toUpperCase()} Chart: ${aggregation} of ${yColumn} by ${xColumn}`,
      blockType,
      computedValue: chartData,
      plainEnglishExplanation: `Plotted ${chartType.toUpperCase()} chart grouping by '${xColumn}' and computing ${aggregation} of '${yColumn}'. Aggregated ${includedCount} valid data points into ${chartData.length} categories/intervals. Excluded ${excludedCount} rows from total dataset.`,
      exactQuery: query,
      formula: `${aggregation}(${yColumn}) GROUP BY ${xColumn}`,
      totalDatasetRows,
      rowsIncluded: includedCount,
      rowsExcluded: excludedCount,
      exclusionBreakdown: {
        filteredByDateRange: excludedByDate.length,
        filteredByCategory: excludedByCategory.length,
        missingOrNullTargetValue: excludedByInvalidTarget.length,
        unparseableSourceRows: unparseableCount,
      },
      sampleIncludedRows: candidateRows.slice(0, 5).map((r) => r.data),
      sampleExcludedRows: [
        ...excludedByDate,
        ...excludedByCategory,
        ...excludedByInvalidTarget,
      ].slice(0, 5),
    };
  }

  throw new Error(`Unsupported block type: ${blockType}`);
}
