import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, In, Repository, DataSource } from "typeorm";
import { TagWebsite } from "./tag-website.entity";
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { Website } from "src/domains/inventory/website/website.entity";
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
      const websiteRepo = manager.getRepository(Website);
      const websiteExists = await websiteRepo.findOne({ where: { id: websiteId } });
      if (!websiteExists) {
        throw new NotFoundException(`Website with ID ${websiteId} does not exist`);
      }

      await this.handleRemoveTags(sanitizedRemove, manager, websiteId);
      await this.handleAddTags(sanitizedAdd, manager, websiteId, actorId);
    });
  }

  private async handleAddTags(
    sanitizedAdd: number[],
    manager: EntityManager,
    websiteId: number,
    actorId: number
  ) {
    if (sanitizedAdd.length === 0) return;

    const tagRepo = manager.getRepository(Tag);
    const tagWebsiteRepo = manager.getRepository(TagWebsite);

    const existingTags = await tagRepo.find({
      where: { id: In(sanitizedAdd) },
      select: ['id'],
    });

    const validTagIds = existingTags.map(t => t.id);
    if (validTagIds.length === 0) return;

    const filteredAdd = sanitizedAdd.filter(id => validTagIds.includes(id));

    const existingAssignments = await tagWebsiteRepo.find({
      where: { websiteId, tagId: In(filteredAdd) }
    });
    
    const existingIds = new Set(existingAssignments.map(e => e.tagId));
    const toInsert = filteredAdd.filter(id => !existingIds.has(id));

    if (toInsert.length > 0) {
      await tagWebsiteRepo.save(
        toInsert.map(tagId => ({ 
          tagId, 
          websiteId, 
          createdBy: actorId 
        }))
      );
    }
  }

  private async handleRemoveTags(
    sanitizedRemove: number[],
    manager: EntityManager,
    websiteId: number
  ) {
    if (sanitizedRemove.length === 0) return;

    const tagWebsiteRepo = manager.getRepository(TagWebsite);

    const existing = await tagWebsiteRepo.find({
      where: { websiteId, tagId: In(sanitizedRemove) }
    });
    
    const existingIds = new Set(existing.map(e => e.tagId));
    const idsToRemove = sanitizedRemove.filter(id => existingIds.has(id));

    if (idsToRemove.length > 0) {
      await tagWebsiteRepo.delete({ 
        websiteId, 
        tagId: In(idsToRemove) 
      });
    }
  }
}