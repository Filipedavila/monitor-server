import { IsNotEmpty, IsNumber, Min } from "class-validator";

export class DeleteOrganizationDto {
  @IsNotEmpty({message: "organizationId is required"})
  @IsNumber({}, {message: "organizationId must be a number"})
  @Min(1, {message: "organizationId must be greater than 0"})
  organizationId: number;
}
