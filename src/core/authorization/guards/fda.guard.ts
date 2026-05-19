import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FgaService } from '../fga.service';
import {  FgaObjectIdentifier, FgaUserIdentifier, ResourceType } from '../types/fga.types';
import { FGA_DECORATOR_KEY, FgaMetadata } from '../decorators/fga-authorization.decorator';

@Injectable()
export class FgaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private fgaService: FgaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const fgaTuple:FgaMetadata<ResourceType> = this.reflector.get<FgaMetadata<ResourceType>>(
      FGA_DECORATOR_KEY,
      context.getHandler(),
    );

    if (!fgaTuple) return true; 

    const request = context.switchToHttp().getRequest();
    
    const userId = request.user?.id; 
    if (!userId) throw new ForbiddenException('User not authenticated');
    
    const subject = `user:${userId}`;

    const objectId = fgaTuple.resourceIdResolver?.(context);
    if (!objectId) throw new ForbiddenException('Unable to resolve resource ID');

    const object: FgaObjectIdentifier<ResourceType> = `${fgaTuple.objectType}:${objectId}`;
    
    const allowed = await this.fgaService.check(
      subject as FgaUserIdentifier<ResourceType>,
      fgaTuple.action,
      object,
    );

    if (!allowed) {
      throw new ForbiddenException('Access denied by authorization policy');
    }

    return true;
  }
}