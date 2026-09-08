export interface TableMetadataDescriptor {
  readonly table: string;
  readonly alias: string;
  readonly pk: string;
  readonly fk: string;
}

export interface ContextRuleTablesMap {
  readonly mainTable: TableMetadataDescriptor;
  readonly contextTable: TableMetadataDescriptor;
  readonly helperTable?: TableMetadataDescriptor;
  readonly hasHelperTable: boolean;
  readonly teamUserTable: TableMetadataDescriptor;
  readonly teamWebsiteTable: TableMetadataDescriptor;
}

// Defaults canónicos imutáveis da infraestrutura
export const DEFAULT_CONTEXT_METADATA: Pick<
  ContextRuleTablesMap,
  'teamUserTable' | 'teamWebsiteTable'
> = Object.freeze({
  teamUserTable: {
    table: 'team_member',
    alias: 'tm',
    pk: 'id',
    fk: 'user_id',
  },
  teamWebsiteTable: {
    table: 'team_websites',
    alias: 'tw',
    pk: 'id',
    fk: 'website_id',
  },
});

// Configuração mínima exigida às classes filhas / factories
export interface RepositoryTableConfig {
  readonly mainTable: TableMetadataDescriptor;
  readonly contextTable: TableMetadataDescriptor;
  readonly hasHelperTable: boolean;

  readonly helperTable?: TableMetadataDescriptor;
  // Overrides opcionais para flexibilidade em schemas legados ou multi-tenant
  readonly teamUserTable?: Partial<TableMetadataDescriptor>;
  readonly teamWebsiteTable?: Partial<TableMetadataDescriptor>;
}

export const BASE_CONTEXT_CONFIG_TOKEN = Symbol('CONFIG_TOKEN');
