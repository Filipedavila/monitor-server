
import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from "@nestjs/common";
import { Observable } from "rxjs";
import { tap } from "rxjs/operators";
import { AppLoggerService } from "../app-logger/app-logger.service";

@Injectable()
export class LoggingInterceptor implements NestInterceptor {

  constructor(private readonly logger: AppLoggerService) {
    this.logger.setContext("HTTP");
  }

  async intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Promise<Observable<any>> {
    const request = context.switchToHttp().getRequest();
    const { method, url, body: reqBody, user } = request;

    return next.handle().pipe(
      tap({
        next: (data) => {
          let bodyLog = reqBody ? JSON.stringify(reqBody) : "{}";
          
          if (bodyLog && bodyLog.length > 400) {
            bodyLog = bodyLog.substring(0, 400) + "...(truncated)";
          }

          const logData = {
            path: url,
            method,
            origin: request.headers["x-forwarded-for"] || request.ip,
            body: bodyLog,

            user: user?.id || request.user?.id || "anonymous",
          };

          this.logger.log(JSON.stringify(logData));
        },
        error: (err) => {
          this.logger.error(`Request failed: ${method} ${url}`, err.stack);
        }
      }),
    );
  }
}
