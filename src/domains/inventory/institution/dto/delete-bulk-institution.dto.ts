import { IsArray, IsNotEmpty } from "class-validator";
import { IsNumber } from "class-validator/types/decorator/typechecker/IsNumber";

export class DeleteBulkInstitutionDto {
  @IsNotEmpty({message: "institutionIds is required"})
  @IsArray({message: "institutionIds must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each institution ID must be a number" })
  institutionIds: number[];
}
