import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Tag } from "../../tag.entity";

export class TagPaginationDTO
  extends BasePaginationDTO<Tag>
  implements BasePagination {}
