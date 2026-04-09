import { Test, TestingModule } from '@nestjs/testing';
import { Repository, SelectQueryBuilder, DeleteResult } from 'typeorm';
import { createMock, DeepMocked } from '@golevelup/ts-jest';
import { EntityRepository, FilterMap, SortingMap } from './base.repository';
import { AppLoggerService } from 'src/core/app-logger/app-logger.service';
import { BaseModel } from '../entities/base.entity';
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from '../interfaces/types';
import { ConfigService } from '@nestjs/config';

class MockEntity extends BaseModel {
  name: string;
  status: string;
}

interface MockFilters extends BaseFilter {
  name?: string;
  status?: string;
}

interface MockSorts extends BaseSort {
  name?: SortCriteria;
  status?: SortCriteria;
}

class TestEntityRepository extends EntityRepository<MockEntity, MockFilters, MockSorts, BasePagination> {
  protected readonly alias = 'entity';
  protected readonly filterMap: FilterMap<MockFilters, MockEntity> = {
    ids: (query, value) => query.andWhereInIds(value),
    name: (query, value) => query.andWhere(`${this.alias}.name LIKE :name`, { name: `%${value}%` }),
    status: (query, value) => query.andWhere(`${this.alias}.status = :status`, { status: value }),
  };

  protected readonly sortMap: SortingMap<MockSorts, MockEntity> = {
    id: (query, order) => query.addOrderBy(`${this.alias}.id`, order),
    name: (query, order) => query.addOrderBy(`${this.alias}.name`, order),
    status: (query, order) => query.addOrderBy(`${this.alias}.status`, order),
  };
}

describe('EntityRepository (Base Repository)', () => {
  let repository: TestEntityRepository;
  let mockOrmRepository: DeepMocked<Repository<MockEntity>>;
  let mockLogger: DeepMocked<AppLoggerService>;
  let mockQueryBuilder: DeepMocked<SelectQueryBuilder<MockEntity>>;
  let mockConfigService: DeepMocked<ConfigService>;
  beforeEach(async () => {
    mockConfigService = createMock<ConfigService>();
    mockOrmRepository = createMock<Repository<MockEntity>>();
    mockLogger = createMock<AppLoggerService>();
    mockQueryBuilder = createMock<SelectQueryBuilder<MockEntity>>();
    mockConfigService.get.mockImplementation((key: string, defaultValue: any) => {
      if (key === 'PAGINATION_MAX_LIMIT') return 100;
      return defaultValue;
    });

    Object.defineProperty(mockOrmRepository, 'metadata', {
      value: {
        name: 'MockEntity',
        primaryColumns: [{ propertyName: 'id' }],
      },
      writable: true,
      configurable: true,
    });

    mockOrmRepository.createQueryBuilder.mockReturnValue(mockQueryBuilder);

    mockQueryBuilder.andWhere.mockReturnThis();
    mockQueryBuilder.andWhereInIds.mockReturnThis();
    mockQueryBuilder.addOrderBy.mockReturnThis();
    mockQueryBuilder.take.mockReturnThis();
    mockQueryBuilder.skip.mockReturnThis();
    mockQueryBuilder.getManyAndCount.mockResolvedValue([[], 0]);

   

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        { provide: Repository, useValue: mockOrmRepository },
        { provide: AppLoggerService, useValue: mockLogger },
        { provide: ConfigService, useValue: mockConfigService },
      ],
    }).compile();

    repository = new TestEntityRepository(mockOrmRepository, mockLogger,mockConfigService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

describe('find', () => {
    it('should return paginated data with default pagination', async () => {
      const mockEntities = [{ id: 1, name: 'Test' } as MockEntity];
      mockQueryBuilder.getManyAndCount.mockResolvedValue([mockEntities, 1]);

      const result = await repository.find({ filters: { name: 'Test' } });

      expect(result.data).toEqual(mockEntities);
      expect(result.count).toBe(1);
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should apply filters when provided', async () => {
      await repository.find({ filters: { name: 'Test', status: 'active' } });

      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('entity.name LIKE :name', { name: '%Test%' });
      expect(mockQueryBuilder.andWhere).toHaveBeenCalledWith('entity.status = :status', { status: 'active' });
    });

    it('should apply sorting when provided', async () => {
      await repository.find({ sorting: { name: 'ASC', status: 'DESC' } });

      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('entity.name', 'ASC');
      expect(mockQueryBuilder.addOrderBy).toHaveBeenCalledWith('entity.status', 'DESC');
    });

    it('should apply custom pagination', async () => {
      await repository.find({ pagination: { limit: 20, page: 2 } });

      expect(mockQueryBuilder.take).toHaveBeenCalledWith(20);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(20);
    });

    it('should limit max results to 100', async () => {
      await repository.find({ pagination: { limit: 500, page: 1 } });
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
    });

    it('should handle ids filter', async () => {
      await repository.find({ filters: { ids: [1, 2, 3] } as any });
      expect(mockQueryBuilder.andWhereInIds).toHaveBeenCalledWith([1, 2, 3]);
    });
  });

  describe('findById', () => {
    it('should return entity by id', async () => {
      const mockEntity = { id: 1, name: 'Test' } as MockEntity;
      mockOrmRepository.findOneBy.mockResolvedValue(mockEntity);

      const result = await repository.findById(1);

      expect(result).toEqual(mockEntity);
      expect(mockOrmRepository.findOneBy).toHaveBeenCalledWith({ id: 1 });
    });

    it('should return null if entity not found', async () => {
      mockOrmRepository.findOneBy.mockResolvedValue(null);
      const result = await repository.findById(999);
      expect(result).toBeNull();
    });
  });

  describe('save', () => {
    it('should save single entity', async () => {
      const mockEntity = { id: 1, name: 'Test' } as MockEntity;
      mockOrmRepository.save.mockResolvedValue(mockEntity);

      const result = await repository.save(mockEntity);

      expect(result).toEqual(mockEntity);
      expect(mockOrmRepository.save).toHaveBeenCalledWith(mockEntity);
    });
  });

  describe('saveMany', () => {
    it('should return empty array if data is empty', async () => {
      const result = await repository.saveMany([]);
      expect(result).toEqual([]);
      expect(mockOrmRepository.save).not.toHaveBeenCalled();
    });

    it('should save multiple entities in chunks', async () => {
      const mockEntities = Array.from({ length: 25 }, (_, i) => ({ id: i + 1, name: `Test ${i + 1}`, status: 'active', createdAt: new Date(), updatedAt: new Date() } as MockEntity));
      mockOrmRepository.save.mockImplementation(async (data) => data);

      const result = await repository.saveMany(mockEntities);

      expect(result).toHaveLength(25);
      expect(mockOrmRepository.save).toHaveBeenCalledTimes(3);
    });

    it('should log error and throw if save fails', async () => {
      const error = new Error('Save failed');
      mockOrmRepository.save.mockRejectedValue(error);

      await expect(repository.saveMany([{ id: 1 } as MockEntity])).rejects.toThrow('Save failed');
      expect(mockLogger.error).toHaveBeenCalled();
    });
  });

  describe('delete', () => {
    it('should delete entity by id', async () => {
      mockOrmRepository.delete.mockResolvedValue({ affected: 1 } as DeleteResult);
      const result = await repository.delete(1);
      expect(result.affected).toBe(1);
      expect(mockOrmRepository.delete).toHaveBeenCalledWith({ id: 1 });
    });
  });

  describe('deleteMany', () => {
    it('should return zero affected if ids array is empty', async () => {
      const result = await repository.deleteMany([]);
      expect(result.affected).toBe(0);
      expect(mockOrmRepository.delete).not.toHaveBeenCalled();
    });

    it('should delete multiple entities by ids', async () => {
      mockOrmRepository.delete.mockResolvedValue({ affected: 3 } as DeleteResult);
      const result = await repository.deleteMany([1, 2, 3]);
      expect(result.affected).toBe(3);
      expect(mockOrmRepository.delete).toHaveBeenCalled();
    });
  });

  describe('query', () => {
    it('should execute raw SQL query with parameters', async () => {
      // Arrange
      const mockResult: MockEntity[] = [{ id: 1, name: 'Test', status: 'active', createdAt: new Date(), updatedAt: new Date() } as MockEntity];
      const sql = 'SELECT * FROM mock_entity WHERE id = ?';
      const params = [1];
      
      mockOrmRepository.query.mockResolvedValue(mockResult);

      // Act
      const result = await repository.query(sql, params);

      // Assert
      expect(result).toEqual(mockResult);
      expect(mockOrmRepository.query).toHaveBeenCalledWith(sql, params);
    });

    it('should execute query without parameters passing undefined to the ORM', async () => {
      // Arrange
      const sql = 'SELECT COUNT(*) FROM mock_entity';
      mockOrmRepository.query.mockResolvedValue([]);

      // Act
      await repository.query(sql);

      // Assert
      expect(mockOrmRepository.query).toHaveBeenCalledWith(sql, undefined);
    });
  });

  describe('applyPagination', () => {
    it('should enforce minimum page value of 1', async () => {
      await repository.find({ pagination: { limit: 10, page: 0 } });
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0); 
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
    });
    it('should enforce minimum limit of page size on big set of data', async () => {
      await repository.find({ pagination: { limit: 100, page: 1 } });
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(100);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });

    it('should enforce minimum limit value of 1', async () => {
      await repository.find({ pagination: { limit: 0, page: 1 } });
      expect(mockQueryBuilder.take).toHaveBeenCalledWith(10);
      expect(mockQueryBuilder.skip).toHaveBeenCalledWith(0);
    });
  });
});