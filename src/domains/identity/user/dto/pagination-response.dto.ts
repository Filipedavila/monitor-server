import { PaginationResponse } from "@common/repositories/base.repository";
import { UserDTO } from "./user.dto";

export class UserPaginationResponse implements PaginationResponse<UserDTO> {
    data: UserDTO[];
    meta: {
        totalItems: number;
        currentPage: number;
        totalPages: number;
        itemsPerPage: number;
    };
}