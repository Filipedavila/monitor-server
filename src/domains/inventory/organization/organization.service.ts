import { Injectable, NotFoundException } from "@nestjs/common";
import { Organization } from "./organization.entity";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationFilterDTO } from "./dto/request/organization-filter.dto";
import { FieldConflictException } from "src/common/exceptions/conflict.exception";
import { CreateOrganizationDTO } from "./dto/create-organization.dto";


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
    const organization = await this.organizationRepository.findOneBy(properties);
    if (!organization) {
      throw new NotFoundException("Organization not found");
    }
    return organization;
  }


  async createOne(createOrganization: CreateOrganizationDTO, actorId: number): Promise<Organization> {
    const existingOrganization = await this.organizationRepository.getOrmRepository().findOne({ where: [{ shortName: createOrganization.shortName }, { longName: createOrganization.longName }] });
    if (existingOrganization) {
      const mapConflict: Record<string, string> = {};
      if (existingOrganization.shortName === createOrganization.shortName) {
        mapConflict['shortName'] = `Organization with shortName '${createOrganization.shortName}' already exists.`;
      }
      if (existingOrganization.longName === createOrganization.longName) {
        mapConflict['longName'] = `Organization with longName '${createOrganization.longName}' already exists.`;
      }
      throw new FieldConflictException(mapConflict);
    }
    const organization = new Organization();
    organization.shortName = createOrganization.shortName;
    organization.longName = createOrganization.longName;
    organization.createdById = actorId;
    const websiteIds = createOrganization.websiteIds || [];

    const result = await this.organizationRepository.saveWithWebsites(organization, websiteIds);
    return result;
  }

  async update(
    entityId: number,
    shortName: string,
    longName: string,
    websiteIds: number[],
    actorId: number
  ): Promise<Organization> {
    return this.organizationRepository.updateWithWebsites(entityId, { shortName, longName, updatedById: actorId }, websiteIds);
  }

  async delete(entityId: number): Promise<any> {
    return this.organizationRepository.deleteOrganization(entityId);
  }

}
