import { ExecutionContext, SetMetadata } from '@nestjs/common';
import { FgaModelMap, ResourceType } from '../types/fga.types';

export interface FgaMetadata<T extends ResourceType> {
  objectType: T;
  action: FgaModelMap[Extract<T, keyof FgaModelMap>];
  resourceIdResolver?: (ctx: ExecutionContext) => string | undefined;
}
export const FGA_DECORATOR_KEY = 'fga_authorization';
export const FgaAuthorized = <T extends ResourceType>(data: FgaMetadata<T>) => SetMetadata(FGA_DECORATOR_KEY, data);