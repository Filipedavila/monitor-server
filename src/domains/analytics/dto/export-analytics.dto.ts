import { IsEnum } from 'class-validator';
import { Transform } from 'class-transformer';

export enum ExportFormat {
  CSV = 'csv',
  JSON = 'json',
  PARQUET = 'parquet',
}
export enum ExportContext {
  AMS = 'ams',
  OBS = 'obs',
  MYMONITOR = 'mymonitor',
  ACCESSMONITOR = 'accessmonitor',
}

export class ExportAnalyticsParamsDto {
  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEnum(ExportFormat, {
    message: `Formato de exportação inválido. Valores aceites: ${Object.values(ExportFormat).join(', ')}`,
  })
  format: ExportFormat;

  @Transform(({ value }) => (typeof value === 'string' ? value.toLowerCase().trim() : value))
  @IsEnum(ExportContext, {
    message: `Contexto de exportação inválido. Valores aceites: ${Object.values(ExportContext).join(', ')}`,
  })
  context: ExportContext;
}
