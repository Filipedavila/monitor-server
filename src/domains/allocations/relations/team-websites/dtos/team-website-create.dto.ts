

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TagWebsite } from "../../tag-websites/tag-websites.entity";

export class CreateTeamWebsiteDto  extends PickType(TagWebsite, ['websiteId'] as const) {
@IsNotEmpty({message: "teamId is required"}  )
@IsNumber({}, { message:"teamId must be a number", each: true })
teamId:number;

@IsNotEmpty({message: "websiteIds is required"})
@IsArray({message: "websiteIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each websiteId must be a number" })
websiteIds: number[];
}
