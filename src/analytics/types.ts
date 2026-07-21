export interface RuleMetrics {
  [ruleId: string]: number;
}

export interface GlobalSnapshot {
    quarter_start: string; 
    min_score: number;
    max_score: number;
    avg_score: number;
    count_evals: number;
    
    failed_rules_sums: RuleMetrics;
    passed_rules_sums: RuleMetrics;
}

export interface InstitutionSnapshot {
  quarter_start: string; 
  institution_id: string;
  min_score: number;
  max_score: number;
  avg_score: number;
  count_evals: number;
  
  failed_rules_sums: RuleMetrics;
  passed_rules_sums: RuleMetrics;
}

export interface DirectorySnapshot {
    quarter_start: string; 
    directory_id: string;   
    min_score: number;
    max_score: number;
    avg_score: number;
    count_evals: number;
    
    failed_rules_sums: RuleMetrics;
    passed_rules_sums: RuleMetrics;
}

export interface WebsiteSnapshot {
  quarter_start: string; 
  website_id: string;
  min_score: number;
  max_score: number;
  avg_score: number;
  count_evals: number;
  
  failed_rules_sums: RuleMetrics;
  passed_rules_sums: RuleMetrics;
}

export interface PageSnapshot {
  quarter_start: string; 
  website_id: string;
  page_id: string;
  min_score: number;
  max_score: number;
  avg_score: number;
  count_evals: number;
  
  failed_rules_sums: RuleMetrics;
  passed_rules_sums: RuleMetrics;
}