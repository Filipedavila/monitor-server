import { InputType, Field, Int } from '@nestjs/graphql';
import { IsOptional, IsInt, IsDate, Min } from 'class-validator';

@InputType() 
export class DashboardFilterInput {

  @Field(() => Int, { nullable: true })
  @IsOptional()
  @IsInt()
  @Min(1)
  directoryId?: number;

  @Field(() => Date, { nullable: true }) 
  @IsOptional()
  @IsDate()                          
  startDate?: Date;
}