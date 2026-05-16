import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Website } from "../../../website.entity";

export class WebsitePaginationDTO
  extends BasePaginationDTO<Website>
  implements BasePagination {}
