import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, IsDateString } from "class-validator";
import { Website } from "../website.entity";
import { PickType } from "@nestjs/mapped-types";
import { title } from "process";

export class CreateWebsiteDto  extends PickType(Website, ['title', 'baseUrl', 'organizations', 'tags'] as const) {
    
  
title: string;

baseUrl: string;

organizations: number[];

tagsIds: string[];

@IsNotEmpty()
@IsString()
declare title: string;

@IsNotEmpty()
@IsString()
declare baseUrl: string;

@IsArray()
@IsNumber({}, { each: true })
declare organizations: number[];

@IsArray()
@IsNumber({}, { each: true })
@IsOptional()
declare tagsIds: string[];
}
