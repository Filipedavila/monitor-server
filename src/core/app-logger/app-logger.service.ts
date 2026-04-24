import { Injectable, Scope } from "@nestjs/common";
import * as winston from "winston";
import { IAppLogger } from "./app-logger.interface";
@Injectable({
  scope: Scope.TRANSIENT,
})
@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements IAppLogger {
  private readonly logger: winston.Logger;
  private context?: string;
  constructor() {
    this.logger = winston.createLogger({
      level: "info",
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json(),
      ),
      transports: [
        new winston.transports.Console({
          format: winston.format.combine(
            winston.format.colorize(),
            winston.format.simple(),
          ),
        }),
        new winston.transports.File({
          filename: "error-log/error.log",
          level: "error",
        }),
        new winston.transports.File({ filename: "action-log/combined.log" }),
      ],
    });
  }
  setContext(context: string) {
    this.context = context;
  }
  log(message: string, context?: string) {
    this.logger.info(message, { context: context || this.context });
  }

  error(message: string, trace?: string, context?: string) {
    this.logger.error(message, {
      stack: trace,
      context: context || this.context,
    });
  }

  warn(message: string, context?: string) {
    this.logger.warn(message, { context: context || this.context });
  }
}
