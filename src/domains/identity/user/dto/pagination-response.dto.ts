import { PaginationResponse } from "src/core/types";
import { UserDTO } from "./user.dto";

export class UserPaginationResponse implements PaginationResponse<UserDTO> {
    data: UserDTO[];
    count: number;
}