import { Inject, Injectable } from '@nestjs/common';
import { ClientWriteResponse, OpenFgaClient, Tuple, TupleKeyWithoutCondition } from '@openfga/sdk';
import { FGA_CLIENT } from './fga.provider';
import { FgaRoleSlug, UserPermission } from '../authentication/interfaces/types';
import {
  FgaTupleEnquire,
  ResourceType,
  FgaUserIdentifier,
  FgaObjectIdentifier,
  FgaTupleAssign,
  AssignableResource,
  EnquireableResource,
} from './types/fga.types';

@Injectable()
export class FgaService {
  constructor(@Inject(FGA_CLIENT) private readonly fgaClient: OpenFgaClient) {}

  public makeFgaTuple<T extends ResourceType, A extends AssignableResource>(
    type: A,
    id: string,
    relation: FgaTupleAssign<T, A>['relation'],
    user: FgaUserIdentifier<T>,
  ): FgaTupleAssign<T, A> {
    return {
      user,
      relation,
      object: `${type}:${id}`,
    };
  }
  async getAuthorizationLevel(userId: number, roleSlug: string): Promise<UserPermission> {
    const roleType = FgaRoleSlug[roleSlug];
    if (!roleType) {
      throw new Error(`Invalid role slug: ${roleSlug}`);
    }
    const isMANAGER = await this.check(`user:${userId}`, 'can_manage_users', `role:${roleType}`);
    if (isMANAGER) {
      return UserPermission.MANAGER;
    }
    const isEDITOR = await this.check(`user:${userId}`, 'can_edit_users', `role:${roleType}`);
    if (isEDITOR) {
      return UserPermission.EDITOR;
    }

    const isVIEWER = await this.check(`user:${userId}`, 'can_view_users', `role:${roleType}`);
    if (isVIEWER) {
      return UserPermission.VIEWER;
    }
    throw new Error(`User does not have any of the required roles for role slug: ${roleSlug}`);
  }
  async removeUserRelations<T extends ResourceType, A extends AssignableResource>(
    type: T,
    userId: string,
    objectId: string,
    relationsToRemove?: FgaTupleAssign<T, A>['relation'][],
  ): Promise<void> {
    const user = `user:${userId}`;
    const object = `${type}:${objectId}`;

    let continuationToken: string | undefined = undefined;
    const tuplesToDelete: Tuple[] = [];

    do {
      const response = await this.fgaClient.read({ user, object }, { continuationToken });

      if (response.tuples) {
        const filtered =
          relationsToRemove && relationsToRemove.length > 0
            ? response.tuples.filter((t) =>
                relationsToRemove.includes(t.key.relation as FgaTupleAssign<T, A>['relation']),
              )
            : response.tuples;

        tuplesToDelete.push(...filtered);
      }

      continuationToken = response.continuation_token;
    } while (continuationToken);

    if (tuplesToDelete.length === 0) return;

    await this.fgaClient.write({
      deletes: tuplesToDelete.map((t) => ({
        user: t.key.user,
        relation: t.key.relation,
        object: t.key.object,
      })),
    });
  }
  async listObjects<T extends ResourceType, C extends EnquireableResource>(params: {
    user: FgaUserIdentifier<T>;
    relation: FgaTupleEnquire<C>['relation'];
    type: T;
  }): Promise<string[]> {
    const response = await this.fgaClient.listObjects(params);
    return response.objects || [];
  }

  async listObjectsWithRelations<T extends ResourceType, A extends AssignableResource>(
    type: T,
    params: {
      user: FgaUserIdentifier<T>;
      relations: FgaTupleAssign<T, A>['relation'][];
      object: FgaObjectIdentifier<T>;
    },
  ): Promise<string[]> {
    const response = await this.fgaClient.listRelations(params);

    return response.relations || [];
  }

  async check<T extends ResourceType, C extends EnquireableResource>(
    user: FgaUserIdentifier<T>,
    relation: FgaTupleEnquire<C>['relation'],
    object: FgaObjectIdentifier<T>,
  ): Promise<boolean> {
    const { allowed } = await this.fgaClient.check({ user, relation, object });
    return allowed ?? false;
  }

  async filterAuthorizedIds<T extends ResourceType, C extends EnquireableResource>(
    user: FgaUserIdentifier<T>,
    objectType: T,
    objectIds: (string | number)[],
    relation: FgaTupleEnquire<C>['relation'][],
  ): Promise<(string | number)[]> {
    if (!objectIds || objectIds.length === 0) {
      return [];
    }

    const uniqueIds = Array.from(new Set(objectIds));
    const correlationMap = new Map<string, string | number>();

    const checks: {
      user: FgaUserIdentifier<T>;
      relation: FgaTupleEnquire<C>['relation'];
      object: FgaObjectIdentifier<T>;
      correlationId: string;
    }[] = [];
    for (const id of uniqueIds) {
      for (const rel of relation) {
        const correlationId = `${objectType}-${id}-${rel}`;
        correlationMap.set(correlationId, id);

        checks.push({
          user,
          relation: rel,
          object: `${objectType}:${id}` as FgaObjectIdentifier<T>,
          correlationId,
        });
      }
    }

    const response = await this.fgaClient.batchCheck({ checks });

    const authorizedIds: Set<string | number> = new Set();
    const results = response.result;

    if (!results || !Array.isArray(results)) {
      return [];
    }

    for (const item of results) {
      if (item && item.allowed === true && item.correlationId) {
        const originalId = correlationMap.get(item.correlationId);
        if (originalId !== undefined) {
          authorizedIds.add(originalId);
        }
      }
    }

    return Array.from(authorizedIds);
  }

  async createRelationship<T extends ResourceType, A extends AssignableResource>(
    tuple: FgaTupleAssign<T, A>,
  ): Promise<ClientWriteResponse> {
    return this.fgaClient.write({
      writes: [tuple],
    });
  }

  async deleteRelationship<T extends ResourceType, A extends AssignableResource>(
    tuple: FgaTupleAssign<T, A>,
  ): Promise<ClientWriteResponse> {
    return this.fgaClient.write({
      deletes: [tuple],
    });
  }

  async createBatchesRelationships<T extends ResourceType, A extends AssignableResource>(
    tuples: FgaTupleAssign<T, A>[],
  ): Promise<ClientWriteResponse> {
    return this.fgaClient.write({
      writes: tuples,
    });
  }

  async deleteBatchesRelationships<T extends ResourceType, A extends AssignableResource>(
    tuples: FgaTupleAssign<T, A>[],
  ): Promise<ClientWriteResponse> {
    return this.fgaClient.write({
      deletes: tuples,
    });
  }

  async findAllTuplesRelatedToUser(userId: number): Promise<
    {
      user: string;
      relation: string;
      object: string;
    }[]
  > {
    const userIdentifier = `user:${userId}`;
    const objects = ['website', 'team', 'role'];
    const tuples: { user: string; relation: string; object: string }[] = [];
    for (const objectType of objects) {
      const body = {
        user: userIdentifier,
        object: `${objectType}:`,
      };
      const response = await this.fgaClient.read(body);
      if (response.tuples && response.tuples.length > 0) {
        tuples.push(
          ...response.tuples.map((tuple) => ({
            user: tuple.key.user,
            relation: tuple.key.relation,
            object: tuple.key.object,
          })),
        );
      }
    }
    return tuples;
  }

  async findObjectsRelated<T extends ResourceType, A extends AssignableResource>(
    userId: number,
    objectType: A,
    relation: FgaTupleAssign<T, A>['relation'],
  ): Promise<string[]> {
    const userIdentifier = `user:${userId}`;

    const response = await this.fgaClient.listObjects({
      user: userIdentifier,
      relation: relation,
      type: objectType,
    });
    return response.objects || [];
  }

  async purgeAllTuplesForUser(userId: number): Promise<{ deletedCount: number }> {
    const userIdentifier = `user:${userId}`;
    const resourceTypes: ResourceType[] = ['website', 'team', 'role'];
    let totalDeleted = 0;

    for (const type of resourceTypes) {
      let continuationToken: string | undefined = undefined;

      do {
        const response = await this.fgaClient.read(
          {
            user: userIdentifier,
            object: `${type}:`,
          },
          { continuationToken },
        );

        if (response.tuples && response.tuples.length > 0) {
          const batchDeletes: TupleKeyWithoutCondition[] = response.tuples.map((tuple) => ({
            user: tuple.key.user,
            relation: tuple.key.relation,
            object: tuple.key.object,
          }));

          const chunkSize = 100;
          for (let i = 0; i < batchDeletes.length; i += chunkSize) {
            const chunk = batchDeletes.slice(i, i + chunkSize);
            await this.fgaClient.write({ deletes: chunk });
            totalDeleted += chunk.length;
          }
        }

        continuationToken = response.continuation_token;
      } while (continuationToken);
    }

    return { deletedCount: totalDeleted };
  }

  async deleteResourceTuples<T extends ResourceType>(
    object: FgaObjectIdentifier<T>,
  ): Promise<number> {
    let continuationToken: string | undefined = undefined;
    let totalDeleted = 0;

    do {
      const response = await this.fgaClient.read(
        {
          object: object,
        },
        {
          continuationToken: continuationToken,
        },
      );

      if (response.tuples && response.tuples.length > 0) {
        const batchDeletes: TupleKeyWithoutCondition[] = response.tuples.map((tuple) => ({
          user: tuple.key.user,
          relation: tuple.key.relation,
          object: tuple.key.object,
        }));

        const chunkSize = 100;
        for (let i = 0; i < batchDeletes.length; i += chunkSize) {
          const chunk = batchDeletes.slice(i, i + chunkSize);

          await this.fgaClient.write({
            deletes: chunk,
          });

          totalDeleted += chunk.length;
        }
      }

      continuationToken = response.continuation_token;
    } while (continuationToken);
    return totalDeleted;
  }
}
