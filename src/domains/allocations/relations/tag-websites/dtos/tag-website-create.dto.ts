

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TagWebsite } from "../tag-websites.entity";

export class CreateWebsiteTagsDto  extends PickType(TagWebsite, ['websiteId'] as const) {
@IsNotEmpty({message: "websiteId is required"}  )
@IsNumber({}, { message:"websiteId must be a number", each: true })
websiteId:number;

@IsNotEmpty({message: "tagsIds is required"})
@IsArray({message: "tagsIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each tagId must be a number" })
tagIds: number[];
}
