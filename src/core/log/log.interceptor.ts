// logging.interceptor.ts
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
  // 1. Remove o @Inject(WINSTON_MODULE_PROVIDER)
  // 2. Injeta diretamente o teu AppLoggerService
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
      tap((data) => {
        let bodyLog = JSON.stringify(reqBody);
        if (bodyLog.length > 400) bodyLog = bodyLog.substring(0, 400);

        const logData = {
          path: url,
          method,
          origin: request.headers["x-forwarded-for"] || request.ip,
          body: bodyLog,
          user: user?.id || "anonymous",
        };

        this.logger.log(JSON.stringify(logData));
      }),
    );
  }
}
