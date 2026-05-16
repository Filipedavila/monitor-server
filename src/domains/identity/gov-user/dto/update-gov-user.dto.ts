import { PartialType } from "@nestjs/mapped-types";
import { IsNotEmpty, IsNumber, IsOptional } from "class-validator";
import { User } from "src/domains/identity/user/user.entity";
import { CreateGovUserDto } from "./create-gov-user.dto";
import { Organization } from "../../organization/organization.entity";

export class UpdateGovUserDto extends PartialType(CreateGovUserDto) {
  @IsNotEmpty()
  @IsNumber()
  id: number;

  @IsOptional()
  entities?: Organization[];
}
