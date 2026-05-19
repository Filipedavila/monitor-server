import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { User } from "../../user.entity";


export class UserPaginationDTO
  extends BasePaginationDTO<User>
  implements BasePagination {}
