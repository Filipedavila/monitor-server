

import {  IsNumber, IsArray, IsOptional } from "class-validator";
import { PickType } from "@nestjs/mapped-types";
import { TeamMembers } from "../team-members.entity";

export class UpdateTeamMembersDto  extends PickType(TeamMembers, ['teamId'] as const) {
  @IsOptional()
  @IsArray({ message: "The 'add' field must be an array" })
  @IsNumber({}, { each: true, message: "Each ID in 'add' must be a number" })
  add?: number[];

  @IsOptional()
  @IsArray({ message: "The 'remove' field must be an array" })
  @IsNumber({}, { each: true, message: "Each ID in 'remove' must be a number" })
  remove?: number[];
}
