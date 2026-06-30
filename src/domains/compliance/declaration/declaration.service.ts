import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { WebsiteDeclaration } from "./declaration.entity";
import { AuditStatus } from "src/common/enums/audit-status.enum";

@Injectable()
export class WebsiteDeclarationService {
  constructor(
    @InjectRepository(WebsiteDeclaration)
    private readonly declarationRepo: Repository<WebsiteDeclaration>,
  ) {}

  async getDeclarationByWebsiteId(websiteId: number): Promise<WebsiteDeclaration | null> {
    return this.declarationRepo.findOne({ where: { websiteId } });
  }

  async upsertDeclaration(
    websiteId: number,
    status: AuditStatus,
    createdAt:Date,
    createdById: number ): Promise<WebsiteDeclaration> {
    let declaration = await this.getDeclarationByWebsiteId(websiteId);

    if (!declaration) {
      
        declaration = this.declarationRepo.create({ 
          websiteId,
          createdById,
          createdAt 
        });

    }else{

        declaration.updatedAt = createdAt;
        declaration.status = status;
    
    }

    return this.declarationRepo.save(declaration);

  } 
}