import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { EnquireRelationType, FgaTupleEnquire , ResourceType} from '../types/fga.types';

export interface FgtaTupleCheck<T extends ResourceType, E extends keyof EnquireRelationType> {
  objectType: T;
  action: FgaTupleEnquire<E>['relation'];
  resourceIdResolver?: (ctx: ExecutionContext) => string | undefined;
}
export const FGA_DECORATOR_KEY = 'fga_authorization';
export const FgaAuthorized = <T extends ResourceType, E extends keyof EnquireRelationType>(data: FgtaTupleCheck<T, E>) => SetMetadata(FGA_DECORATOR_KEY, data);