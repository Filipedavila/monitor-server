import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Brackets, Repository } from "typeorm";
import { BaseTransactionalRepository } from "src/common/repositories/base-transactional.repository";
import { FilterMap, SortingMap } from "src/common/repositories/base.repository";
import { BaseFilter, BaseSort, SortCriteria } from "src/common/interfaces/types";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { AccessibilityStatement } from "./entities/accessibility-statement.entity";
import { CreateAccessibilityStatementDto } from "./dto/create-accessibility-statement.dto";

export interface AccessibilityStatementFilter extends BaseFilter {
  id?: number;
  websiteId?: number;
  websiteTitle?: string;
  statementDate?: Date;
  createdAt?: Date;
  year?: number;
  searchTerm?: string;

}

export interface AccessibilityStatementSort extends BaseSort {
  websiteId?: SortCriteria;
  websiteTitle?: SortCriteria;
  statementDate?: SortCriteria;
  createdAt?: SortCriteria;
  year?: SortCriteria;
}

@Injectable()
export class AccessibilityStatementRepository extends BaseTransactionalRepository<
  AccessibilityStatement,
  AccessibilityStatementFilter,
  AccessibilityStatementSort
> {
  protected readonly alias = "stmt";

  constructor(
    @InjectRepository(AccessibilityStatement)
    protected readonly ormRepo: Repository<AccessibilityStatement>,
    protected readonly logger: AppLoggerService,
    protected readonly configService: ConfigService,
  ) {
    super(ormRepo, logger, configService);
  }

  protected readonly filterMap: FilterMap<AccessibilityStatementFilter, AccessibilityStatement> = {
    id: (query, value) => {
      query.andWhere(`${this.alias}.id = :id`, { id: value });
    },
    ids: (query, value) => {
      query.andWhere(`${this.alias}.id IN (:...ids)`, { ids: value });
    },
    websiteId: (query, value) => {
      query.andWhere(`${this.alias}.website_id = :websiteId`, { websiteId: value });
    },
    websiteTitle: (query, value) => {
      query.leftJoin(`${this.alias}.website`, "website")
           .andWhere("website.title = :title", { title: value });
    },
    createdAt: (query, value) => {
      query.andWhere(`${this.alias}.createdAt = :createdAt`, { createdAt: value });
    },
    statementDate: (query, value) => {
      query.andWhere(`${this.alias}.statementDate = :statementDate`, { statementDate: value });
    },
    year: (query, value) => {
      query.andWhere(`YEAR(${this.alias}.statementDate) = :year`, { year: value });
    },
    searchTerm: (query, value) => {
      query.andWhere(
        new Brackets((qb) => {
          qb.where(`${this.alias}.statementDate LIKE :searchTerm`, { searchTerm: `%${value}%` });
        }),
      );
    },
  };

  protected readonly sortMap: SortingMap<AccessibilityStatementSort, AccessibilityStatement> = {
    id: (query, order) => {
      this.addSort(query, "id", order);
    },
    websiteId: (query, order) => {
      this.addSort(query, "websiteId", order);
    },
    websiteTitle: (query, order) => {
      query.leftJoin(`${this.alias}.website`, "website")
           .addOrderBy("website.title", order);
    },
    statementDate: (query, order) => {
      this.addSort(query, "statementDate", order);
    },
    createdAt: (query, order) => {
      this.addSort(query, "createdAt", order);
    },
    year: (query, order) => {
      query.addOrderBy(`YEAR(${this.alias}.statementDate)`, order);
    },
  };


  async findLatestByWebsiteId(websiteId: number): Promise<AccessibilityStatement | null> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(`${this.alias}.website`, "website")
      .where(`${this.alias}.website_id = :websiteId`, { websiteId })
      .orderBy(`${this.alias}.statementDate`, "ASC")
      .getOne();
  }

  async findByWebsiteTitle(title: string): Promise<AccessibilityStatement | null> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(`${this.alias}.website`, "website")
      .where("website.title = :title", { title })
      .getOne();
  }


  async createStatement(
    dto: CreateAccessibilityStatementDto,
  ): Promise<AccessibilityStatement> {
    const statement = new AccessibilityStatement();
    statement.websiteId = dto.websiteId;
    statement.conformance = dto.conformance;
    statement.evidence = dto.evidence;
    statement.seal = dto.seal;
    statement.statementDate = dto.statementDate;
    statement.state = dto.state;
    return this.save(statement);
  }

  async updateHash(id: number, hash: string): Promise<AccessibilityStatement> {
    const statement = await this.findByIdOrFail(id);
    statement.hash = hash;
    return this.save(statement);
  }

  
  async findAllWithWebsite(): Promise<AccessibilityStatement[]> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .leftJoinAndSelect(`${this.alias}.website`, "website")
      .getMany();
  }

  async findAllStatementDates(): Promise<Pick<AccessibilityStatement, "statementDate">[]> {
    return this.ormRepo
      .createQueryBuilder(this.alias)
      .select(`${this.alias}.statementDate`)
      .getMany();
  }


}