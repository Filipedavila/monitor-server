import { PaginationResponse } from "@common/repositories/base.repository";
import {DirectoryDTO} from "./directory.dto";

export class DirectoryPaginationResponse implements PaginationResponse<DirectoryDTO> {
    data: DirectoryDTO[];
    meta: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
        itemsPerPage: number;
    };
}
