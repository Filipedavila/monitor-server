import { Inject, Injectable } from '@nestjs/common';
import { OpenFgaClient } from '@openfga/sdk';
import { FGA_CLIENT } from './fga.provider';
import {  
  FgaTuple, 
  ResourceType, 
  FgaUserIdentifier, 
  FgaObjectIdentifier, 
  FGA_RESOURCE,
  FGA_RELATION,
} from './types/fga.types'; 

@Injectable()
export class FgaService {
  constructor(@Inject(FGA_CLIENT) private readonly fgaClient: OpenFgaClient) {}

 
  async listObjects<T extends ResourceType>(params: { 
    user: FgaUserIdentifier<T>; 
    relation: FgaTuple<T>['relation']; 
    type: T 
  }): Promise<string[]> {
    const response = await this.fgaClient.listObjects(params);
    return response.objects || [];
  }


  async check<T extends ResourceType>(
    user: FgaUserIdentifier<T>, 
    relation: FgaTuple<T>['relation'],
    object: FgaObjectIdentifier<T>
  ): Promise<boolean> {
    const { allowed } = await this.fgaClient.check({ user, relation, object });
    return allowed ?? false;
  }


  async createRelationship<T extends ResourceType>(
    tuple: FgaTuple<T>
  ): Promise<any> {
    return this.fgaClient.write({
      writes: [tuple],
    });
  }
  
  async createBatchesRelationships<T extends ResourceType>(tuples: FgaTuple<T>[]): Promise<any> {
    return this.fgaClient.write({
      writes: tuples,
    });
  }

  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.check(
      `user:${userId}`,
      FGA_RELATION.ROLE, 
      `${FGA_RESOURCE.ROLE}:admin`
    );
  }

  async isMonitor(userId: number): Promise<boolean> {
    return this.check(
      `user:${userId}`,
      FGA_RELATION.ROLE, 
      `${FGA_RESOURCE.ROLE}:monitor`
    );
  }

  async isStudy(userId: number): Promise<boolean> {
    return this.check(
      `user:${userId}`,
      FGA_RELATION.ROLE, 
      `${FGA_RESOURCE.ROLE}:study`
    );
  } 


  async deleteResourceTuples<T extends ResourceType>(
    object: FgaObjectIdentifier<T>
  ): Promise<void> {
    const { tuples } = await this.fgaClient.read({
      object: object,
    });

    if (!tuples || tuples.length === 0) return;

    const deleteOps = tuples.map(tuple => ({
      user: tuple.key.user,
      relation: tuple.key.relation,
      object: tuple.key.object,
    }));

    await this.fgaClient.write({
      deletes: deleteOps,
    });
  }
}