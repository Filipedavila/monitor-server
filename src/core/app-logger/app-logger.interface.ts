import { LoggerService } from "@nestjs/common";

export interface IAppLogger extends LoggerService {
  log(message: string, context?: string): void;
  error(message: string, trace?: string, context?: string): void;
  warn(message: string, context?: string): void;
}
