import { Test, TestingModule } from '@nestjs/testing';
import { AuthorizationRegistry } from './authorization.registry';
import { FgaService } from '../fga.service';
import { AUTHORIZATION_ACTION } from './registry.keys';
import { RoleSlug } from 'src/core/authentication/interfaces/types';
import { MapPermissionsRoles, UserPayload } from '../queue/payload.types';
import { FGA_RESOURCE } from '../types/fga.types';

describe('AuthorizationRegistry', () => {
  let registry: AuthorizationRegistry;
  let fgaService: jest.Mocked<FgaService>;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AuthorizationRegistry,
        {
          provide: FgaService,
          useValue: {
            createRelationship: jest.fn(),
            removeUserRelations: jest.fn(),
            makeFgaTuple: jest.fn((type, id, rel, user) => ({ user, relation: rel, object: `${type}:${id}` })),
            createBatchesRelationships: jest.fn(),
            purgeAllTuplesForUser: jest.fn(),
          },
        },
      ],
    }).compile();

    registry = module.get<AuthorizationRegistry>(AuthorizationRegistry);
    fgaService = module.get(FgaService);
  });

  it('deve dispatchar USER_CREATE corretamente', async () => {
  const payload: UserPayload = { 
    resourceType: FGA_RESOURCE.USER,
    resourceId: 10,           
    action: AUTHORIZATION_ACTION.USER_CREATE, 
    userId: 10, 
    role: RoleSlug.MONITOR, 
    permission: 'manager' 
  };

    await registry.execute(AUTHORIZATION_ACTION.USER_CREATE, payload);

    expect(fgaService.createRelationship).toHaveBeenCalledWith({
      user: 'user:10',
      relation: MapPermissionsRoles['manager'],
      object: 'role:monitor'
    });
  });

  it('deve executar limpeza e batch de criação em USER_ADD_WEBSITE', async () => {
    const payload = {
      userId: 20,
      websiteIds: [1, 2],
      permission: 'viewer' as const,
      resourceType: FGA_RESOURCE.WEBSITE,
      resourceId: 1,
      action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE
    };

    await registry.execute(AUTHORIZATION_ACTION.USER_ADD_WEBSITE, payload);

    expect(fgaService.removeUserRelations).toHaveBeenCalledTimes(2);
    
    expect(fgaService.createBatchesRelationships).toHaveBeenCalledWith([
      { user: 'user:20', relation: MapPermissionsRoles['viewer'], object: 'website:1' },
      { user: 'user:20', relation: MapPermissionsRoles['viewer'], object: 'website:2' }
    ]);
  });

  it('deve falhar ao executar uma action inexistente', async () => {
    await expect(
      registry.execute('INVALID_ACTION' as any, {})
    ).rejects.toThrow('No handler for resource: INVALID_ACTION');
  });
  
});