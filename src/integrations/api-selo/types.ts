
export type WebsiteInfo = {
  id: number;
  Name: string;
  url: string;
  entidade: string;
  selo: string;
  data_selo: string;
  declaracao: string;
  data_declaracao: string;
  url_observatorio: string;
};
export interface StampRow {
  id: number;
  Name: string;
  url: string;
  entidade: string;
  selo: number;
  data_selo: string;
  declaracao: number; 
  data_declaracao: string;
  id_diretorio: number;
}

export const STAMP_MAP = { 1: 'Bronze', 2: 'Prata', 3: 'Ouro' };
export const DECLARATION_MAP = { 1: 'Não conforme', 2: 'Parcialmente conforme', 3: 'Conforme' };
