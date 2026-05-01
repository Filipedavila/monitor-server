import { SetMetadata } from '@nestjs/common';
import { CanActivate, ExecutionContext, Injectable, ForbiddenException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { FgaService } from '../fga.service';
import { FgaModelMap, FgaObjectIdentifier, FgaUserIdentifier } from '../types/fga.types';
export const CheckPermission = (relation: string, objectType: string) => 
  SetMetadata('fga_permission', { relation, objectType });



@Injectable()
export class FgaGuard implements CanActivate {
  constructor(
    private reflector: Reflector,
    private fgaService: FgaService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const permission = this.reflector.get<{ relation: FgaModelMap[Extract<keyof FgaModelMap, string>],  objectType: string }>(
      'fga_permission',
      context.getHandler(),
    );

    if (!permission) return true; 

    const request = context.switchToHttp().getRequest();
    
    const userId = request.user?.id; 
    if (!userId) throw new ForbiddenException('User not authenticated');

    
    const objectId = request.params.id;
    if (!objectId) throw new ForbiddenException('Resource ID not found in request');

    
    const fgaUser:FgaUserIdentifier = `user:${userId}`;
    const fgaObject:FgaObjectIdentifier<any> = `${permission.objectType}:${objectId}`;

    
    const allowed = await this.fgaService.check(
      fgaUser,
      permission.relation,
      fgaObject,
    );

    if (!allowed) {
      throw new ForbiddenException(`User ${userId} does not have ${permission.relation} on ${fgaObject}`);
    }

    return true;
  }
}