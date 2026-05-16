import { Page } from "puppeteer";
import { BasePaginationDTO } from "src/common/dto/request/base-pagination.dto";
import { BasePagination } from "src/common/interfaces/types";

export class PagePaginationDTO
  extends BasePaginationDTO<Page>
  implements BasePagination {}
