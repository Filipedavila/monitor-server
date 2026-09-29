import { Test, TestingModule } from '@nestjs/testing';
import { GenericContainer, StartedTestContainer, Wait } from 'testcontainers';
import { OpenFgaClient } from '@openfga/sdk';
import { transformer } from '@openfga/syntax-transformer';
import path from 'node:path';
import fs from 'node:fs';
import { FgaService } from './fga.service';
import { FgaClientProvider } from './fga.provider';
import { FgaRoleSlug, RoleSlug, UserPermission } from '../authentication/interfaces/types';
import type { AuthorizationModel } from '@openfga/sdk';

describe('FgaService (Integration Tests - Isolated Stores)', () => {
  let container: StartedTestContainer;
  let moduleRef: TestingModule;
  let fgaService: FgaService;
  let apiUrl: string;
  let jsonModel: Omit<AuthorizationModel, 'id'>;

  beforeAll(async () => {
    container = await new GenericContainer('openfga/openfga:v1.18.0')
      .withCommand(['run', '--datastore-engine', 'memory'])
      .withExposedPorts(8080)
      .withWaitStrategy(Wait.forHttp('/healthz', 8080))
      .withStartupTimeout(60_000)
      .start();

    const host = container.getHost() === 'localhost' ? '127.0.0.1' : container.getHost();
    apiUrl = `http://${host}:${container.getMappedPort(8080)}`;

    const dslPath = path.resolve(__dirname, '../../../openfga/model.fga');
    const dslFileContent = fs.readFileSync(dslPath, 'utf8');
    jsonModel = transformer.transformDSLToJSONObject(dslFileContent);
  }, 120_000);

  afterAll(async () => {
    if (container) {
      await container.stop();
    }
  });
  //  Starts one new store for each test to ensure isolation
  beforeEach(async () => {
    const setupClient = new OpenFgaClient({ apiUrl });
    const store = await setupClient.createStore({ name: `Test Store ${Date.now()}` });
    const storeId = store.id;

    const modelResponse = await setupClient.writeAuthorizationModel(
      {
        schema_version: jsonModel.schema_version,
        type_definitions: jsonModel.type_definitions,
      },
      { storeId },
    );

    process.env.FGA_API_URL = apiUrl;
    process.env.FGA_STORE_ID = storeId;
    process.env.FGA_MODEL_ID = modelResponse.authorization_model_id;

    moduleRef = await Test.createTestingModule({
      providers: [FgaService, FgaClientProvider],
    }).compile();

    fgaService = moduleRef.get<FgaService>(FgaService);
  });

  afterEach(async () => {
    await moduleRef?.close();
  });

  it('Create and check a relationship', async () => {
    await fgaService.createRelationship({
      user: 'user:123',
      relation: 'manager',
      object: 'role:admin-slug',
    });

    const hasAccess = await fgaService.check('user:123', 'manager', 'role:admin-slug');
    expect(hasAccess).toBe(true);
  });

  it('Filter authorized IDs correctly using batchCheck', async () => {
    await fgaService.createBatchesRelationships([
      { user: 'user:456', relation: 'viewer', object: 'website:10' },
      { user: 'user:456', relation: 'viewer', object: 'website:30' },
    ]);

    const authorized = await fgaService.filterAuthorizedIds(
      'user:456',
      'website',
      [10, 20, 30, 40],
      ['viewer'],
    );

    expect(authorized.sort()).toEqual([10, 30].sort());
  });
  it('Filter authorized IDs correctly using batchCheck with multiple relations', async () => {
    await fgaService.createBatchesRelationships([
      { user: 'user:333', relation: 'viewer', object: 'website:55' },
      { user: 'user:333', relation: 'manager', object: 'website:77' },
      { user: 'user:333', relation: 'editor', object: 'website:100' },
    ]);

    const authorized = await fgaService.filterAuthorizedIds(
      'user:333',
      'website',
      [10, 20, 30, 40, 55, 77],
      ['viewer', 'manager'],
    );

    expect(authorized.sort()).toEqual([55, 77].sort());
  });
  it('Return an empty array if the user has no permissions for the resources', async () => {
    await fgaService.createBatchesRelationships([
      { user: 'user:other', relation: 'viewer', object: 'website:10' },
    ]);

    const authorized = await fgaService.filterAuthorizedIds(
      'user:456',
      'website',
      [10, 20, 30],
      ['viewer'],
    );

    expect(authorized).toEqual([]);
  });

  it('Safely handle non-existent IDs in OpenFGA without throwing', async () => {
    await fgaService.createBatchesRelationships([
      { user: 'user:456', relation: 'viewer', object: 'website:10' },
    ]);

    const authorized = await fgaService.filterAuthorizedIds(
      'user:456',
      'website',
      [10, 9999, 8888],
      ['viewer'],
    );

    expect(authorized).toEqual([10]);
  });

  it('Return an empty array immediately if the input array is empty', async () => {
    const authorized = await fgaService.filterAuthorizedIds('user:456', 'website', [], ['viewer']);

    expect(authorized).toEqual([]);
  });

  it('Successfully deduplicate repeated IDs in the input', async () => {
    await fgaService.createBatchesRelationships([
      { user: 'user:456', relation: 'viewer', object: 'website:10' },
    ]);

    const authorized = await fgaService.filterAuthorizedIds(
      'user:456',
      'website',
      [10, 10, 10, 20, 20],
      ['viewer'],
    );

    expect(authorized).toEqual([10]);
  });
  describe('getAuthorizationLevel', () => {
    it('Throw an error for an invalid role slug', async () => {
      await expect(fgaService.getAuthorizationLevel(123, 'invalid-slug')).rejects.toThrow(
        'Invalid role slug: invalid-slug',
      );
    });

    it('Resolve MANAGER authorization level correctly', async () => {
      const roleType = 'ams';

      await fgaService.createRelationship({
        user: 'user:123',
        relation: 'manager',
        object: `role:${roleType}`,
      });

      const authorizationLevel = await fgaService.getAuthorizationLevel(123, RoleSlug.ADMIN);
      expect(authorizationLevel).toBe('manager');
    });
  });

  describe('removeUserRelations', () => {
    it('Remove specific relations for a user and object', async () => {
      await fgaService.createBatchesRelationships([
        { user: 'user:789', relation: 'viewer', object: 'website:50' },
        { user: 'user:789', relation: 'editor', object: 'website:50' },
      ]);

      await fgaService.removeUserRelations('website', '789', '50', ['viewer']);

      // Validate that the viewer was removed but the editor remains
      const hasViewer = await fgaService.check('user:789', 'viewer', 'website:50');
      const hasEditor = await fgaService.check('user:789', 'editor', 'website:50');

      expect(hasViewer).toBe(false);
      expect(hasEditor).toBe(true);
    });

    it('Remove all relations if relationsToRemove is omitted', async () => {
      await fgaService.createBatchesRelationships([
        { user: 'user:789', relation: 'viewer', object: 'website:50' },
      ]);

      await fgaService.removeUserRelations('website', '789', '50');

      const hasViewer = await fgaService.check('user:789', 'viewer', 'website:50');
      expect(hasViewer).toBe(false);
    });
  });

  describe('purgeAllTuplesForUser', () => {
    it('Purge all tuples associated with a user as subject or object', async () => {
      await fgaService.createBatchesRelationships([
        { user: 'user:999', relation: 'viewer', object: 'website:100' },
        { user: 'user:999', relation: 'member', object: 'team:alpha' },
      ]);

      const result = await fgaService.purgeAllTuplesForUser(999);
      expect(result.deletedCount).toBe(2);

      const related = await fgaService.findAllTuplesRelatedToUser(999);
      expect(related).toHaveLength(0);
    });
  });
  describe('Find all tuples related to user', () => {
    it('Find all tuples associated to a user', async () => {
      const mockTuples = [
        { user: 'user:555', relation: 'viewer', object: 'website:100' },
        { user: 'user:555', relation: 'member', object: 'team:alpha' },
        { user: 'user:555', relation: 'manager', object: 'role:manager' },
        { user: 'user:555', relation: 'editor', object: 'website:200' },
      ];
      const response = await fgaService.createBatchesRelationships([
        { user: 'user:555', relation: 'viewer', object: 'website:100' },
        { user: 'user:555', relation: 'member', object: 'team:alpha' },
        { user: 'user:555', relation: 'manager', object: 'role:manager' },
        { user: 'user:555', relation: 'editor', object: 'website:200' },
      ]);
      const tuplesWriten = response.writes;
      expect(tuplesWriten).toHaveLength(4);

      const related = await fgaService.findAllTuplesRelatedToUser(555);
      expect(related).toHaveLength(4);
      expect(related).toEqual(expect.arrayContaining(mockTuples));
    });
  });

  describe('findObjectsRelated', () => {
    it('Find all related object IDs filtered by type and relation', async () => {
      await fgaService.createBatchesRelationships([
        { user: 'user:333', relation: 'viewer', object: 'website:10' },
        { user: 'user:333', relation: 'viewer', object: 'website:20' },
        { user: 'user:333', relation: 'editor', object: 'website:30' },
      ]);

      const result = await fgaService.findObjectsRelated(333, 'website', 'viewer');

      expect(result.sort()).toEqual(['website:10', 'website:20'].sort());
    });
  });
  describe('getAuthorizationLevel (Risk & Hierarchy Tests)', () => {
    it('Return UserPermission.MANAGER if user has can_manage_users permission', async () => {
      const roleSlug = Object.keys(FgaRoleSlug)[0];
      const roleType = FgaRoleSlug[roleSlug];

      await fgaService.createRelationship({
        user: 'user:111',
        relation: 'manager',
        object: `role:${roleType}`,
      });

      const level = await fgaService.getAuthorizationLevel(111, roleSlug);
      expect(level).toBe(UserPermission.MANAGER);
    });

    it('Fall back to UserPermission.EDITOR if user lacks manager but has can_edit_users', async () => {
      const roleSlug = Object.keys(FgaRoleSlug)[0];
      const roleType = FgaRoleSlug[roleSlug];

      await fgaService.createRelationship({
        user: 'user:222',
        relation: 'editor',
        object: `role:${roleType}`,
      });

      const level = await fgaService.getAuthorizationLevel(222, roleSlug);
      expect(level).toBe(UserPermission.EDITOR);
    });

    it('Fall back to UserPermission.VIEWER if user only has can_view_users', async () => {
      const roleSlug = Object.keys(FgaRoleSlug)[0];
      const roleType = FgaRoleSlug[roleSlug];

      await fgaService.createRelationship({
        user: 'user:333',
        relation: 'viewer',
        object: `role:${roleType}`,
      });

      const level = await fgaService.getAuthorizationLevel(333, roleSlug);
      expect(level).toBe(UserPermission.VIEWER);
    });

    it('Throw an error if user has none of the required permissions for the role slug', async () => {
      const roleSlug = Object.keys(FgaRoleSlug)[0];

      // Utilizador sem nenhuns tuplos criados
      await expect(fgaService.getAuthorizationLevel(444, roleSlug)).rejects.toThrow(
        /User does not have any of the required roles/i,
      );
    });
  });

  describe('Pagination & Bulk Operations (Risk & Chunking Tests)', () => {
    it('Gracefully do nothing if removeUserRelations finds no tuples to delete', async () => {
      // Nenhum tuplo criado para este utilizador/recurso
      await expect(
        fgaService.removeUserRelations('website', '999', '999', ['viewer']),
      ).resolves.not.toThrow();
    });

    it('Handle chunking correctly during bulk tuple deletion in purgeAllTuplesForUser', async () => {
      const userId = 999;

      const tuples = Array.from({ length: 5 }, (_, index) => ({
        user: `user:${userId}` as const,
        relation: 'viewer' as const,
        object: `website:${index}` as const,
      }));

      await fgaService.createBatchesRelationships(tuples);

      const result = await fgaService.purgeAllTuplesForUser(userId);

      expect(typeof result.deletedCount).toBe('number');
      expect(result.deletedCount).toBe(tuples.length);
    });
  });
});
