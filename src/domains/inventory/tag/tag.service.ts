import { Injectable,  NotFoundException } from "@nestjs/common";
import { Tag } from "./tag.entity";
import { BaseService } from "src/common/services/base.service";
import { TagRepository } from "./tag.repository";
import { TagRequestDTO } from "./dto/request/tag-request.dto";
import { AuthenticatedUser } from "src/core/authentication/interfaces/types";
import { QueryResponse } from "src/common/repositories/base.repository";
import { UpdateTagDto } from "./dto/update-tag.dto";
import { CreateTagDto } from "./dto/create-tag.dto";

@Injectable()
export class TagService  extends BaseService {
  constructor(
    private readonly tagRepository: TagRepository,
  ) {
    const context = "TagService";
    super(context);
  }

  async findAll( query: TagRequestDTO, securityContext: AuthenticatedUser): Promise<QueryResponse<Tag>> {
    return await this.tagRepository.findMany(query);
  }

  async findByName(tagName: string): Promise<Tag | null> {
    const tag = await this.tagRepository.findOneBy({ name: tagName });
    if(!tag) {
      throw new NotFoundException(`Tag with name ${tagName} not found`);
    }
    return tag;
  }

  async findByOfficialTagName(tagName: string): Promise<Tag | null> {
    const tag = await this.tagRepository.getOrmRepository().findOne({
      where: { name: tagName, isOfficial: true },
    });
    return tag;
  }

async update(updateTagDto: UpdateTagDto): Promise<Tag> {
  return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = await repo.manager.findOneOrFail(Tag, { 
      where: { id: updateTagDto.tagId }, 
      relations: ['directories', 'websites'] 
    });

    if (updateTagDto.name !== undefined) {
      tag.name = updateTagDto.name;
    }


    if (updateTagDto.directories !== undefined) {
      tag.directories = updateTagDto.directories.map(id => ({ id }) as any);
    }

    if (updateTagDto.websites !== undefined) {
      tag.websites = updateTagDto.websites.map(id => ({ id }) as any);
    }


    return await repo.manager.save(tag);
  });
  }
  

  async createOne(
    createDto: CreateTagDto
  ): Promise<Tag> {
   return await this.tagRepository.runInTransaction(async (repo) => {
    const tag = new Tag();
    tag.name = createDto.name;
    tag.createdAt = new Date();



    if (createDto.directories !== undefined) {
      tag.directories = createDto.directories.map(id => ({ id }) as any);
    }

    if (createDto.websites !== undefined) {
      tag.websites = createDto.websites.map(id => ({ id }) as any);
    }


    return await repo.manager.save(tag);
  });
}

  async deleteBulk(tagsId: Array<number>): Promise<void> {
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
