import { Injectable, Scope,LoggerService } from "@nestjs/common";
import * as winston from "winston";
import { IAppLogger } from "./app-logger.interface";

const winstonInstance = winston.createLogger({
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
    new winston.transports.File({ filename: "error-log/error.log", level: "error" }),
    new winston.transports.File({ filename: "action-log/combined.log" }),
  ],
});

@Injectable({ scope: Scope.TRANSIENT })
export class AppLoggerService implements LoggerService {
  private context?: string;

  setContext(context: string) {
    this.context = context;
  }

  log(message: any, context?: string) {
    winstonInstance.info(message, { context: context || this.context });
  }

  error(message: any, stack?: string, context?: string) {
    winstonInstance.error(message, { 
      stack, 
      context: context || this.context 
    });
  }

  warn(message: any, context?: string) {
    winstonInstance.warn(message, { context: context || this.context });
  }

  debug?(message: any, context?: string) {
    winstonInstance.debug(message, { context: context || this.context });
  }
}