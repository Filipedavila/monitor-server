import { ComplianceMetrics, BadgeMetrics } from './common';
import { WebsiteRank } from './directory';
import { AuditItemDirectory } from './metrics';

export interface DeclarationSummary {
  score: number;
  total: ComplianceMetrics;
  currentYear: ComplianceMetrics;
}

export interface BadgeSummary {
  total: BadgeMetrics;
  currentYear: BadgeMetrics;
}

export interface RulesSummary {
  topBestPractices: AuditItemDirectory[];
  topErrors: AuditItemDirectory[];
}

export interface ConformanceSummary {
  declarations: DeclarationSummary;
  badges: BadgeSummary;
}

export interface GlobalStatistics {
  directoriesCount: number;
  websitesCount: number;
  entitiesCount: number;
  pagesCount: number;
  pagesWithoutErrorsCount: number;
  recentPageDate: string;
  oldestPageDate: string;
  topWebsites: WebsiteRank[];
  rulesSummary: RulesSummary;
  conformanceSummary: ConformanceSummary;
}
