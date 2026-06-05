import { Inject, Injectable } from '@nestjs/common';
import { OpenFgaClient, Tuple, TupleKeyWithoutCondition } from '@openfga/sdk';
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

  async deleteRelationship<T extends ResourceType>(
    tuple: FgaTuple<T>
  ): Promise<any> {
    return this.fgaClient.write({
      deletes: [tuple],
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
  async findAllTuplesRelatedToUser(userId: number): Promise<{
    asSubject: Tuple[];
    asObject: Tuple[];
    all: Tuple[];
  }> {
    const userIdentifier = `user:${userId}`;

    const [subjectResponse, objectResponse] = await Promise.all([
      this.fgaClient.read({
        user: userIdentifier,
      }),
      
      this.fgaClient.read({
        object: userIdentifier,
      }),
    ]);

    const asSubject = subjectResponse.tuples || [];
    const asObject = objectResponse.tuples || [];
    
    // Consolidação de segurança num único array limpo
    const all = [...asSubject, ...asObject];

    return {
      asSubject,
      asObject,
      all,
    };
  }

  async findObjectsRelated<T extends ResourceType>(userId: number, objectType?: ResourceType,relation?: FgaTuple<T>['relation']): Promise<{
   related:string[];
  }> {
    const userIdentifier = `user:${userId}`;
    const relatedObjects = new Set<string>();
    let continuationToken: string | undefined = undefined;


    do {
      const response = await this.fgaClient.read({
        user: userIdentifier,
        relation: relation,
        object: objectType, 
    }, {
      continuationToken: continuationToken 
    });

    if (response.tuples && response.tuples.length > 0) {
      for (const tuple of response.tuples) {
        const fullObjectString = tuple.key.object; 

        if (objectType) {
    
          const idOnly = fullObjectString.split(':')[1];
          if (idOnly) relatedObjects.add(idOnly);
        } else {
          relatedObjects.add(fullObjectString);
        }
      }
    }
    continuationToken = response.continuation_token;
  } while (continuationToken);

  return {
    related: Array.from(relatedObjects),
  };
}

 async purgeAllTuplesForUser(userId: number): Promise<{ deletedCount: number }> {
    const userIdentifier = `user:${userId}`;
    let continuationToken: string | undefined = undefined;
    let totalDeleted = 0;

    do {
      const response = await this.fgaClient.read({
        user: userIdentifier,
      }, {
        continuationToken: continuationToken
      });

      if (response.tuples && response.tuples.length > 0) {
        const batchDeletes: TupleKeyWithoutCondition[] = response.tuples.map(tuple => ({
          user: tuple.key.user,
          relation: tuple.key.relation,
          object: tuple.key.object,
        }));

 
        const chunkSize = 100;
        for (let i = 0; i < batchDeletes.length; i += chunkSize) {
          const chunk = batchDeletes.slice(i, i + chunkSize);
          
          await this.fgaClient.write({
            deletes: chunk
          });
          
          totalDeleted += chunk.length;
        }
      }

      continuationToken = response.continuation_token;
    } while (continuationToken);

    return { deletedCount: totalDeleted };
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