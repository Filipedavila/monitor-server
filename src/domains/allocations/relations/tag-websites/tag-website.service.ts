import { Injectable, Logger, InternalServerErrorException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, DataSource, In } from "typeorm";
import { TagWebsite } from "./tag-websites.entity";
import { sanitizeDelta } from "../util";

@Injectable()
export class TagWebsitesService {
  private readonly logger = new Logger("TagWebsitesService");

  constructor(
    @InjectRepository(TagWebsite)
    private readonly assignmentRepo: Repository<TagWebsite>,
    private readonly dataSource: DataSource
  ) {}

  async getTagsOnWebsite(
    websiteId: number
  ): Promise<{ id: number; name: string }[]> {
  return await this.assignmentRepo
    .createQueryBuilder('assignment')
    .innerJoin('assignment.tag', 'tag') 
    .select('tag.id', 'id')
    .addSelect('tag.name', 'name')
    .where('assignment.websiteId = :websiteId', { websiteId })
    .getRawMany();
  }
  
  async updateTagsOnWebsite(
    websiteId: number,
    toAdd: number[],
    toRemove: number[],
    actorId: number
  ): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.dataSource.transaction(async (manager) => {
      if (sanitizedRemove.length > 0) {

        await manager.delete(TagWebsite, { 
          websiteId, 
          tagId: In(sanitizedRemove) 
        });
      }

      if (sanitizedAdd.length > 0) {
        const existing = await manager.find(TagWebsite, { 
          where: { websiteId, tagId: In(sanitizedAdd) } 
        });
        
        const existingIds = existing.map(e => e.tagId);
        const toInsert = sanitizedAdd.filter(id => !existingIds.includes(id));

        if (toInsert.length > 0) {
          await manager.save(TagWebsite, toInsert.map(tagId => ({ 
            tagId, 
            websiteId, 
            createdBy: actorId 
          })));
        }
      }
    }).catch(err => {
      this.logger.error(`Falha na atualização de tags: ${err.message}`);
      throw new InternalServerErrorException("Erro ao processar atualização de tags");
    });
  }
}