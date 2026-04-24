import { BasePaginationDto } from "src/common/dto/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";

export class WebsitePaginationDTO
  extends BasePaginationDto
  implements BasePagination {}
