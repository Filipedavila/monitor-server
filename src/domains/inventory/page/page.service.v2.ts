import { Injectable, NotFoundException } from "@nestjs/common";
import { Page } from "./page.entity";
import { PageRepository } from "./repositories/page.repository";
import { AbilityFactory } from "src/core/security-authorization/ablities/ability.factory";
import { SecurityContext } from "src/core/security-authorization/SecurityContext";
import { ForbiddenError } from "@casl/ability";
import { PageFilter, PageSort, PagePagination } from "./interfaces/page.interfaces";

@Injectable()
export class PageService {
  constructor(
    private readonly pageRepo: PageRepository, // Herda de SecureEntityRepository
    private readonly abilityFactory: AbilityFactory,
  ) {}

  /**
   * Procura páginas com suporte a RLS (Row Level Security) e CASL
   */
  async findAll(
    queryArgs: SecureQueryRequest<PageFilter, PageSort, PagePagination>
  ): Promise<QueryResponse<Page>> {
    return this.pageRepo.findSecure(queryArgs);
  }

  /**
   * Criação de página com garantia de unicidade via Hash
   */
  async create(url: string, securityContext: SecurityContext): Promise<Page> {
    const ability = this.abilityFactory.createForUser(securityContext);
    
    // O hash é gerado automaticamente pelo @BeforeInsert na Entidade
    const newPage = this.pageRepo.create({ url });

    if (ability.cannot(Action.Create, newPage)) {
      throw new ForbiddenException("Not allowed to create pages");
    }

    return this.pageRepo.save(newPage);
  }

  /**
   * Atualização de visibilidade (Allowed Roles)
   */
  async updateVisibility(
    id: number, 
    roleIds: number[], 
    securityContext: SecurityContext
  ): Promise<Page> {
    const page = await this.pageRepo.findById(id);
    if (!page) throw new NotFoundException();

    const ability = this.abilityFactory.createForUser(securityContext);
    if (ability.cannot(Action.Update, page)) {
      throw new ForbiddenException();
    }

    // Gerido via relação ManyToMany definida na entidade
    page.allowedRoles = roleIds.map(id => ({ id } as Role));
    return this.pageRepo.save(page);
  }

  /**
   * Eliminação (Soft Delete já integrado via AuditableEntity)
   */
  async delete(id: number, securityContext: SecurityContext): Promise<void> {
    const page = await this.pageRepo.findById(id);
    if (!page) throw new NotFoundException();

    const ability = this.abilityFactory.createForUser(securityContext);
    if (ability.cannot(Action.Delete, page)) {
      throw new ForbiddenException();
    }

    await this.pageRepo.delete(id);
  }
}