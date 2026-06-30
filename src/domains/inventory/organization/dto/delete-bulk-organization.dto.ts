import { IsArray, IsNotEmpty } from "class-validator";
import { IsNumber } from "class-validator/types/decorator/typechecker/IsNumber";

export class DeleteBulkOrganizationDto {
  @IsNotEmpty({message: "organizationIds is required"})
  @IsArray({message: "organizationIds must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each organization ID must be a number" })
  organizationIds: number[];
}
