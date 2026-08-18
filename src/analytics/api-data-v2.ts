import { Quartile } from "./statistic_types";

// Tipagem para estados de conformidade (repetido, mas lógico)
export interface ComplianceStatus {
  conform: number;
  partial: number;
  not_conform: number;
}

export interface ComplianceMetrics {
  websites: ComplianceStatus;
  apps: ComplianceStatus;
}

export type Result = 'passed' | 'failed';
export type Level = 'A' | 'AA' | 'AAA';

export interface BadgesCount {
  gold: number;
  silver: number;
  bronze: number;
}

export interface BadgeMetrics {
  websites: BadgesCount;
  apps: BadgesCount;
}


export interface WebsiteRank {
  index: number;
  id: number;
  directoryId: number;
  entity: string;
  name: string;
  score: number;
}

export interface WebsiteDetails {
  id: number;
  name: string;
  url: string;
  oldestPageDate: string;
  recentPageDate: string;
  score: number;
  pagesCount: number;
  institution: string;
  pageWithErrorsCount: number;
  pagesWithoutErrorsA: number;
  pagesWithoutErrorsAA: number;
  pagesWithoutErrorsAAA: number;
  pagesWithoutErrors: number;
  accessibilityPlotData: number[];
  scoreDistributionFrequency: number[];
  errorsDistribution: AuditItemWebsite;
  bestPracticesDistribution: AuditItemWebsite;
  errors: StatsContainer;
}
export interface AuditItemDirectory {
  key: string;
  occurrenceCount: number;
  pagesCount: number;
  websitesCount: number;
}

export interface WebsiteRankingDetailed  {
  id: number;
  rank: number;
  name: string;
  entity: string;
  declaration: number | null;
  stamp: number | null;
  score: number;
  nPages: number;
  A: number;
  AA: number;
  AAA: number;
  
  
}
export interface AuditItemWebsite {
  key: string;
  occurrenceCount: number;
  pagesCount: number;
}

export interface GlobalStatistics {
  score: number;
  directoriesCount: number;
  websitesCount: number;
  entitiesCount: number;
  pagesCount: number;
  pagesWithoutErrorsCount: number;
  recentPageDate: string; 
  oldestPageDate: string;
  topWebsites: WebsiteRank[];
  topBestPractices: AuditItemDirectory[];
  topErrors: AuditItemDirectory[];
  declarations: {
    total: ComplianceMetrics;
    currentYear: ComplianceMetrics;
  };
  badges: {
    total: BadgeMetrics;
    currentYear: BadgeMetrics;
  };
}


// Directories summary data
export interface DirectoryDetails {
  id: number;
  name: string;
  oldestPageDate: string;
  recentPageDate: string;
  score: number;
  entitiesCount: number;
  websitesCount: number;
  pagesCount: number;
  scoreDistributionFrequency: number[];

  errorDistribution: StatsContainer;
  graphData: GraphDataEntry[];
  showTableData: TableDataEntry[];
}
export interface TableDataEntry {
  key: string;
  level: Level;
  element: string;
  websitesCount: number;
  pagesCount: number;
  elementsCount: number;
  quartiles: Quartile[];
  elementGroup?: string;
}

export interface GraphDataEntry {
  key: string;
  element: string;
  pagesCount: number;
  websitesCount: number;
  result: Result;
}

export interface StatsContainer {
  errors?: Record<string, MetricOccurrence>;
  success?: Record<string, MetricOccurrence>;
  graphData: GraphDataEntry[];
  showTableData: TableDataEntry[];
}
export interface MetricOccurrence {
  occurrencesCount: number;
  pagesCount: number;
  websitesCount: number;
  tagsCount?: number;
}
export interface DirectorySummary {
  id: number;
  rank: number;
  name: string;
  declarations: number;
  stamps: number;
  score: number;
  websites: number;
  A: number;
  AA: number;
  AAA: number;
}
export interface DirectoriesStats {
  score: number;
  directoriesCount: number;
  websitesCount: number;
  entitiesCount: number;
  pagesCount: number;
  recentPageDate: string; 
  oldestPageDate: string;
}


export interface AuditMetric {
  pageCount: number;
  occurrenceCount: number;
  element: string;
  testName: string;
  result: Result;
}

export interface QuartileData {
  total: number;
  percentage: number;
  interval: {
    lower: number;
    upper: number;
  };
}

export interface AuditPracticeDetail {
  key: string;
  occurrenceCount: number;
  pageCount: number;
  level: Level;
  quartiles: QuartileData[];
}

export interface DetailedDataTable {
  keys: string[];
  data: AuditPracticeDetail[];
}

export interface WebsiteAuditReport {
  id: number;
  name: string;
  url: string;
  oldestPageDate: string;
  recentPageDate: string;
  score: number;
  pageCount: number;
  institutionName: string;
  pagesWithErrorsCount: number;
  pagesWithoutErrorsA: number;
  pagesWithoutErrorsAA: number;
  pagesWithoutErrorsAAA: number;
  pagesWithoutErrorsCount: number;
  accessibilityPlotData: number[];
  scoreDistributionFrequency: number[];
  errorsDistribution: AuditItemWebsite[]; 
  bestPracticesDistribution: AuditItemWebsite[];
  errorMetrics: Record<string, AuditMetric>;
  successMetrics: Record<string, AuditMetric>;
  successDetailsTable: DetailedDataTable;
  errorsDetailsTable: DetailedDataTable;
}