import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { EntityManager, In, Repository } from 'typeorm';
import { UserWebsitesService } from './user-websites.service';
import { UserWebsite } from './user-websites.entity';
import { OutboxService } from 'src/core/outbox/outbox.service';
import { FGA_RESOURCE } from 'src/core/authorization/types/fga.types';
import { AuthorizationEvent } from 'src/core/authorization/queue/payload.types';
import { AUTHORIZATION_ACTION } from 'src/core/authorization/registry/registry.keys';

describe('UserWebsitesService', () => {
  let service: UserWebsitesService;
  let assignmentRepo: Repository<UserWebsite>;
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
        UserWebsitesService,
        {
          provide: getRepositoryToken(UserWebsite),
          useValue: mockRepository,
        },
        {
          provide: OutboxService,
          useValue: mockOutboxService,
        },
      ],
    }).compile();

    service = module.get<UserWebsitesService>(UserWebsitesService);
    assignmentRepo = module.get<Repository<UserWebsite>>(
      getRepositoryToken(UserWebsite),
    );
    outboxService = module.get<OutboxService>(OutboxService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('updateUserWebsites', () => {
    describe('Happy Path', () => {
      it('should successfully add websites to a user', async () => {
        const userId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(UserWebsite, {
          where: { userId, websiteId: In(toAdd) },
        });
        expect(mockManager.save).toHaveBeenCalledWith(
          UserWebsite,
          toAdd.map((id) => ({ websiteId: id, userId })),
        );
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
              userId,
              websiteIds: toAdd,
            },
          },
        );
      });

      it('should successfully remove websites from a user', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3];

        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(UserWebsite, {
          where: { userId, websiteId: In(toRemove) },
        });
        expect(mockManager.delete).toHaveBeenCalledWith(UserWebsite, {
          userId,
          websiteId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
              userId,
              websiteIds: [2, 3],
            },
          },
        );
      });

      it('should add and remove websites in the same call', async () => {
        const userId = 1;
        const toAdd = [5, 6];
        const toRemove = [2, 3];

        (mockManager.find as jest.Mock)
          .mockResolvedValueOnce([
            // for remove check
            { websiteId: 2, userId },
            { websiteId: 3, userId },
          ])
          .mockResolvedValueOnce([]); // for add check
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);
        
        
        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.delete).toHaveBeenCalled();
        expect(mockManager.save).toHaveBeenCalled();
        expect(outboxService.putInOutbox).toHaveBeenCalledTimes(2);
      });

      it('should handle empty add and remove lists', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove: number[] = [];

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.find).not.toHaveBeenCalled();
        expect(mockManager.save).not.toHaveBeenCalled();
        expect(mockManager.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });
    });

    describe('Edge Cases', () => {
      it('should deduplicate websites in toAdd list', async () => {
        const userId = 1;
        const toAdd = [2, 3, 2, 3, 4]; // duplicates
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(UserWebsite, {
          where: { userId, websiteId: In([2, 3, 4]) },
        });
        expect(mockManager.save).toHaveBeenCalledWith(
          UserWebsite,
          expect.arrayContaining([
            { websiteId: 2, userId },
            { websiteId: 3, userId },
            { websiteId: 4, userId },
          ]),
        );
      });

      it('should deduplicate websites in toRemove list', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 2, 3, 4]; // duplicates

        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
          { websiteId: 4, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.find).toHaveBeenCalledWith(UserWebsite, {
          where: { userId, websiteId: In([2, 3, 4]) },
        });
      });

      it('should not add websites that already exist for the user', async () => {
        const userId = 1;
        const toAdd = [2, 3, 4];
        const toRemove: number[] = [];

        // Simulate that websites 2 and 3 already exist
        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should only try to add website 4
        expect(mockManager.save).toHaveBeenCalledWith(
          UserWebsite,
          [{ websiteId: 4, userId }],
        );
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
              userId,
              websiteIds: [4],
            },
          },
        );
      });

      it('should not attempt to remove websites that do not exist for the user', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // Simulate that only websites 2 and 3 exist
        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should only try to remove websites 2 and 3, not 4
        expect(mockManager.delete).toHaveBeenCalledWith(UserWebsite, {
          userId,
          websiteId: In([2, 3]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
              userId,
              websiteIds: [2, 3],
            },
          },
        );
      });

      it('should sanitize delta when same website appears in both add and remove lists', async () => {
        const userId = 1;
        const toAdd = [2, 3, 4];
        const toRemove = [3, 5]; // 3 is in both lists

        (mockManager.find as jest.Mock)
          .mockResolvedValueOnce([]) // for add check
          .mockResolvedValueOnce([]); // for remove check - 3 should be removed from toRemove

        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Save should be called with websites to add (after sanitization)
        expect(mockManager.save).toHaveBeenCalled();
      });

      it('should not create outbox event if no websites are added after deduplication and existence check', async () => {
        const userId = 1;
        const toAdd = [2, 3];
        const toRemove: number[] = [];

        // Both websites already exist
        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should not call save if all websites already exist
        expect(mockManager.save).not.toHaveBeenCalled();
        // Should not create outbox event
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should not create outbox event if no websites are removed', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4];

        // No websites exist
        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.delete).not.toHaveBeenCalled();
        expect(outboxService.putInOutbox).not.toHaveBeenCalled();
      });

      it('should handle transaction correctly', async () => {
        const userId = 1;
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

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.transaction).toHaveBeenCalled();
        expect(transactionCallback).toHaveBeenCalled();
      });

      it('should handle large batch of websites', async () => {
        const userId = 1;
        const largeWebsiteList = Array.from({ length: 1000 }, (_, i) => i + 1);
        const toAdd = largeWebsiteList;
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(mockManager.save).toHaveBeenCalledWith(
          UserWebsite,
          expect.arrayContaining(
            largeWebsiteList.map((id) => ({ websiteId: id, userId })),
          ),
        );
      });

      it('should call outbox service with correct payload structure for add operation', async () => {
        const userId = 5;
        const toAdd = [10, 11];
        const toRemove: number[] = [];

        (mockManager.find as jest.Mock).mockResolvedValueOnce([]);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.USER_ADD_WEBSITE,
              userId,
              websiteIds: toAdd,
            }),
          }),
        );
      });

      it('should call outbox service with correct payload structure for remove operation', async () => {
        const userId = 5;
        const toAdd: number[] = [];
        const toRemove = [10, 11];

        const existingWebsites = [
          { websiteId: 10, userId },
          { websiteId: 11, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          expect.objectContaining({
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: expect.objectContaining({
              action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
              userId,
              websiteIds: [10, 11],
            }),
          }),
        );
      });

      it('should use Set-based lookup for efficient existence checking in add operation', async () => {
        const userId = 1;
        const toAdd = [2, 3, 4, 5];
        const toRemove: number[] = [];

        // Existing websites
        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.save as jest.Mock).mockResolvedValueOnce([]);

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should only save websites 4 and 5
        expect(mockManager.save).toHaveBeenCalledWith(
          UserWebsite,
          expect.arrayContaining([
            { websiteId: 4, userId },
            { websiteId: 5, userId },
          ]),
        );
      });

      it('should map existing websites to removal list correctly', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [2, 3, 4, 5];

        // Only websites 2, 3, and 5 exist
        const existingWebsites = [
          { websiteId: 2, userId },
          { websiteId: 3, userId },
          { websiteId: 5, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should only delete websites that actually exist
        expect(mockManager.delete).toHaveBeenCalledWith(UserWebsite, {
          userId,
          websiteId: In([2, 3, 5]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
              userId,
              websiteIds: [2, 3, 5],
            },
          },
        );
      });

      it('should handle removal of partial match from multiple website removal attempts', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [10, 20, 30, 40, 50];

        // Only websites 10, 30, and 50 exist
        const existingWebsites = [
          { websiteId: 10, userId },
          { websiteId: 30, userId },
          { websiteId: 50, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        // Should only attempt to remove websites that exist
        expect(mockManager.delete).toHaveBeenCalledWith(UserWebsite, {
          userId,
          websiteId: In([10, 30, 50]),
        });
        expect(outboxService.putInOutbox).toHaveBeenCalledWith(
          mockManager,
          {
            aggregateType: FGA_RESOURCE.USER,
            aggregateId: userId,
            eventType: AuthorizationEvent.AUTHORIZATION,
            payload: {
              action: AUTHORIZATION_ACTION.USER_REMOVE_WEBSITE,
              userId,
              websiteIds: [10, 30, 50],
            },
          },
        );
      });

      it('should preserve order of websites in removal payload', async () => {
        const userId = 1;
        const toAdd: number[] = [];
        const toRemove = [50, 10, 30];

        const existingWebsites = [
          { websiteId: 50, userId },
          { websiteId: 10, userId },
          { websiteId: 30, userId },
        ];

        (mockManager.find as jest.Mock).mockResolvedValueOnce(existingWebsites);
        (mockManager.delete as jest.Mock).mockResolvedValueOnce({});

        await service.updateUserWebsites(userId, toAdd, toRemove);

        const calls = (outboxService.putInOutbox as jest.Mock).mock.calls;
        const removePayload = calls[0][1].payload;

        // Should preserve the order from the existing websites query result
        expect(removePayload.websiteIds).toEqual([50, 10, 30]);
      });
    });
  });
});
