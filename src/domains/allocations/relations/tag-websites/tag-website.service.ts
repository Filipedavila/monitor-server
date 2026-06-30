import { Injectable, Logger } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { TagWebsite } from "./tag-websites.entity";

@Injectable()
export class TagWebsitesService {
  private readonly logger = new Logger("TagWebsitesService");

  constructor(
    @InjectRepository(TagWebsite)
    private readonly assignmentRepo: Repository<TagWebsite>,
  ) {}


  async assignTagsToWebsite(tagsId: number[], websiteId: number, actorId: number): Promise<TagWebsite[]> {
    this.logger.log(`A associar as tags IDs [${tagsId.join(", ")}] ao website ID ${websiteId} pelo utilizador ID ${actorId}`);

    const allocations = tagsId.map(tagId => 
      this.assignmentRepo.create({ tagId, websiteId })
    );

    return await this.assignmentRepo.save(allocations);
  }

  async removeTagsFromWebsite(tagsId: number[], websiteId: number, actorId: number): Promise<void> {
    this.logger.log(`A remover as tags IDs [${tagsId.join(", ")}] do website ID ${websiteId} pelo utilizador ID ${actorId}`);

    await this.assignmentRepo.delete({
      websiteId,
    });
    
  
    await this.assignmentRepo
      .createQueryBuilder()
      .delete()
      .from(TagWebsite)
      .where("website_id = :websiteId", { websiteId })
      .andWhere("tag_id IN (:...tagsId)", { tagsId })
      .execute();
      

  }

}