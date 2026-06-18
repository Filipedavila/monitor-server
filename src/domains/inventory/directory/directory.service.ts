import {  ForbiddenException, Injectable,  NotFoundException } from "@nestjs/common";
import { QueryRequest, PaginationResponse } from "src/common/repositories/base.repository";
import { DirectoryFilter, DirectoryRepository, DirectorySort } from "./repositories/directory.repository";
import { DirectoryPaginationDTO } from "./dto/request/query/directory-pagination.dto";
import { FgaService } from "src/core/authorization/fga.service";
import { SecurityContext } from "src/core/authorization/SecurityContext";
import { CreateDirectory } from "./dto/create-diretory.dto";
import { UpdateDirectory } from "./dto/update-diretory.dto";
import { DirectoryDTO } from "./dto/directory.dto";
import { plainToInstance } from "class-transformer";

@Injectable()
export class DirectoryService {
  constructor(
    private readonly repo: DirectoryRepository,
    private readonly fgaService: FgaService,
  ) {}

  async createOne(createDto: CreateDirectory): Promise<DirectoryDTO> {
    const directory = await this.repo.createWithTags(createDto);
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }

  async update(
    updateDto: UpdateDirectory
  ): Promise<DirectoryDTO> {
    const directory = await this.repo.updateWithTags(updateDto);
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }

  async delete(ids: number[], securityContext: SecurityContext): Promise<void> {
    /* TODO : Fix, its receiving 'all' from fga tuple and not a number
    const permitted = await this.fgaService
      .listObjects({ user: `user:${securityContext.user.id}`, relation: 'can_manage', type: 'directory' })
      .then((objects) => objects.map((obj) => parseInt(obj.split(':')[1], 10)));

    const toDelete = ids.filter((id) => permitted.includes(id));
    */
    for (const id of ids) {
      await this.repo.delete(id);
      await this.fgaService.deleteResourceTuples(`directory:${id}`);
    }
  }


  async findAll(
    queryArgs: QueryRequest<DirectoryFilter, DirectorySort, DirectoryPaginationDTO>,
    securityContext: SecurityContext,
  ): Promise<PaginationResponse<DirectoryDTO>> {
    if (!securityContext?.user?.id) {
      throw new ForbiddenException("User not authenticated");
    }
    /*
    const objectsId = await this.fgaService.listObjects({
      user: `user:${securityContext.user.id}`,
      relation: 'can_view',
      type: 'directory',
    });*/

    queryArgs.filters = {
      ...queryArgs.filters
     // ids: objectsId.map((id) => parseInt(id.split(':')[1], 10)),
    };

    return this.repo.findMany(queryArgs);
  }


  async getDirectory(directoryId: number): Promise<DirectoryDTO> {
    const directory = await this.repo.findById(directoryId);
    if (!directory) {
      throw new NotFoundException(`Directory with ID ${directoryId} not found`);
    }
    return plainToInstance(DirectoryDTO, directory, { excludeExtraneousValues: true });
  }
}