import { IsArray, IsNumber, Min } from "class-validator";

export class DeleteBulkWebsiteDto {
  @IsArray({message: "ids must be an array of numbers"})
  @IsNumber({}, { each: true, message: "each website ID must be a number" })
  @Min(1, { each: true, message: "each website ID must be greater than 0" })
  ids: number[];
}
