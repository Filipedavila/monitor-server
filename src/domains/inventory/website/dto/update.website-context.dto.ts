import { IsEnum, IsNotEmpty } from "class-validator";
import { ContextEnum } from "../../context/context.enum";
export class UpdateWebsiteContextDto {

    @IsNotEmpty({ message: "Website contexts are required" })
    @IsEnum(ContextEnum, { each: true, message: "Each context must be a valid ContextEnum value: should be one of: " + Object.values(ContextEnum).join(", ") })
    contexts: ContextEnum[];
    

}
