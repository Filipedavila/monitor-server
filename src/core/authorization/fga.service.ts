import { Inject, Injectable } from '@nestjs/common';
import { ClientListRelationsRequest, OpenFgaClient, Tuple, TupleKeyWithoutCondition } from '@openfga/sdk';
import { FGA_CLIENT } from './fga.provider';
import {  
  FgaTupleEnquire, 
  ResourceType, 
  FgaUserIdentifier, 
  FgaObjectIdentifier, 
  FGA_RESOURCE,
  FgaTupleAssign,
  AssignableResource,
  EnquireableResource
} from './types/fga.types'; 

@Injectable()
export class FgaService {
  constructor(@Inject(FGA_CLIENT) private readonly fgaClient: OpenFgaClient) {}

  public makeFgaTuple<T extends ResourceType, A extends AssignableResource>(
  type: A,
  id: string,
  relation: FgaTupleAssign<T, A>['relation'],
  user: FgaUserIdentifier<T>
): FgaTupleAssign<T, A> {
  return {
    user,
    relation,
    object: `${type}:${id}`,
  };
}

async removeUserRelations<T extends ResourceType, A extends AssignableResource>(
  type: T,
  userId: string,
  objectId: string,
  relationsToRemove?: FgaTupleAssign<T, A>['relation'][]
): Promise<void> {
  const user = `user:${userId}`;
  const object = `${type}:${objectId}`; 
  
  let continuationToken: string | undefined = undefined;
  const tuplesToDelete: Tuple[] = [];

  do {
    const response = await this.fgaClient.read({ user, object }, { continuationToken });
    
    if (response.tuples) {
      const filtered = relationsToRemove && relationsToRemove.length > 0
        ? response.tuples.filter(t => relationsToRemove.includes(t.key.relation as any))
        : response.tuples;
      
      tuplesToDelete.push(...filtered);
    }
    
    continuationToken = response.continuation_token;
  } while (continuationToken);

  if (tuplesToDelete.length === 0) return;

  await this.fgaClient.write({
    deletes: tuplesToDelete.map(t => ({
      user: t.key.user,
      relation: t.key.relation,
      object: t.key.object,
    }))
  });
}
  async listObjects<T extends ResourceType, C extends EnquireableResource>(params: { 
    user: FgaUserIdentifier<T>; 
    relation: FgaTupleEnquire<C>['relation']; 
    type: T 
  }): Promise<string[]> {
    const response = await this.fgaClient.listObjects(params);
    return response.objects || [];
  }

  async listObjectsWithRelations<T extends ResourceType,  A extends AssignableResource>( type: T, params: {
    user: FgaUserIdentifier<T>,
    relations: FgaTupleAssign<T, A>['relation'][],
    object:FgaObjectIdentifier<T>}): Promise<string[]> {
    
      const response = await this.fgaClient.listRelations(params);
    
    return response.relations || [];
  }


  async check<T extends ResourceType,C extends EnquireableResource>(
    user: FgaUserIdentifier<T>, 
    relation: FgaTupleEnquire<C>['relation'],
    object: FgaObjectIdentifier<T>
  ): Promise<boolean> {
    const { allowed } = await this.fgaClient.check({ user, relation, object });
    return allowed ?? false;
  }
  

  async createRelationship<T extends ResourceType, A extends AssignableResource>(
    tuple: FgaTupleAssign<T, A>
  ): Promise<any> {
    return this.fgaClient.write({
      writes: [tuple],
    });
  }

  async deleteRelationship<T extends ResourceType, A extends AssignableResource>(
    tuple: FgaTupleAssign<T, A>
  ): Promise<any> {
    return this.fgaClient.write({
      deletes: [tuple],
    });
  }
  
  async createBatchesRelationships<T extends ResourceType, A extends AssignableResource>(tuples: FgaTupleAssign<T, A>[]): Promise<any> {
    return this.fgaClient.write({
      writes: tuples,
    });
  }

  async deleteBatchesRelationships<T extends ResourceType, A extends AssignableResource>(tuples: FgaTupleAssign<T, A>[]): Promise<any> {
    return this.fgaClient.write({
      deletes: tuples,
    });
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

  async findObjectsRelated<T extends ResourceType, A extends AssignableResource>(userId: number, objectType?: A,relation?: FgaTupleAssign<T, A>['relation']): Promise<{
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

    let continuationToken: string | undefined = undefined;
    let totalDeleted = 0;

    do {
      const response = await this.fgaClient.read({
        object: object,
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
  }
}