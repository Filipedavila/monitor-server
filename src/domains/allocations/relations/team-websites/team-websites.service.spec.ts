import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { TeamWebsitesService } from './team-websites.service';
import { TeamWebsites } from './team-websites.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';

describe('TeamWebsitesService', () => {
  let service: TeamWebsitesService;
  let assignmentRepo: Repository<TeamWebsites>;
  let outboxService: OutboxService;
  let mockManager: EntityManager;

  beforeEach(async () => {
    // Mock the EntityManager
    mockManager = {
      transaction: jest.fn((callback) => callback(mockManager)),
      find: jest.fn(),
      save: jest.fn(),
      delete: jest.fn(),
    } as unknown as EntityManager;

    // Mock the OutboxService
    const mockOutboxService = {
      putInOutbox: jest.fn().mockResolvedValue(undefined),
    };

    // Mock the Repository
    const mockRepository = {
      manager: mockManager,
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TeamWebsitesService,
        {
          provide: getRepositoryToken(TeamWebsites),
          useValue: mockRepository,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    service = module.get<TeamWebsitesService>(TeamWebsitesService);
    assignmentRepo = module.get<Repository<TeamWebsites>>(
      getRepositoryToken(TeamWebsites),
    );
    outboxService = module.get<OutboxService>(OutboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateTeamWebsites', () => {
    describe('Happy Path', () => {
      it('should successfully add websites to a team', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(TeamWebsites, {
          where: { teamId, websiteId: In(toAdd) },
        });
        expect(mockManager.save).toHaveBeenCalledWith(
          TeamWebsites,
          toAdd.map((id) => ({ websiteId: id, teamId })),
        );
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE,
              teamId,
              websiteIds: toAdd,
            },
          },
        );
      });

      it('should successfully remove websites from a team', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3];

        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(TeamWebsites, {
          where: { teamId, websiteId: In(toRemove) },
        });
        expect(mockManager.delete).toHaveBeenCalledWith(TeamWebsites, {
          teamId,
          websiteId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE,
              teamId,
              websiteIds: [2, 3],
            },
          },
        );
      });

      it('should add and remove websites in the same call', async () => {
        const teamId = 1;
        const toAdd = [5, 6];
        const toRemove = [2, 3];

        (mockManager.find as jest.Mock)
        .mockResolvedValueOnce([
            // for remove check
            { websiteId: 2, teamId },
            { websiteId: 3, teamId },
          ])
          .mockResolvedValueOnce([]); // for add check
      
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.delete).toHaveBeenCalled();
        expect(mockManager.save).toHaveBeenCalled();
        expect(outboxService.putInOutbox).toHaveBeenCalledTimes(2);
      });

      it('should handle empty add and remove lists', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove: number[] = [];

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.find).not.toHaveBeenCalled();
        expect(mockManager.save).not.toHaveBeenCalled();
        expect(mockManager.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should deduplicate websites in toAdd list', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 2, 3, 4]; // duplicates
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(TeamWebsites, {
          where: { teamId, websiteId: In([2, 3, 4]) },
        });
        expect(mockManager.save).toHaveBeenCalledWith(
          TeamWebsites,
          expect.arrayContaining([
            { websiteId: 2, teamId },
            { websiteId: 3, teamId },
            { websiteId: 4, teamId },
          ]),
        );
      });

      it('should deduplicate websites in toRemove list', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 2, 3, 4]; // duplicates

        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
          { websiteId: 4, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(TeamWebsites, {
          where: { teamId, websiteId: In([2, 3, 4]) },
        });
      });

      it('should not add websites that already exist in the team', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        // Simulate that websites 2 and 3 already exist
        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should only try to add website 4
        expect(mockManager.save).toHaveBeenCalledWith(
          TeamWebsites,
          [{ websiteId: 4, teamId }],
        );
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE,
              teamId,
              websiteIds: [4],
            },
          },
        );
      });

      it('should not attempt to remove websites that do not exist in the team', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // Simulate that only websites 2 and 3 exist
        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should only try to remove websites 2 and 3, not 4
        expect(mockManager.delete).toHaveBeenCalledWith(TeamWebsites, {
          teamId,
          websiteId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE,
              teamId,
              websiteIds: [2, 3],
            },
          },
        );
      });

      it('should sanitize delta when same website appears in both add and remove lists', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4];
        const toRemove = [3, 5]; // 3 is in both lists

        (mockManager.find as jest.Mock)
          .mockResolvedValueOnce([]) // for add check
          .mockResolvedValueOnce([]); // for remove check - 3 should be removed from toRemove

        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Save should be called with websites to add (after sanitization)
        expect(mockManager.save).toHaveBeenCalled();
      });

      it('should not create outbox event if no websites are added after deduplication and existence check', async () => {
        const teamId = 1;
        const toAdd = [2, 3];
        const toRemove: number[] = [];

        // Both websites already exist
        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should not call save if all websites already exist
        expect(mockManager.save).not.toHaveBeenCalled();
        // Should not create outbox event
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should not create outbox event if no websites are removed', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // No websites exist
        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should handle transaction correctly', async () => {
        const teamId = 1;
        const toAdd = [2];
        const toRemove: number[] = [];

        const transactionCallback = jest.fn();
        (mockManager.transaction as jest.Mock).mockImplementation(
          (callback) => {
            transactionCallback(callback);
            return callback(mockManager);
          },
        );

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.transaction).toHaveBeenCalled();
        expect(transactionCallback).toHaveBeenCalled();
      });

      it('should handle large batch of websites', async () => {
        const teamId = 1;
        const largeWebsiteList = Array.from({ length: 1000 }, (_, i) => i + 1);
        const toAdd = largeWebsiteList;
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(mockManager.save).toHaveBeenCalledWith(
          TeamWebsites,
          expect.arrayContaining(
            largeWebsiteList.map((id) => ({ websiteId: id, teamId })),
          ),
        );
      });

      it('should call outbox service with correct payload structure for add operation', async () => {
        const teamId = 5;
        const toAdd = [10, 11];
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.TEAM_ADD_WEBSITE,
              teamId,
              websiteIds: toAdd,
            }),
          }),
        );
      });

      it('should call outbox service with correct payload structure for remove operation', async () => {
        const teamId = 5;
        const toAdd: number[] = [];
        const toRemove = [10, 11];

        const existingWebsites = [
          { websiteId: 10, teamId },
          { websiteId: 11, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE,
              teamId,
              websiteIds: [10, 11],
            }),
          }),
        );
      });

      it('should use Set-based lookup for efficient existence checking in add operation', async () => {
        const teamId = 1;
        const toAdd = [2, 3, 4, 5];
        const toRemove: number[] = [];

        // Existing websites
        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should only save websites 4 and 5
        expect(mockManager.save).toHaveBeenCalledWith(
          TeamWebsites,
          expect.arrayContaining([
            { websiteId: 4, teamId },
            { websiteId: 5, teamId },
          ]),
        );
      });

      it('should use Set-based lookup for efficient existence checking in remove operation', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4, 5];

        // Only websites 2 and 3 exist
        const existingWebsites = [
          { websiteId: 2, teamId },
          { websiteId: 3, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should only delete websites 2 and 3
        expect(mockManager.delete).toHaveBeenCalledWith(TeamWebsites, {
          teamId,
          websiteId: In([2, 3]),
        });
      });

      it('should handle removal of partial match from multiple website removal attempts', async () => {
        const teamId = 1;
        const toAdd: number[] = [];
        const toRemove = [10, 20, 30, 40, 50];

        // Only websites 10, 30, and 50 exist
        const existingWebsites = [
          { websiteId: 10, teamId },
          { websiteId: 30, teamId },
          { websiteId: 50, teamId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateTeamWebsites(teamId, toAdd, toRemove);

        // Should only attempt to remove websites that exist
        expect(mockManager.delete).toHaveBeenCalledWith(TeamWebsites, {
          teamId,
          websiteId: In([10, 30, 50]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.TEAM,
            aggregateId: teamId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.TEAM_REMOVE_WEBSITE,
              teamId,
              websiteIds: [10, 30, 50],
            },
          },
        );
      });
    });
  });
});
