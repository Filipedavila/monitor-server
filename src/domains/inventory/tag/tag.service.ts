import { Injectable,  NotFoundException } from "@nestjs/common";
import { Tag } from "./tag.entity";
import { BaseService } from "src/common/services/base.service";
import { TagRepository } from "./tag.repository";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { UpdateTagDTO } from "./dto/update-tag.dto";
import { CreateTagDTO } from "./dto/create-tag.dto";
import { ContextMap } from "../context/context.enum";
import { Context } from "../context/context.identity";

@Injectable()
export class TagService  extends BaseService {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {
    const context = "TagService";
    super(context);
  }

  async findAll( query: TagRequestDTO, securityContext: AuthenticatedUser): Promise<PaginationResponse<Tag>> {
;

      query.filters = {
        ...query.filters,

      };
      
      return await this.tagRepository.findMany(query);
    }
  
  async findById(tagId: number, securityContext: AuthenticatedUser): Promise<Tag> {

    const tag = await this.tagRepository.getOrmRepository().findOne({ where: { id: tagId, contexts: { id: securityContext.context.id } }, relations: ['contexts'] });
    if (!tag) {
      throw new NotFoundException(`Tag with id ${tagId} not found or you don't have permission to access it`);
    }
    return tag;
  }

  async findByName(tagName: string): Promise<Tag | null> {
    const tag = await this.tagRepository.findOneBy({ name: tagName });
    if(!tag) {
      throw new NotFoundException(`Tag with name ${tagName} not found`);
    }
    return tag;
  }



async update(updateTagDto: UpdateTagDTO, user: AuthenticatedUser): Promise<Tag> {
  
  return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = await repo.manager.findOne(Tag, { 
      where: { id: updateTagDto.tagId, contexts: { id: user.context.id }}, 
      relations: [ 'contexts'] 
    });
    if (!tag) {
      throw new NotFoundException(`Tag with id ${updateTagDto.tagId} not found or you don't have permission to update it`);
    }

    if (updateTagDto.name !== undefined) {
      tag.name = updateTagDto.name;
    }


    tag.updatedAt = new Date();
    tag.updatedById = user.id;


    return await repo.manager.save(tag);
  });
  }
  

  async createOne(
    createDto: CreateTagDTO,
    user: AuthenticatedUser
  ): Promise<Tag> {

   return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = new Tag();
    tag.name = createDto.name;
    tag.createdAt = new Date();
    tag.contexts = [user.context as Context];
    tag.createdById = user.id;

    
    return await repo.manager.save(tag);
  });
}

 async deleteBulk(tagsId: Array<number>, user: AuthenticatedUser): Promise<void> {
  if (!tagsId || tagsId.length === 0) {
    return;
  }

  const hasPermission = await this.tagRepository.validateContext(tagsId, user.context.id, user.id);
  if (!hasPermission) {
    throw new NotFoundException(
      `No tags found with the provided IDs or you don't have permission to delete them`
    );
  }
     await this.tagRepository.deleteBulk(tagsId);
 
}

}
