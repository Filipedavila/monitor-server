import { Injectable, NestInterceptor, ExecutionContext, CallHandler } from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  data: T | T[];
  timestamp: string;
  pagination?: {
  totalItems: number;    
  itemCount: number;     
  itemsPerPage: number;  
  totalPages: number;    
  currentPage: number;   
}
}

@Injectable()
export class ResponseTransformInterceptor<T> implements NestInterceptor<T, Response<T>> {
intercept(context: ExecutionContext, next: CallHandler): Observable<any> {
    return next.handle().pipe(
      map(result => {

        if (!result || typeof result !== 'object') {
          return { timestamp: new Date().toISOString(), data: result };
        }

        const isPaginated = 'data' in result && 'count' in result;

        return {
          timestamp: new Date().toISOString(),
          data: isPaginated ? result.data : result,
          ...(isPaginated && {
            pagination: {
              total: result.count,
//              page: result.page, 
  //            limit: result.limit
            },
          }),
        };
      }),
    );
  }
}