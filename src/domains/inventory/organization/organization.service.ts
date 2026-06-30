import { Injectable } from "@nestjs/common";
import { Organization } from "./organization.entity";
import { OrganizationRequestDTO } from "./dto/request/organization-request.dto";
import { OrganizationRepository } from "./organization.repository";
import { OrganizationFilterDTO } from "./dto/request/organization-filter.dto";
import { CreateOrganizationDto } from "./dto/create-organization.dto";


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

  async createOne(createOrganizationDto: CreateOrganizationDto): Promise<Organization> {
   
    const organization = new Organization();
    organization.shortName = createOrganizationDto.shortName;
    organization.longName = createOrganizationDto.longName;

    const result = await this.organizationRepository.save(organization);
    return result;
  }

  async update(
    organizationId: number,
    shortName: string,
    longName: string,
  ): Promise<Organization> {
    return this.organizationRepository.update(organizationId, { shortName, longName });
  }

  async delete(organizationId: number): Promise<any> {
    return this.organizationRepository.deleteOrganization(organizationId);
  }

}
