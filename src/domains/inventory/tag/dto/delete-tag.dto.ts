import { IsArray, IsNotEmpty, IsNumber, Min } from "class-validator";

export class DeleteTagsDto {
  @IsNotEmpty({ message: "tagsId is required" })
  @IsArray({ message: "tagsId must be an array of numbers" })
  @IsNumber({}, { each: true, message: "each tagId must be a number" })
  @Min(1, { each: true, message: "each tagId must be a positive number" })
  tagsId: number[];
}
