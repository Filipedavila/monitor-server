import { Injectable } from "@nestjs/common";
import { SecureEntityRepository } from "src/common/repositories/access-secure.repository";
import { Page } from "./page.entity";
import { AccessPolicyMap, AccessScope, BaseGrant } from "src/core/security-authorization/SecurityContext";
import { BaseFilter, BasePagination, BaseSort, SortCriteria } from "src/common/interfaces/types";
import { GranteeType } from "src/common/entities/base-access.entity";
import { AccessLevelCode } from "src/core/security-authorization/entitities/access-level.entity";
export interface PageFilter extends BaseFilter {
  url?: string;
  url_hash?: string;
  websiteId?: number;
  roleId?: number; // Para filtrar por allowedRoles
}

export interface PageSort extends BaseSort {
  url?: SortCriteria;
  createdAt?: SortCriteria;
  // Colunas virtuais que o Repo vai injetar
  score?: SortCriteria;
}

export interface PagePagination extends BasePagination {}

export interface PageGrant extends BaseGrant {
  granteeId: number;
  granteeType: GranteeType;
  accessLevel: AccessLevelCode[];
}
@Injectable()
export class PageRepository extends SecureEntityRepository<
  Page,
  PageAccess,
  PageFilter,
  PageGrant,
  PageSort,
  PagePagination
> {
  protected readonly alias = "page";
  protected readonly aliasAccessTable = "page_access";
  protected readonly accessStrategy = AccessScope.INCLUSIVE;
    
  protected readonly AccessPolicyMap: AccessPolicyMap = {
    [DatabaseOperation.READ]: AccessLevelCode.VIEWER,
    [DatabaseOperation.WRITE]: AccessLevelCode.EDITOR,
    [DatabaseOperation.DELETE]: AccessLevelCode.OWNER,
  };

  protected readonly filterMap: FilterMap<PageFilter, Page> = {
    uri: (query, val) => this.addFilter(query, "uri", val, "like"),
    websiteId: (query, val) => {
      query.innerJoin("page.websites", "website")
           .andWhere("website.id = :websiteId", { websiteId: val });
    },
    hasError: (query, val) => {
       query.innerJoin("page.evaluationList", "el")
            .andWhere(val ? "el.error IS NOT NULL" : "el.error IS NULL");
    }
  };

  protected readonly sortMap: SortingMap<PageSort, Page> = {
    uri: (query, order) => this.addSort(query, "uri", order),
    score: (query, order) => query.addOrderBy("evaluation.score", order),
    date: (query, order) => query.addOrderBy("evaluation.createdAt", order),
  };
}