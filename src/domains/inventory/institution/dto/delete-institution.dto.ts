import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class DeleteInstitutionDto {
  @IsNotEmpty({message: "institutionId is required"})
  @IsNumber({}, {message: "institutionId must be a number"})
  @Min(1, {message: "institutionId must be greater than 0"})
  institutionId: number;
}
