

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TeamWebsites } from "../team-websites.entity";

export class DeleteTeamWebsitesDto  extends PickType(TeamWebsites, ['websiteId'] as const) {


@IsNotEmpty({message: "websiteIds is required"})
@IsArray({message: "websiteIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each websiteId must be a number" })
websiteIds: number[];
}
