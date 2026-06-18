import { IsNotEmpty, IsOptional, IsString ,IsArray , IsNumber , Min} from "class-validator";

export class CreateOrganizationDTO {

  @IsNotEmpty({ message: "shortName must be provided" })
  @IsString({ message: "shortName must be a string" })
  shortName: string;
  @IsNotEmpty({ message: "longName must be provided" })
  @IsString({ message: "longName must be a string" })
  longName: string;
  @IsOptional()
  @IsArray({ message: "websiteIds must be an array of numbers" })
  @IsNumber({}, { each: true, message: "Each websiteId must be a number" })
  @Min(1, { each: true, message: "Each websiteId must be a positive integer" })
  websiteIds: number[];
}
