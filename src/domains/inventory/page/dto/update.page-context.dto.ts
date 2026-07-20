import { IsArray, IsEnum, IsNotEmpty, IsNumber, Min } from "class-validator";
import { ContextEnum } from "../../context/context.enum";
export class UpdatePageContextDto {
    @IsNotEmpty({ message: "Page IDs are required" })
    @IsArray({ message: "Page IDs must be an array of numbers" })
    @IsNumber({}, { each: true, message: "Each page ID must be a number" })
    @Min(1, { each: true, message: "Each page ID must be a positive number" })  
    pageIds: number[];

    @IsNotEmpty({ message: "Page contexts are required" })
    @IsEnum(ContextEnum, { each: true, message: "Each context must be a valid ContextEnum value: should be one of: " + Object.values(ContextEnum).join(", ") })
    contexts: ContextEnum[];
    

}
