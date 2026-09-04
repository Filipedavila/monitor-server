import { AuditItemWebsite } from './metrics';

export interface SystemEvaluationsSummary {
  evalCount: number;
  dateCountStart: string;
  processing: number;
  waiting: number;
  failed: number;
}

export interface AmsMetrics {
  directories: number;
  tags: number;
  entities: number;
  websites: number;
  pages: number;
  users: number;
  govUsers: number;
  evaluations: SystemEvaluationsSummary;
}

export interface ObservatoryMetrics {
  directories: number;
  tags: number | string;
  entities: number;
  websites: number;
  pages: number;
}

export interface MyMonitorMetrics {
  users: number;
  teams: number;
  websites: number | string;
  pages: number | string;
  evaluations: SystemEvaluationsSummary;
}

export interface AccessMonitorMetrics {
  evalCount: number;
  dateCountStart: string;
}

export interface PlatformOverviewMetricsResponse {
  ams: AmsMetrics;
  observatory: ObservatoryMetrics;
  mymonitor: MyMonitorMetrics;
  accessmonitor: AccessMonitorMetrics;
}

export interface GlobalMetricsResponse {
  ams: GlobalMetrics;
  observatory: GlobalMetrics;
}

export interface GlobalMetrics {
  score: number;
  recentPageDate: string;
  oldestPageDate: string;
  directoriesCount: number;
  institutionsCount: number;
  websitesCount: number;
  pagesCount: number;
  avgPagesPerWebsite: number;
  websitesConformance: {
    conformWebsitesCount: number;
    nonConformWebsitesCount: number;
    A: number;
    AA: number;
    AAA: number;
  };
  scoreDistribution: number[];
  accessibilityPlotData: number[];
  errorsDistribution: AuditItemWebsite[];
  bestPracticesDistribution: AuditItemWebsite[];
}
