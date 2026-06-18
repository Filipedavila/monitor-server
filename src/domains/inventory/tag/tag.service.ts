import { Injectable,  NotFoundException } from "@nestjs/common";
import { Tag, TagContext } from "./tag.entity";
import { BaseService } from "src/common/services/base.service";
import { TagRepository } from "./tag.repository";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { AuthenticatedUser, RoleSlug } from "src/core/authentication/interfaces/types";
import { PaginationResponse } from "src/common/repositories/base.repository";
import { UpdateTagDTO } from "./dto/update-tag.dto";
import { CreateTagDTO } from "./dto/create-tag.dto";
import { Directory } from "../directory/directory.entity";
import { Website } from "../website/website.entity";

@Injectable()
export class TagService  extends BaseService {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {
    const context = "TagService";
    super(context);
  }

  async findAll( query: TagRequestDTO, securityContext: AuthenticatedUser): Promise<PaginationResponse<Tag>> {
    const roleSlug = securityContext?.role_slug;
    const authFilter = roleSlug === RoleSlug.ADMIN ? {} : { context: TagContext.STUDY_MONITOR };

      query.filters = {
        ...query.filters,
        ...authFilter
      };
      return await this.tagRepository.findMany(query);
    }
  
  async findById(tagId: number, securityContext: AuthenticatedUser): Promise<Tag> {
    const roleSlug = securityContext?.role_slug;
    const authFilter = roleSlug === RoleSlug.ADMIN ? {} : { context: TagContext.STUDY_MONITOR };

    const tag = await this.tagRepository.findOneBy({ id: tagId, ...authFilter });
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

  async findByOfficialTagName(tagName: string): Promise<Tag> {
    const tag = await this.tagRepository.getOrmRepository().findOne({
      where: { name: tagName, isOfficial: true },
    });
    if (!tag) {
      throw new NotFoundException(`Official tag with name ${tagName} not found`);
    }
    return tag;
  }

async update(updateTagDto: UpdateTagDTO, user: AuthenticatedUser): Promise<Tag> {
  const context = user?.role_slug === RoleSlug.ADMIN ? TagContext.ADMIN_AMS : TagContext.STUDY_MONITOR;
  const addItionalFilter =  context == TagContext.ADMIN_AMS ? { context: context }: { createdById: user.id, context: context } ;
  return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = await repo.manager.findOne(Tag, { 
      where: { id: updateTagDto.tagId, ...addItionalFilter }, 
      relations: ['directories', 'websites'] 
    });
    if (!tag) {
      throw new NotFoundException(`Tag with id ${updateTagDto.tagId} not found or you don't have permission to update it`);
    }

    if (updateTagDto.name !== undefined) {
      tag.name = updateTagDto.name;
    }


    if (updateTagDto.directories !== undefined) {
      tag.directories = updateTagDto.directories.map(id => ({ id }) as any);
    }

    if (updateTagDto.websites !== undefined) {
      tag.websites = updateTagDto.websites.map(id => ({ id }) as any);
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
    const context = user?.role_slug === RoleSlug.ADMIN ? TagContext.ADMIN_AMS : TagContext.STUDY_MONITOR; 
   return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = new Tag();
    tag.name = createDto.name;
    tag.createdAt = new Date();
    tag.context = context;
    tag.createdById = user.id;

    
    if (createDto.directories !== undefined) {
      await this.tagRepository.validateIdsEntity(Directory, createDto.directories || []);
      tag.directories = createDto.directories.map(id => ({ id }) as any);
    }

    if (createDto.websites !== undefined) {
          await this.tagRepository.validateIdsEntity(Website, createDto.websites || []);

      tag.websites = createDto.websites.map(id => ({ id }) as any);
    }


    return await repo.manager.save(tag);
  });
}

 async deleteBulk(tagsId: Array<number>, user: AuthenticatedUser): Promise<void> {
  if (!tagsId || tagsId.length === 0) {
    return;
  }

  const context = user?.role_slug === RoleSlug.ADMIN ? TagContext.ADMIN_AMS : TagContext.STUDY_MONITOR;

  const hasPermission = await this.tagRepository.validateContextAndOwnership(tagsId, context, user.id);
  if (!hasPermission) {
    throw new NotFoundException(
      `No tags found with the provided IDs or you don't have permission to delete them`
    );
  }
     await this.tagRepository.deleteBulk(tagsId);
 
}

  async import(tagsId: number[], tagName: string): Promise<any> {
    let tag = await this.tagRepository.findOneBy({ name: tagName });
    if (!tag) {
      tag = new Tag();
      tag.name = tagName;
      tag.isOfficial = true;
      tag.createdAt = new Date();
      await this.tagRepository.save(tag);
    }
  
    return await this.tagRepository.copyExistingTagsIds(tag, "official", tagsId);
  }


}
