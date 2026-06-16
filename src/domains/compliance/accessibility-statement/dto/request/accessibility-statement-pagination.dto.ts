import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { AccessibilityStatement } from "../../entities/accessibility-statement.entity";


export class AccessibilityStatementPaginationDTO
  extends BasePaginationDTO<AccessibilityStatement>
  implements BasePagination {}
