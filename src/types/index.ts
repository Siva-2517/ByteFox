export type ColumnType = 'number' | 'date' | 'category' | 'text';

export interface ColumnProfile {
  name: string;
  type: ColumnType;
  totalCount: number;
  nullCount: number;
  emptyCount: number;
  validCount: number;
  distinctCount: number;
  sampleValues: (string | number)[];
  min?: number | string;
  max?: number | string;
  mean?: number;
}

export interface UnparseableRow {
  line: number;
  raw: string;
  reason: string;
}

export interface DatasetProfile {
  rowCount: number;
  validRowCount: number;
  unparseableCount: number;
  columns: ColumnProfile[];
  unparseableRows: UnparseableRow[];
}

export interface DateRangeFilter {
  column: string;
  start?: string; // YYYY-MM-DD
  end?: string;   // YYYY-MM-DD
}

export interface GlobalFilters {
  dateRange?: DateRangeFilter;
  categoryFilters?: Record<string, string[]>; // column -> selected values
}

export type AggregationType = 'SUM' | 'AVG' | 'COUNT' | 'MIN' | 'MAX';

export interface MetricConfig {
  column: string;
  aggregation: AggregationType;
  splitByCategory?: string;
  customLabel?: string;
}

export interface ChartConfig {
  chartType: 'bar' | 'line';
  xColumn: string;
  yColumn: string;
  aggregation: AggregationType;
  splitByCategory?: string;
  customLabel?: string;
}

export interface TableConfig {
  columns: string[];
  sortColumn?: string;
  sortDirection?: 'asc' | 'desc';
  limit: number;
}

export interface TextNoteConfig {
  content: string;
}

export type BlockType = 'METRIC' | 'CHART' | 'TABLE' | 'TEXT_NOTE';

export interface BlockConfigMap {
  METRIC: MetricConfig;
  CHART: ChartConfig;
  TABLE: TableConfig;
  TEXT_NOTE: TextNoteConfig;
}

export interface AuditBreakdown {
  filteredByDateRange: number;
  filteredByCategory: number;
  missingOrNullTargetValue: number;
  unparseableSourceRows: number;
}

export interface SampleExcludedRow {
  rowNumber: number;
  data: Record<string, any>;
  reason: string;
}

export interface AuditResult {
  title: string;
  blockType: BlockType;
  computedValue: any;
  plainEnglishExplanation: string;
  exactQuery: string;
  formula: string;
  totalDatasetRows: number;
  rowsIncluded: number;
  rowsExcluded: number;
  exclusionBreakdown: AuditBreakdown;
  sampleIncludedRows: Record<string, any>[];
  sampleExcludedRows: SampleExcludedRow[];
}

export interface UserSession {
  id: string;
  email: string;
  name: string;
}
