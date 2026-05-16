import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";
import { CrawlerWebsite } from "../../entities/crawler-website.entity";

export class CrawlerPaginationDTO
  extends BasePaginationDTO<CrawlerWebsite>
  implements BasePagination {}
