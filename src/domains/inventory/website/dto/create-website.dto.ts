import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, IsDateString } from "class-validator";
import { Website } from "../website.entity";
import { PickType } from "@nestjs/mapped-types";

export class CreateWebsiteDto  extends PickType(Website, ['title', 'baseUrl', 'tags'] as const) {
    

@IsNotEmpty()
@IsString()
title: string;

@IsNotEmpty()
@IsString()
baseUrl: string;

@IsArray()
@IsOptional()
@IsNumber({}, { each: true })
organizationIds: number[];

@IsArray()
@IsString({ each: true })
@IsOptional()
tagsIds: string[];
}
