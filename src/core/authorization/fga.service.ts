import { Inject, Injectable } from '@nestjs/common';
import { OpenFgaClient } from '@openfga/sdk';
import { FGA_CLIENT } from './fga.provider';
import { 
  FgaCheck, 
  FgaTuple, 
  ResourceType, 
  FgaUserIdentifier, 
  FgaObjectIdentifier, 
  FGA_RESOURCE,
  FGA_RELATION,
  FgaModelMap
} from './types/fga.types'; 

@Injectable()
export class FgaService {
  constructor(@Inject(FGA_CLIENT) private readonly fgaClient: OpenFgaClient) {}

 
  async listObjects<T extends ResourceType>(params: { 
    user: FgaUserIdentifier; 
    relation: FgaCheck<T>['relation']; 
    type: T 
  }): Promise<string[]> {
    const response = await this.fgaClient.listObjects(params);
    return response.objects || [];
  }


  async check<T extends ResourceType>(
    user: FgaUserIdentifier, 
    relation: FgaModelMap[Extract<T, keyof FgaModelMap>],
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

  async isSystemAdmin(userId: number): Promise<boolean> {
    return this.check<typeof FGA_RESOURCE.ROLE>(
      `user:${userId}`,
      FGA_RELATION.ADMIN, 
      `${FGA_RESOURCE.ROLE}:global`
    );
  }

  async isMonitor(userId: number): Promise<boolean> {
    return this.check<typeof FGA_RESOURCE.ROLE>(
      `user:${userId}`,
      FGA_RELATION.MONITOR, 
      `${FGA_RESOURCE.ROLE}:global`
    );
  }

  async isStudy(userId: number): Promise<boolean> {
    return this.check<typeof FGA_RESOURCE.ROLE>(
      `user:${userId}`,
      FGA_RELATION.STUDY, 
      `${FGA_RESOURCE.ROLE}:global`
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