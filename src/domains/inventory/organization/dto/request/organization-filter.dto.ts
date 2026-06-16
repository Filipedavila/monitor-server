import { BaseFilterDTO } from "src/common/dto/request/base-filter.dto";

import { IsNumber, IsOptional, IsString } from "class-validator";
import { Organization } from "../../organization.entity";

export class OrganizationFilterDTO extends BaseFilterDTO<Organization> 
implements Partial<Pick<Organization, 'id' | 'shortName' | 'longName'>> {
    @IsOptional()
    @IsNumber({}, {message: "id must be a number"})
    id?: number;

    @IsOptional()
    @IsString({message: "shortName must be a string"})
    shortName?: string;

    @IsOptional()
    @IsString({message: "longName must be a string"})
    longName?: string;


}
