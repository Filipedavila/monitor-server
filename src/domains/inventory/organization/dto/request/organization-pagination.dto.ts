import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Organization } from "../../organization.entity";

export class OrganizationPaginationDTO
  extends BasePaginationDTO<Organization>
  implements BasePagination {}
