import { ExecutionContext, Injectable } from '@nestjs/common';
import { ThrottlerGuard } from '@nestjs/throttler';
import { GqlExecutionContext } from '@nestjs/graphql';

@Injectable()
export class HybridRateLimiterGuard extends ThrottlerGuard {
    
  protected getRequestResponse(context: ExecutionContext) {
   if (context.getType<string>() === 'graphql') {
      const gqlCtx = GqlExecutionContext.create(context);
      const ctx = gqlCtx.getContext();
      return { req: ctx.req, res: ctx.req.res };
    }
    const http = context.switchToHttp();
    return { req: http.getRequest(), res: http.getResponse() };
  }
}