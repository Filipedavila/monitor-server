import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import * as qs from 'qs';

export const NestedQuery = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    
    return qs.parse(request.query, { 
      allowDots: true, 
      allowSparse: true 
    });
  },
);