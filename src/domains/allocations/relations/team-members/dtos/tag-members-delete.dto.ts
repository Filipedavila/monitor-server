

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TeamMembers } from "../team-members.entity";

export class DeleteTeamMembersDto  extends PickType(TeamMembers, ['teamId'] as const) {


@IsNotEmpty({message: "userIds is required"})
@IsArray({message: "userIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each userId must be a number" })
userIds: number[];
}
