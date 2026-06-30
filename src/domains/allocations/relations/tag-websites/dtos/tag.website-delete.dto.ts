

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TagWebsite } from "../tag-websites.entity";

export class DeleteWebsiteTagsDto  extends PickType(TagWebsite, ['websiteId'] as const) {


@IsNotEmpty({message: "tagsIds is required"})
@IsArray({message: "tagsIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each tagId must be a number" })
tagIds: number[];
}
