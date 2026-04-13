import { Injectable } from "@nestjs/common";
import {
  EntityRepository,
  QueryRequest,
  QueryResponse,
} from "./base.repository";
import {
  Repository,
  SelectQueryBuilder,
  Brackets,
  WhereExpressionBuilder,
} from "typeorm";
import { BaseAccess, GranteeType } from "../entities/base-access.entity";
import { BaseFilter, BasePagination, BaseSort } from "../interfaces/types";
import { BaseModel } from "../entities/base.entity";
import { AppLoggerService } from "src/core/app-logger/app-logger.service";
import { ConfigService } from "@nestjs/config";
import { AccessLevelProvider } from "src/core/security-authorization/access-level.service";
import { AccessLevelCode } from "src/core/security-authorization/entitities/access-level.entity";
import {
  AccessPolicyMap,
  AccessScope,
  BaseGrant,
  DatabaseOperation,
  SecurityContext,
  validateSecurityContext,
} from "src/core/security-authorization/SecurityContext";
import {
  AccessRelationNotFoundException,
  UnknownGranteeTypeException,
} from "src/core/security-authorization/exceptions/security-authorization.exceptions";

export interface SecureQueryRequest<F, S, P> extends QueryRequest<F, S, P> {
  securityContext: SecurityContext;
}

export type GrantMap<A extends BaseGrant> = {
  [P in keyof A]: (
    query: WhereExpressionBuilder,
    value: NonNullable<A[P]>,
    index: number,
  ) => void;
};

@Injectable()
export abstract class SecureEntityRepository<
  T extends BaseModel,
  A extends BaseAccess<T>,
  TF extends BaseFilter,
  AG extends BaseGrant,
  TS extends BaseSort,
  TP extends BasePagination,
> extends EntityRepository<T, TF, TS, TP> {
  protected abstract readonly aliasAccessTable: string;
  private readonly accesscolumnMap = new Map<keyof AG, string>();
  private _relationAccessPath?: string;
  protected abstract readonly accessStrategy: AccessScope;
  protected abstract readonly AccessPolicyMap: AccessPolicyMap;

  protected readonly SecureAccessGrantMap: GrantMap<AG> = {
    granteeId: (q, val, index) => this.applyGrant(q, "granteeId", val, index),
    granteeType: (q, val, index) =>
      this.applyGrant(q, "granteeType", val, index),
    accessLevel: (q, val, index) =>
      this.applySatisfyingLevelsGrant(q, "accessLevel", val, index),
  } as GrantMap<AG>;
  constructor(
    orm: Repository<T>,
    protected readonly accessOrm: Repository<A>,
    logger: AppLoggerService,
    configService: ConfigService,
    protected readonly accessLevelProvider: AccessLevelProvider,
  ) {
    super(orm, logger, configService);
    this.initializeColumnMap();
  }

  override async find(
    queryArgs: SecureQueryRequest<TF, TS, TP>,
  ): Promise<QueryResponse<T>> {
    return this.findSecure(queryArgs);
  }
  async findSecure(
    queryArgs: SecureQueryRequest<TF, TS, TP>,
  ): Promise<QueryResponse<T>> {
    validateSecurityContext(queryArgs.securityContext);
    const requiredGrants = this.generateRequiredGrants(
      queryArgs.securityContext,
      DatabaseOperation.READ,
    );
    const query = this.orm.createQueryBuilder(`${this.alias}`);
    this.applySecureAccessJoin(query);
    this.applySecurityPolicies(query, requiredGrants);
    this.applyDynamicFilters(query, queryArgs.filters);
    this.applyDynamicSorting(query, queryArgs.sorting);
    this.applyPagination(query, queryArgs.pagination);

    const [data, count] = await query.distinct(true).getManyAndCount();

    return { data, count };
  }

  protected generateRequiredGrants(
    securityContext: SecurityContext,
    operation: DatabaseOperation,
  ): BaseGrant[] {
    const minimumRequiredLevel = this.AccessPolicyMap[operation];
    const satisfyingLevels =
      this.accessLevelProvider.getSatisfyingLevels(minimumRequiredLevel);
    const grants: BaseGrant[] = [];
    Object.entries(GranteeType).forEach(([_, granteeType]) => {
      const granteeId = this.getIdBasedOnGranteeType(
        securityContext,
        granteeType as GranteeType,
      );
      if (granteeId === undefined) {
        return;
      }
      if (satisfyingLevels?.length) {
        grants.push({
          granteeId: granteeId,
          granteeType: granteeType,
          accessLevel: satisfyingLevels,
        });
      }
    });
    return grants;
  }

  protected getIdBasedOnGranteeType(
    securityContext: SecurityContext,
    granteeType: GranteeType,
  ): number | undefined {
    switch (granteeType) {
      case GranteeType.USER:
        return securityContext.userId;
      case GranteeType.ROLE:
        return securityContext.roleId;
      case GranteeType.INSTITUTION:
        return securityContext.institutionId ?? undefined;
      default:
        throw new UnknownGranteeTypeException(granteeType);
    }
  }

  protected applySecureAccessJoin(query: SelectQueryBuilder<T>) {
    const relationPath = this.relationPath;
    if (this.accessStrategy === AccessScope.PRIVATE) {
      query.innerJoin(`${this.alias}.${relationPath}`, this.aliasAccessTable);
    } else {
      query.leftJoin(`${this.alias}.${relationPath}`, this.aliasAccessTable);
    }
  }

  protected applySecurityPolicies(
    query: SelectQueryBuilder<T>,
    identities: BaseGrant[],
  ) {
    const isMandatory = this.accessStrategy === AccessScope.PRIVATE;
    if (!identities?.length) {
      return isMandatory
        ? query.andWhere("1 = 0")
        : query.andWhere(`${this.aliasAccessTable}.id IS NULL`);
    }

    return query.andWhere(
      new Brackets((mainSecurityBracket) => {
        identities.forEach((identity, index) => {
          mainSecurityBracket.orWhere(
            new Brackets((identityBracket) => {
              for (const key in this.SecureAccessGrantMap) {
                const grantMapFn = this.SecureAccessGrantMap[key as keyof AG];
                const value = identity[key as keyof BaseGrant];

                if (value !== undefined && value !== null && grantMapFn) {
                  grantMapFn(
                    identityBracket,
                    value as NonNullable<AG[keyof AG]>,
                    index,
                  );
                }
              }
            }),
          );
        });
        if (!isMandatory) {
          mainSecurityBracket.orWhere(`${this.aliasAccessTable}.id IS NULL`);
        }
      }),
    );
  }

  private applyGrant(
    query: WhereExpressionBuilder,
    property: keyof AG,
    value: any,
    index: number,
  ): void {
    const col = this.getAccessColumnName(property);
    const param = `auth_${String(property)}__${index}`;

    query.andWhere(`${this.aliasAccessTable}.${col} = :${param}`, {
      [param]: value,
    });
  }

  private applySatisfyingLevelsGrant(
    query: WhereExpressionBuilder,
    property: keyof AG,
    values: AccessLevelCode[],
    index: number,
  ): void {
    const col = this.getAccessColumnName(property);
    const param = `auth_${String(property)}__${index}`;

    query.andWhere(`${this.aliasAccessTable}.${col} IN (:...${param})`, {
      [param]: values,
    });
  }
  private getAccessColumnName(property: keyof AG): string {
    return this.accesscolumnMap.get(property)!;
  }

  private initializeColumnMap() {
    Object.keys(this.SecureAccessGrantMap).forEach((prop) => {
      const col = this.accessOrm.metadata.findColumnWithPropertyName(prop);
      if (!col) {
        throw new Error(
          `[CRITICAL] Property ${prop} not found in DB metadata for ${this.accessOrm.metadata.name}`,
        );
      }
      this.accesscolumnMap.set(prop as keyof AG, col.databaseName);
    });
  }

  protected get relationPath(): string {
    if (!this._relationAccessPath) {
      this._relationAccessPath = this.getAccessRelationProperty();
    }
    return this._relationAccessPath;
  }

  private getAccessRelationProperty(): string {
    const relation = this.orm.metadata.relations.find(
      (rel) => rel.type === this.accessOrm.metadata.target,
    );

    if (!relation) {
      throw new AccessRelationNotFoundException(
        this.orm.metadata.name,
        this.accessOrm.metadata.name,
      );
    }

    return relation.propertyName;
  }
}
