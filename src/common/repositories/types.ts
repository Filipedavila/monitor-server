export interface ContextRuleTablesMap {
  mainTable: {
    table: string;
    pk: string;
    alias: string;
    fk: string;
  };
  contextTable: {
    table: string;
    pk: string;
    alias: string;
    fk: string;
  };
  helperTable: {
    table: string;
    pk: string;
    alias: string;
    fk: string;
  };
  teamUserTable: {
    table: string;
    pk: string;
    alias: string;
    fk: string;
  };
  teamWebsiteTable: {
    table: string;
    pk: string;
    alias: string;
    fk: string;
  };
}
