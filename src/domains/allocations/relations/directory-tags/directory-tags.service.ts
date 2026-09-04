import { Injectable, Logger, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { In, Repository, DataSource } from "typeorm";
import { Directory } from "src/domains/inventory/directory/directory.entity"; 
import { Tag } from "src/domains/inventory/tag/tag.entity";
import { sanitizeDelta } from "../util";

@Injectable( )
export class DirectoryTagsService {
  private readonly logger = new Logger("DirectoryTagsService");

  constructor(
    @InjectRepository(Directory)
    private readonly directoryRepo: Repository<Directory>,
    private readonly dataSource: DataSource
  ) {}

  async getTagsOnDirectory(
    directoryId: number
  ): Promise<{ id: number; name: string }[]> {
    const directory = await this.directoryRepo.findOne({
      where: { id: directoryId },
      relations: ['tags'],
      select: {
        id: true,
        tags: { id: true, name: true },
      },
    });

    if (!directory) {
      throw new NotFoundException(`Directory with ID ${directoryId} does not exist`);
    }

    return directory.tags;
  }

  async updateTagsOnDirectory(
    directoryId: number,
    toAdd: number[],
    toRemove: number[],
    actorId: number
  ): Promise<void> {
    const uniqueAdd = Array.from(new Set(toAdd));
    const uniqueRemove = Array.from(new Set(toRemove));
    const { add: sanitizedAdd, remove: sanitizedRemove } = sanitizeDelta(uniqueAdd, uniqueRemove);

    await this.dataSource.transaction(async (manager) => {
      const dirRepo = manager.getRepository(Directory);
      
      const directory = await dirRepo.findOne({
        where: { id: directoryId },
        relations: ['tags'],
      });

      if (!directory) {
        throw new NotFoundException(`Directory with ID ${directoryId} does not exist`);
      }

      if (sanitizedRemove.length > 0) {
        directory.tags = directory.tags.filter(
          (tag) => !sanitizedRemove.includes(tag.id)
        );
      }

      if (sanitizedAdd.length > 0) {
        const tagRepo = manager.getRepository(Tag);
        const existingTags = await tagRepo.find({
          where: { id: In(sanitizedAdd) },
          select: ['id'],
        });

        const validTagIds = new Set(existingTags.map((t) => t.id));
        const currentTagIds = new Set(directory.tags.map((t) => t.id));

        for (const tagId of sanitizedAdd) {
          if (validTagIds.has(tagId) && !currentTagIds.has(tagId)) {
            directory.tags.push({ id: tagId } as Tag);
            currentTagIds.add(tagId);
          }
        }
      }

      directory.updatedById = actorId;
      await dirRepo.save(directory);
    });
  }
}