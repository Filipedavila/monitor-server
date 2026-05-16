import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { Evaluation } from "../../entities/evaluation.entity";

export class EvaluationPaginationDTO
  extends BasePaginationDTO<Evaluation>
  implements BasePagination {}
