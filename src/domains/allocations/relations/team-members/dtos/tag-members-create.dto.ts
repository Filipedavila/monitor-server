

import { IsNotEmpty, IsNumber, IsArray } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TeamMembers } from "../team-members.entity";

export class CreateTeamMembersDto  extends PickType(TeamMembers, ['teamId'] as const) {
@IsNotEmpty({message: "teamId is required"}  )
@IsNumber({}, { message:"teamId must be a number", each: true })
teamId:number;

@IsNotEmpty({message: "userIds is required"})
@IsArray({message: "userIds must be an array of numbers"})
@IsNumber({}, { each: true, message: "Each userId must be a number" })
userIds: number[];
}
