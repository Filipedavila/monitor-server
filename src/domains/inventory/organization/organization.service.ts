import { Injectable } from "@nestjs/common";
import { Organization } from "./organization.entity";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationFilterDTO } from "./dto/request/organization-filter.dto";
import { CreateEntityDto } from "./dto/create-entity.dto";
import { FieldConflictException } from "src/common/exceptions/conflict.exception";


@Injectable()
export class OrganizationService {
  constructor(
    private readonly organizationRepository: OrganizationRepository,

  ) {}

  async findAll(
    organizationRequestDTO:OrganizationRequestDTO
  ): Promise<any> {
    return await this.organizationRepository.findMany(organizationRequestDTO);
  }


  async findByProperties(properties: Partial<OrganizationFilterDTO>): Promise<any> {
    return this.organizationRepository.findOneBy(properties);
  }


  async createOne(createEntityDto: CreateEntityDto): Promise<Organization> {
    const existingOrganization = await this.organizationRepository.getOrmRepository().findOne({ where: [{ shortName: createEntityDto.shortName }, { longName: createEntityDto.longName }] });
    if (existingOrganization) {
      const mapConflict: Record<string, string> = {};
      if (existingOrganization.shortName === createEntityDto.shortName) {
        mapConflict['shortName'] = `Organization with shortName '${createEntityDto.shortName}' already exists.`;
      }
      if (existingOrganization.longName === createEntityDto.longName) {
        mapConflict['longName'] = `Organization with longName '${createEntityDto.longName}' already exists.`;
      }
      throw new FieldConflictException(mapConflict);
    }
    const organization = new Organization();
    organization.shortName = createEntityDto.shortName;
    organization.longName = createEntityDto.longName;
    const websites = createEntityDto.websites;

    const result = await this.organizationRepository.saveWithWebsites(organization, websites);
    return result;
  }

  async update(
    entityId: number,
    shortName: string,
    longName: string,
    websites: number[],
  ): Promise<Organization> {
    return this.organizationRepository.updateWithWebsites(entityId, { shortName, longName }, websites);
  }

  async delete(entityId: number): Promise<any> {
    return this.organizationRepository.deleteOrganization(entityId);
  }

}
