import { IsNotEmpty, IsNumber, IsString, IsArray, IsOptional, IsDateString, Min } from "class-validator";
import { Website } from "../website.entity";
import { PickType } from "@nestjs/mapped-types";

export class CreateWebsiteDto  extends PickType(Website, ['title', 'baseUrl'] as const) {
    

@IsNotEmpty()
@IsString()
title: string;

@IsNotEmpty()
@IsString()
baseUrl: string;

@IsOptional()
@IsNumber({}, { message: "organizationId must be a number" })
@Min(1, { message: "organizationId must be greater than 0" })
organizationId:number;

}