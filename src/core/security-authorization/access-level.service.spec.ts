import { Test, TestingModule } from '@nestjs/testing';
import { Repository } from 'typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { getRepositoryToken } from '@nestjs/typeorm';
import { AccessLevelProvider } from './access-level.service';
import {
  AccessLevelCode,
  AccessLevelEntity,
} from './entitities/access-level.entity';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';

describe('AccessLevelProvider', () => {
  let provider: AccessLevelProvider;
  let mockRepository: DeepMocked<Repository<AccessLevelEntity>>;
  let mockLogger: DeepMocked<AppLoggerService>;

  beforeEach(async () => {
    mockRepository = createMock<Repository<AccessLevelEntity>>();
    mockLogger = createMock<AppLoggerService>();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AccessLevelProvider,
        {
          provide: getRepositoryToken(AccessLevelEntity),
          useValue: mockRepository,
        },
        {
          provide: AppLoggerService,
          useValue: mockLogger,
        },
      ],
    }).compile();

    provider = module.get<AccessLevelProvider>(AccessLevelProvider);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('onModuleInit', () => {
    it('should load weights and initialize cache successfully', async () => {
      // Arrange
      const mockLevels = [
        { type: 'ADMIN' as AccessLevelCode, weight: 100 },
        { type: 'VIEWER' as AccessLevelCode, weight: 10 },
      ];
      mockRepository.find.mockResolvedValue(mockLevels as AccessLevelEntity[]);

      // Act
      await provider.onModuleInit();

      // Assert
      expect(mockRepository.find).toHaveBeenCalledTimes(1);
      expect(provider['weightsCache']).toEqual({
        ADMIN: 100,
        VIEWER: 10,
      });
    });

    it('should exit process and log critical error on load failure', async () => {
      // Arrange
      const exitSpy = jest.spyOn(process, 'exit').mockImplementation();
      mockRepository.find.mockRejectedValue(new Error('Database Connection Lost'));

      // Act
      await provider.onModuleInit();

      // Assert

      expect(exitSpy).toHaveBeenCalledWith(1);
      
      exitSpy.mockRestore();
    });
  });

  describe('getSatisfyingLevels', () => {
    beforeEach(() => {
      provider['weightsCache'] = {
        OWNER: 100,
        EDITOR: 50,
        VIEWER: 10,
      };
    });

    it('should return levels with weight equal or higher than target', () => {
      // Act
      const result = provider.getSatisfyingLevels('EDITOR' as AccessLevelCode);

      // Assert
      expect(result).toContain('OWNER');
      expect(result).toContain('EDITOR');
      expect(result).not.toContain('VIEWER');
      expect(result).toHaveLength(2);
    });

    it('should return only the highest level when target is the maximum', () => {
      const result = provider.getSatisfyingLevels('OWNER' as AccessLevelCode);
      expect(result).toEqual(['OWNER']);
    });

    it('should return all levels when minimum level is requested', () => {
      const result = provider.getSatisfyingLevels('VIEWER' as AccessLevelCode);
      expect(result).toHaveLength(3);
      expect(result).toEqual(['OWNER', 'EDITOR', 'VIEWER']);
    });

    it('should handle unknown levels by defaulting to weight 0 (granting no levels)', () => {
      const result = provider.getSatisfyingLevels('UNKNOWN' as AccessLevelCode);
      expect(result).toHaveLength(0);
    });
  });
});
