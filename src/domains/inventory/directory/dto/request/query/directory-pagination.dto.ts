import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Directory } from "../../../directory.entity";

export class DirectoryPaginationDTO
  extends BasePaginationDTO<Directory>
  implements BasePagination {}
